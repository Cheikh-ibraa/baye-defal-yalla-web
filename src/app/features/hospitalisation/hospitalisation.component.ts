import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HospitalFacturationService, NiveauHotellerie } from '../../core/services/hospital-facturation.service';

interface HospRequest {
  id: string;
  reference: string;
  patientName: string;
  patientId: string;
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
  NORMAL: 'Routine', URGENT: 'Urgent', HIGH_URGENT: 'Prioritaire',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', VALIDATED: 'Acceptée', PAID: 'Financée', TERMINATED: 'Terminée', REJECTED: 'Rejetée',
};

@Component({
  selector: 'app-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalisationComponent implements OnInit {
  private readonly http    = inject(HttpClient);
  private readonly router  = inject(Router);
  private readonly cdr     = inject(ChangeDetectorRef);
  private readonly factSvc = inject(HospitalFacturationService);
  private readonly api     = environment.baseUrl;

  loading = true;
  searchQuery = '';
  activeFilter = 'all';
  rows: HospRequest[] = [];
  total = 0; page = 1; limit = 12; totalPages = 1;
  totalReqs = 0; pendingReqs = 0; validatedReqs = 0; monthRevenue = 0;

  filters = [
    { id: 'all',         label: 'Tous',        priority: '' },
    { id: 'routine',     label: 'Routine',     priority: 'NORMAL' },
    { id: 'urgents',     label: 'Urgents',     priority: 'URGENT' },
    { id: 'prioritaire', label: 'Prioritaire', priority: 'HIGH_URGENT' },
  ];
  private searchTimer: any;

  // ── Modal Accepter + Facturer ─────────────────────────────────────────────
  showModal     = false;
  acceptingRow: HospRequest | null = null;
  niveaux:      NiveauHotellerie[] = [];
  isAccepting   = false;
  acceptError   = '';
  form = { niveauHotellerieId: 0, nbJoursEstimes: 1, montantCaution: 0 };

  get selectedNiveau(): NiveauHotellerie | undefined {
    return this.niveaux.find(n => n.id === +this.form.niveauHotellerieId);
  }
  get totalHotellerie(): number { return (this.selectedNiveau?.prixHotellerieJ ?? 0) * this.form.nbJoursEstimes; }
  get totalSoins():     number { return (this.selectedNiveau?.prixSoinsJ      ?? 0) * this.form.nbJoursEstimes; }
  get montantTotal():   number { return this.totalHotellerie + this.totalSoins; }
  get cautionPct():     number {
    if (!this.montantTotal) return 0;
    return Math.round((this.form.montantCaution / this.montantTotal) * 1000) / 10;
  }

  ngOnInit(): void { this.loadStats(); this.loadRows(); }

  private loadStats(): void {
    this.http.get<any>(`${this.api}/hospital/requests/stats`)
      .pipe(catchError(() => of(null)))
      .subscribe(s => {
        if (s) {
          this.totalReqs     = s.total       ?? 0;
          this.pendingReqs   = s.pending      ?? 0;
          this.validatedReqs = s.validated    ?? 0;
          this.monthRevenue  = s.monthRevenue ?? 0;
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

  setFilter(id: string): void { this.activeFilter = id; this.page = 1; this.loadRows(); }
  onSearch():  void { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => { this.page = 1; this.loadRows(); }, 400); }
  goToPage(p: number): void { if (p < 1 || p > this.totalPages || p === this.page) return; this.page = p; this.loadRows(); }
  get pageNumbers(): number[] {
    const s = Math.max(1, this.page - 2), e = Math.min(this.totalPages, this.page + 2);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }
  viewDetail(r: HospRequest): void { this.router.navigate(['/hospital/hospitalisations', r.id]); }
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
  formatAmount(n: number): string { return Number(n).toLocaleString('fr-FR'); }
  formatRevenue(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toLocaleString('fr-FR');
  }
  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Ouvrir modal ─────────────────────────────────────────────────────────
  openAccept(r: HospRequest, event: Event): void {
    event.stopPropagation();
    this.acceptingRow = r;
    this.form         = { niveauHotellerieId: 0, nbJoursEstimes: 1, montantCaution: 0 };
    this.acceptError  = '';
    this.showModal    = true;
    this.cdr.markForCheck();
    this.factSvc.getNiveaux().pipe(catchError(() => of([]))).subscribe(list => {
      this.niveaux = list;
      this.cdr.markForCheck();
    });
  }

  closeModal(): void { this.showModal = false; this.acceptingRow = null; this.cdr.markForCheck(); }

  // ── Accepter + créer hospitalisation + générer facture ───────────────────
  confirmerAcceptation(): void {
    if (!this.form.niveauHotellerieId)                        { this.acceptError = 'Sélectionnez un niveau d\'hôtellerie.'; this.cdr.markForCheck(); return; }
    if (this.form.nbJoursEstimes < 1)                          { this.acceptError = 'Le nombre de jours doit être ≥ 1.'; this.cdr.markForCheck(); return; }
    if (!this.form.montantCaution || this.form.montantCaution <= 0) { this.acceptError = 'Saisissez le montant de la caution.'; this.cdr.markForCheck(); return; }
    if (this.form.montantCaution > this.montantTotal)           { this.acceptError = 'La caution ne peut pas dépasser le total.'; this.cdr.markForCheck(); return; }
    if (!this.acceptingRow) return;

    this.isAccepting = true;
    this.acceptError = '';

    // Étape 1 : accepter la demande
    this.http.patch(
      `${this.api}/hospital/requests/${this.acceptingRow.id}/hospitalization/accept`,
      { price: this.montantTotal },
    ).pipe(catchError(err => { throw err; }))
    .subscribe({
      next: () => {
        const r = this.acceptingRow!;
        // Étape 2 : créer l'hospitalisation
        this.http.post<any>(`${this.api}/hospital/hospitalizations`, {
          patientId:     r.patientId,
          patientName:   r.patientName,
          service:       r.service,
          admissionDate: new Date().toISOString(),
          totalAmount:   this.montantTotal,
        }).pipe(catchError(() => of(null)))
        .subscribe(hosp => {
          if (!hosp?.id) {
            this.isAccepting = false;
            this.showModal   = false;
            this.cdr.markForCheck();
            this.loadStats(); this.loadRows();
            this.router.navigate(['/hospital/factures']);
            return;
          }
          // Étape 3 : générer la facture
          this.factSvc.genererFacture({
            hospitalizationId:  hosp.id,
            niveauHotellerieId: +this.form.niveauHotellerieId,
            nbJoursEstimes:     this.form.nbJoursEstimes,
            montantCaution:     this.form.montantCaution,
          }).subscribe({
            next: (facture) => {
              this.isAccepting = false;
              this.showModal   = false;
              this.cdr.markForCheck();
              this.loadStats(); this.loadRows();
              this.router.navigate(['/hospital/factures', facture.id]);
            },
            error: () => {
              this.isAccepting = false;
              this.showModal   = false;
              this.cdr.markForCheck();
              this.loadStats(); this.loadRows();
              this.router.navigate(['/hospital/factures']);
            },
          });
        });
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
    this.http.patch(`${this.api}/hospital/requests/${r.id}/hospitalization/reject`, {})
      .subscribe({ next: () => { this.loadStats(); this.loadRows(); } });
  }
}
