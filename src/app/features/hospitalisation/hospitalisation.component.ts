import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface HospRequest {
  id: string;
  reference: string;
  patientName: string;
  patientAge: number;
  referentDoctorName: string;
  service: string;
  description: string;
  priority: 'NORMAL' | 'URGENT' | 'HIGH_URGENT';
  status: string;
  totalAmount: number;
  fundedAmount: number;
  createdAt: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL:      'Routine',
  URGENT:      'Urgent',
  HIGH_URGENT: 'Prioritaire',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'En attente',
  VALIDATED:  'Acceptée',
  PAID:       'Financée',
  TERMINATED: 'Terminée',
  REJECTED:   'Rejetée',
};

@Component({
  selector: 'app-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalisationComponent implements OnInit {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr    = inject(ChangeDetectorRef);
  private readonly api    = environment.baseUrl;

  loading      = true;
  searchQuery  = '';
  activeFilter = 'all';

  rows:         HospRequest[] = [];
  total         = 0;
  page          = 1;
  limit         = 12;
  totalPages    = 1;

  // Stats
  totalReqs     = 0;
  pendingReqs   = 0;
  validatedReqs = 0;
  monthRevenue  = 0;

  filters = [
    { id: 'all',        label: 'Tous',        priority: '' },
    { id: 'routine',    label: 'Routine',     priority: 'NORMAL' },
    { id: 'urgents',    label: 'Urgents',     priority: 'URGENT' },
    { id: 'prioritaire',label: 'Prioritaire', priority: 'HIGH_URGENT' },
  ];

  private searchTimer: any;

  // ── Modal Accepter ──────────────────────────────────────────────────────────
  showAcceptModal  = false;
  acceptingRow:    HospRequest | null = null;
  acceptPrice      = '';
  acceptNote       = '';
  isAccepting      = false;
  acceptError      = '';

  ngOnInit(): void {
    this.loadStats();
    this.loadRows();
  }

  private loadStats(): void {
    this.http.get<any>(`${this.api}/hospital/requests/stats`)
      .pipe(catchError(() => of(null)))
      .subscribe(s => {
        if (s) {
          this.totalReqs     = s.total        ?? 0;
          this.pendingReqs   = s.pending       ?? 0;
          this.validatedReqs = s.validated     ?? 0;
          this.monthRevenue  = s.monthRevenue  ?? 0;
        }
        this.cdr.markForCheck();
      });
  }

  loadRows(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, type: 'HOSPITALIZATION' };
    if (this.searchQuery) params.search = this.searchQuery;
    const pf = this.filters.find(f => f.id === this.activeFilter);
    if (pf?.priority) params.priority = pf.priority;

    this.http.get<{ data: HospRequest[]; total: number; page: number }>(
      `${this.api}/hospital/requests`, { params }
    ).pipe(catchError(() => of(null)))
     .subscribe(res => {
       if (res) {
         this.rows       = res.data  ?? [];
         this.total      = res.total ?? 0;
         this.page       = res.page  ?? 1;
         this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
       }
       this.loading = false;
       this.cdr.markForCheck();
     });
  }

  setFilter(id: string): void {
    this.activeFilter = id;
    this.page = 1;
    this.loadRows();
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.loadRows(); }, 400);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.loadRows();
  }

  get pageNumbers(): number[] {
    const s = Math.max(1, this.page - 2);
    const e = Math.min(this.totalPages, this.page + 2);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }

  viewDetail(r: HospRequest): void {
    this.router.navigate(['/hospital/hospitalisations', r.id]);
  }

  isPending(r: HospRequest): boolean { return r.status === 'PENDING'; }

  priorityLabel(p: string): string { return PRIORITY_LABELS[p] ?? p; }
  statusLabel(s: string):   string { return STATUS_LABELS[s]   ?? s; }

  priorityBadgeClass(p: string): string {
    if (p === 'URGENT')      return 'bg-[#FEE2E2] text-[#DC2626]';
    if (p === 'HIGH_URGENT') return 'bg-[#FDF4FF] text-[#9333EA]';
    return 'bg-[#EEF2FF] text-[#3949AB]';
  }

  statusBadgeClass(s: string): string {
    if (s === 'PENDING')   return 'bg-[#FFF3E8] text-[#F97316]';
    if (s === 'VALIDATED') return 'bg-[#E8F5E9] text-[#2E7D32]';
    if (s === 'PAID')      return 'bg-[#E3F2FD] text-[#1565C0]';
    if (s === 'REJECTED')  return 'bg-[#FEE2E2] text-[#DC2626]';
    return 'bg-gray-100 text-gray-500';
  }

  formatAmount(n: number): string { return n.toLocaleString('fr-FR'); }

  formatRevenue(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toLocaleString('fr-FR');
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Accept modal ────────────────────────────────────────────────────────────

  openAccept(r: HospRequest, event: Event): void {
    event.stopPropagation();
    this.acceptingRow   = r;
    this.acceptPrice    = '';
    this.acceptNote     = '';
    this.acceptError    = '';
    this.showAcceptModal = true;
    this.cdr.markForCheck();
  }

  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.acceptingRow    = null;
    this.cdr.markForCheck();
  }

  confirmerAcceptation(): void {
    const price = parseFloat(this.acceptPrice);
    if (!this.acceptPrice || isNaN(price) || price <= 0) {
      this.acceptError = 'Veuillez saisir un montant valide.';
      this.cdr.markForCheck();
      return;
    }
    if (!this.acceptingRow) return;
    this.isAccepting = true;
    this.acceptError = '';

    this.http.patch(
      `${this.api}/hospital/requests/${this.acceptingRow.id}/hospitalization/accept`,
      { price, note: this.acceptNote || undefined },
    ).subscribe({
      next: () => {
        this.isAccepting     = false;
        this.showAcceptModal = false;
        this.cdr.markForCheck();
        this.loadStats();
        this.loadRows();
      },
      error: (err) => {
        this.isAccepting = false;
        this.acceptError = err?.error?.message ?? 'Erreur lors de l\'acceptation.';
        this.cdr.markForCheck();
      },
    });
  }

  rejectRequest(r: HospRequest, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Refuser la demande de ${r.patientName} ?`)) return;
    this.http.patch(
      `${this.api}/hospital/requests/${r.id}/hospitalization/reject`,
      {},
    ).subscribe({
      next: () => { this.loadStats(); this.loadRows(); },
    });
  }
}
