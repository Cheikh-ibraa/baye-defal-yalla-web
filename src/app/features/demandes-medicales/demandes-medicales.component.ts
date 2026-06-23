import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface MedicalRequest {
  id:             string;
  reference:      string;
  patientName:    string;
  patientAge:     number;
  type:           string;
  service:        string;
  priority:       string;
  totalAmount:    number;
  fundedAmount:   number;
  status:         string;
  createdAt:      string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'En attente',
  VALIDATED:  'Validé',
  PAID:       'Payé',
  TERMINATED: 'Terminé',
  REJECTED:   'Rejeté',
};

const STATUS_CLASSES: Record<string, { badge: string; dot: string }> = {
  PENDING:    { badge: 'bg-[#FFF1E1] text-[#F97316]', dot: 'bg-[#F97316]' },
  VALIDATED:  { badge: 'bg-[#EAF2FF] text-[#2563EB]', dot: 'bg-[#2563EB]' },
  PAID:       { badge: 'bg-[#E6F7EE] text-[#22A06B]', dot: 'bg-[#22A06B]' },
  TERMINATED: { badge: 'bg-[#EFF2F6] text-[#6B7280]', dot: 'bg-[#6B7280]' },
  REJECTED:   { badge: 'bg-[#FEE2E2] text-[#DC2626]', dot: 'bg-[#DC2626]' },
};

const TYPE_LABELS: Record<string, string> = {
  PRESCRIPTION:    'Ordonnance',
  SURGERY:         'Chirurgie',
  LAB_EXAM:        'Examen Labo',
  CONSULTATION:    'Consultation',
  HOSPITALIZATION: 'Hospitalisation',
  OTHER:           'Autre',
};

const TYPE_ICONS: Record<string, string> = {
  PRESCRIPTION:    'document',
  SURGERY:         'surgery',
  LAB_EXAM:        'lab',
  CONSULTATION:    'consultation',
  HOSPITALIZATION: 'document',
  OTHER:           'document',
};

const AVATAR_COLORS = [
  'bg-[#E5F0FF] text-[#1D4ED8]',
  'bg-[#F3E8FF] text-[#8B5CF6]',
  'bg-[#DDF7E8] text-[#16A34A]',
  'bg-[#FEF3C7] text-[#D97706]',
  'bg-[#E6ECF7] text-[#334155]',
];

@Component({
  selector: 'app-demandes-medicales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demandes-medicales.component.html',
  styleUrls: ['./demandes-medicales.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesMedicalesComponent implements OnInit {

  loading      = true;
  loadError    = '';

  // Stats
  totalReqs    = 0;
  pendingReqs  = 0;
  validatedReqs = 0;
  monthRevenue = 0;

  // Table
  rows:       MedicalRequest[] = [];
  total       = 0;
  page        = 1;
  limit       = 10;
  totalPages  = 1;

  // Filters
  searchQuery  = '';
  statusFilter = '';
  typeFilter   = '';

  private searchTimer: any;
  private readonly api = environment.baseUrl;

  readonly statusOptions = [
    { value: '',           label: 'Tous les statuts' },
    { value: 'PENDING',    label: 'En attente' },
    { value: 'VALIDATED',  label: 'Validé' },
    { value: 'PAID',       label: 'Payé' },
    { value: 'TERMINATED', label: 'Terminé' },
    { value: 'REJECTED',   label: 'Rejeté' },
  ];

  readonly typeOptions = [
    { value: '',               label: 'Tous les types' },
    { value: 'PRESCRIPTION',   label: 'Ordonnance' },
    { value: 'SURGERY',        label: 'Chirurgie' },
    { value: 'LAB_EXAM',       label: 'Examen Labo' },
    { value: 'CONSULTATION',   label: 'Consultation' },
    { value: 'HOSPITALIZATION',label: 'Hospitalisation' },
    { value: 'OTHER',          label: 'Autre' },
  ];

  readonly tableColumns = ['Patient', 'Référence', 'Type de demande', 'Service', 'Montant (FCFA)', 'Date', 'Statut', 'Actions'];

  constructor(
    private http:   HttpClient,
    private router: Router,
    private cdr:    ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRows();
  }

  private loadStats(): void {
    this.http.get<any>(`${this.api}/hospital/requests/stats`)
      .pipe(catchError(() => of(null)))
      .subscribe(s => {
        if (s) {
          this.totalReqs     = s.total      ?? 0;
          this.pendingReqs   = s.pending    ?? 0;
          this.validatedReqs = s.validated  ?? 0;
          this.monthRevenue  = s.monthRevenue ?? 0;
        }
        this.cdr.markForCheck();
      });
  }

  loadRows(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, excludeType: 'HOSPITALIZATION' };
    if (this.searchQuery)  params.search = this.searchQuery;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.typeFilter)   params.type   = this.typeFilter;

    this.http.get<{ data: MedicalRequest[]; total: number; page: number; limit: number }>(
      `${this.api}/hospital/requests`, { params }
    ).pipe(catchError(() => of(null)))
     .subscribe(res => {
       if (res) {
         this.rows       = res.data ?? [];
         this.total      = res.total ?? 0;
         this.page       = res.page  ?? 1;
         this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
       } else {
         this.loadError = 'Impossible de charger les demandes.';
       }
       this.loading = false;
       this.cdr.markForCheck();
     });
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.loadRows(); }, 400);
  }

  onFilterChange(): void { this.page = 1; this.loadRows(); }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.loadRows();
  }

  get pageNumbers(): number[] {
    const start = Math.max(1, this.page - 2);
    const end   = Math.min(this.totalPages, this.page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get startItem(): number { return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1; }
  get endItem():   number { return Math.min(this.page * this.limit, this.total); }

  initials(name: string): string {
    const w = (name ?? '').trim().split(/\s+/).filter(Boolean);
    return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : (name ?? '?').substring(0, 2).toUpperCase();
  }

  avatarClass(index: number): string { return AVATAR_COLORS[index % AVATAR_COLORS.length]; }
  typeLabel(type: string): string    { return TYPE_LABELS[type]   ?? type; }
  typeIcon(type: string): string     { return TYPE_ICONS[type]    ?? 'document'; }
  statusLabel(s: string): string     { return STATUS_LABELS[s]    ?? s; }
  statusBadge(s: string): string     { return STATUS_CLASSES[s]?.badge ?? 'bg-gray-100 text-gray-600'; }
  statusDot(s: string): string       { return STATUS_CLASSES[s]?.dot   ?? 'bg-gray-400'; }

  formatAmount(amount: number): string {
    return (amount ?? 0).toLocaleString('fr-FR');
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatRevenue(amount: number): string {
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M FCFA';
    if (amount >= 1_000)     return (amount / 1_000).toFixed(0) + 'K FCFA';
    return (amount ?? 0).toLocaleString('fr-FR') + ' FCFA';
  }

  openDetail(id: string): void {
    this.router.navigate(['/hospital/demandes', id]);
  }

  // ── Modals Valider / Rejeter ──────────────────────────────────────────────────

  selectedRow: MedicalRequest | null = null;

  showValidateModal = false;
  validateDate  = '';
  validateTime  = '';
  validatePrice = '';
  validateNote  = '';

  showRejectModal = false;
  rejectReason = '';

  isSubmitting = false;

  isPending(row: MedicalRequest): boolean { return row.status === 'PENDING'; }

  openValidate(row: MedicalRequest, event: Event): void {
    event.stopPropagation();
    this.selectedRow   = row;
    this.validateDate  = '';
    this.validateTime  = '';
    this.validatePrice = '';
    this.validateNote  = '';
    this.showValidateModal = true;
  }

  openReject(row: MedicalRequest, event: Event): void {
    event.stopPropagation();
    this.selectedRow  = row;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeModals(): void {
    this.showValidateModal = false;
    this.showRejectModal   = false;
    this.selectedRow       = null;
    this.isSubmitting      = false;
    this.cdr.markForCheck();
  }

  confirmValidate(): void {
    if (!this.selectedRow) return;
    const row = this.selectedRow;

    if (row.type === 'HOSPITALIZATION') {
      const price = parseFloat(this.validatePrice);
      if (!this.validatePrice || isNaN(price) || price <= 0) {
        Swal.fire({ title: 'Montant requis', text: 'Veuillez saisir un montant valide.', icon: 'warning', confirmButtonColor: '#124A92', width: '400px' });
        return;
      }
      this.isSubmitting = true;
      this.http.patch(`${this.api}/hospital/requests/${row.id}/hospitalization/accept`, {
        price,
        note: this.validateNote || undefined,
      }).subscribe({
        next: () => {
          this.closeModals();
          Swal.fire({ title: 'Demande acceptée !', text: 'La demande d\'hospitalisation a été validée.', icon: 'success', confirmButtonColor: '#124A92', width: '420px' });
          this.loadStats();
          this.loadRows();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          Swal.fire({ title: 'Erreur', text: err?.error?.message ?? 'Impossible de valider la demande.', icon: 'error', confirmButtonColor: '#124A92', width: '400px' });
        },
      });
    } else {
      this.isSubmitting = true;
      this.http.patch(`${this.api}/hospital/requests/${row.id}/validate`, {}).subscribe({
        next: () => {
          this.closeModals();
          Swal.fire({ title: 'Demande validée !', icon: 'success', confirmButtonColor: '#124A92', width: '400px' });
          this.loadStats();
          this.loadRows();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          Swal.fire({ title: 'Erreur', text: err?.error?.message ?? 'Impossible de valider la demande.', icon: 'error', confirmButtonColor: '#124A92', width: '400px' });
        },
      });
    }
  }

  confirmReject(): void {
    if (!this.selectedRow) return;
    const row = this.selectedRow;
    const url = row.type === 'HOSPITALIZATION'
      ? `${this.api}/hospital/requests/${row.id}/hospitalization/reject`
      : `${this.api}/hospital/requests/${row.id}/reject`;

    this.isSubmitting = true;
    this.http.patch(url, { reason: this.rejectReason || undefined }).subscribe({
      next: () => {
        this.closeModals();
        Swal.fire({ title: 'Demande rejetée', icon: 'info', confirmButtonColor: '#124A92', width: '400px' });
        this.loadStats();
        this.loadRows();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        Swal.fire({ title: 'Erreur', text: err?.error?.message ?? 'Impossible de rejeter la demande.', icon: 'error', confirmButtonColor: '#124A92', width: '400px' });
      },
    });
  }
}
