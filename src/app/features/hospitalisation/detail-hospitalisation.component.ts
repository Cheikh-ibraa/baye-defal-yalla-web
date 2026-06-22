import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ReqDetail {
  id: string;
  reference: string;
  patientName: string;
  patientAge: number | null;
  referentDoctorName: string;
  service: string;
  actType: string;
  serviceUnit: string;
  serviceFloor: string;
  serviceChief: string;
  description: string;
  priority: string;
  status: string;
  totalAmount: number;
  fundedAmount: number;
  documents: { name: string; size: string; url: string }[];
  actionHistory: { action: string; description: string; actor?: string; date: string }[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'En attente',
  VALIDATED:  'Acceptée',
  PAID:       'Financée',
  TERMINATED: 'Terminée',
  REJECTED:   'Rejetée',
};

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL:      'Routine',
  URGENT:      'Urgent',
  HIGH_URGENT: 'Prioritaire',
};

@Component({
  selector: 'app-detail-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-hospitalisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailHospitalisationComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http   = inject(HttpClient);
  private readonly cdr    = inject(ChangeDetectorRef);
  private readonly api    = environment.baseUrl;

  id      = '';
  loading = true;
  detail: ReqDetail | null = null;

  // ── Accept modal ──────────────────────────────────────────────────────────
  showAcceptModal = false;
  acceptPrice     = '';
  acceptNote      = '';
  isAccepting     = false;
  acceptError     = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  private load(): void {
    this.http.get<any>(`${this.api}/hospital/requests/${this.id}`)
      .pipe(catchError(() => of(null)))
      .subscribe(r => {
        this.detail  = r ? this.map(r) : null;
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  private map(r: any): ReqDetail {
    return {
      id:               r.id,
      reference:        r.reference ?? ('HOSP-' + r.id.slice(0, 8).toUpperCase()),
      patientName:      r.patientName  ?? '—',
      patientAge:       r.patientAge   ?? null,
      referentDoctorName: r.referentDoctorName ?? '—',
      service:          r.service      ?? '—',
      actType:          r.actType      ?? '',
      serviceUnit:      r.serviceUnit  ?? '',
      serviceFloor:     r.serviceFloor ?? '',
      serviceChief:     r.serviceChief ?? '',
      description:      r.description  ?? '',
      priority:         r.priority     ?? 'NORMAL',
      status:           r.status       ?? 'PENDING',
      totalAmount:      Number(r.totalAmount  ?? 0),
      fundedAmount:     Number(r.fundedAmount ?? 0),
      documents:        Array.isArray(r.documents) ? r.documents : [],
      actionHistory:    Array.isArray(r.actionHistory) ? r.actionHistory : [],
      createdAt:        r.createdAt    ?? '',
    };
  }

  back(): void {
    this.router.navigate(['/hospital/hospitalisations']);
  }

  initials(name: string): string {
    return (name || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  statusLabel(s: string):   string { return STATUS_LABELS[s]   ?? s; }
  priorityLabel(p: string): string { return PRIORITY_LABELS[p] ?? p; }

  statusBadgeClass(s: string): string {
    if (s === 'PENDING')   return 'bg-[#FFF3E8] text-[#F97316]';
    if (s === 'VALIDATED') return 'bg-[#E8F5E9] text-[#2E7D32]';
    if (s === 'PAID')      return 'bg-[#E3F2FD] text-[#1565C0]';
    if (s === 'REJECTED')  return 'bg-[#FEE2E2] text-[#DC2626]';
    return 'bg-gray-100 text-gray-500';
  }

  priorityBadgeClass(p: string): string {
    if (p === 'URGENT')      return 'bg-[#FEE2E2] text-[#DC2626]';
    if (p === 'HIGH_URGENT') return 'bg-[#FDF4FF] text-[#9333EA]';
    return 'bg-[#EEF2FF] text-[#3949AB]';
  }

  priorityAlertClass(p: string): string {
    if (p === 'HIGH_URGENT') return 'border-[#9333EA] bg-[#FDF4FF] text-[#9333EA]';
    return 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]';
  }

  fundingPercent(d: ReqDetail): number {
    if (!d.totalAmount) return 0;
    return Math.min(100, Math.round((d.fundedAmount / d.totalAmount) * 100));
  }

  formatAmount(n: number): string {
    return Number(n).toLocaleString('fr-FR');
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // ── Accept ────────────────────────────────────────────────────────────────

  openAccept(): void {
    this.acceptPrice = '';
    this.acceptNote  = '';
    this.acceptError = '';
    this.showAcceptModal = true;
    this.cdr.markForCheck();
  }

  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.cdr.markForCheck();
  }

  confirmerAcceptation(): void {
    const price = parseFloat(this.acceptPrice);
    if (!this.acceptPrice || isNaN(price) || price <= 0) {
      this.acceptError = 'Veuillez saisir un montant valide.';
      this.cdr.markForCheck();
      return;
    }
    this.isAccepting = true;
    this.acceptError = '';

    this.http.patch(
      `${this.api}/hospital/requests/${this.id}/hospitalization/accept`,
      { price, note: this.acceptNote || undefined },
    ).subscribe({
      next: (r: any) => {
        this.isAccepting     = false;
        this.showAcceptModal = false;
        this.detail          = this.map(r);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isAccepting = false;
        this.acceptError = err?.error?.message ?? 'Erreur lors de l\'acceptation.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Reject ────────────────────────────────────────────────────────────────

  rejectRequest(): void {
    if (!this.detail) return;
    if (!confirm(`Refuser la demande d'hospitalisation de ${this.detail.patientName} ?`)) return;
    this.http.patch(
      `${this.api}/hospital/requests/${this.id}/hospitalization/reject`,
      {},
    ).pipe(catchError(() => of(null)))
     .subscribe(r => {
       if (r) this.detail = this.map(r);
       this.cdr.markForCheck();
     });
  }
}
