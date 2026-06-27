import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  HospitalFacturationService, Facture, FactureStatut, NiveauHotellerie,
} from '../../core/services/hospital-facturation.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Hospitalization {
  id: string;
  patientName: string;
  admissionRef: string;
  service: string;
}

const STATUT_LABELS: Record<FactureStatut, string> = {
  BROUILLON:           'Brouillon',
  OUVERTE:             'Ouverte',
  CAUTION_ATTEINTE:    'Caution atteinte',
  PARTIELLEMENT_PAYEE: 'Partielle',
  SOLDEE:              'Soldée',
  CLOTUREE:            'Clôturée',
};

@Component({
  selector: 'app-facturation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturationComponent implements OnInit {
  private readonly svc    = inject(HospitalFacturationService);
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr    = inject(ChangeDetectorRef);

  loading  = true;
  factures: Facture[] = [];

  // Modal
  showModal      = false;
  hospLoading    = false;
  hospitalisations: Hospitalization[] = [];
  niveaux: NiveauHotellerie[]         = [];

  form = {
    hospitalizationId:  '',
    niveauHotellerieId: 0,
    nbJoursEstimes:     1,
    montantCaution:     0,
  };
  submitting = false;
  formError  = '';

  get selectedNiveau(): NiveauHotellerie | undefined {
    return this.niveaux.find(n => n.id === +this.form.niveauHotellerieId);
  }

  get totalHotellerie(): number {
    return (this.selectedNiveau?.prixHotellerieJ ?? 0) * this.form.nbJoursEstimes;
  }

  get totalSoins(): number {
    return (this.selectedNiveau?.prixSoinsJ ?? 0) * this.form.nbJoursEstimes;
  }

  get montantTotal(): number {
    return this.totalHotellerie + this.totalSoins;
  }

  get cautionPct(): number {
    if (!this.montantTotal) return 0;
    return Math.round((this.form.montantCaution / this.montantTotal) * 1000) / 10;
  }

  ngOnInit(): void { this.loadFactures(); }

  loadFactures(): void {
    this.loading = true;
    this.svc.getFactures().pipe(catchError(() => of([]))).subscribe(data => {
      this.factures = data;
      this.loading  = false;
      this.cdr.markForCheck();
    });
  }

  openModal(): void {
    this.showModal  = true;
    this.formError  = '';
    this.submitting = false;
    this.form = { hospitalizationId: '', niveauHotellerieId: 0, nbJoursEstimes: 1, montantCaution: 0 };
    this.hospLoading = true;
    this.cdr.markForCheck();

    this.http.get<any[]>(`${environment.baseUrl}/hospital/hospitalizations`)
      .pipe(catchError(() => of([])))
      .subscribe(list => {
        this.hospitalisations = list;
        this.hospLoading = false;
        this.cdr.markForCheck();
      });

    this.svc.getNiveaux().pipe(catchError(() => of([]))).subscribe(list => {
      this.niveaux = list;
      this.cdr.markForCheck();
    });
  }

  closeModal(): void { this.showModal = false; this.cdr.markForCheck(); }

  submit(): void {
    if (!this.form.hospitalizationId) { this.formError = 'Sélectionnez une hospitalisation.'; this.cdr.markForCheck(); return; }
    if (!this.form.niveauHotellerieId) { this.formError = 'Sélectionnez un niveau d\'hôtellerie.'; this.cdr.markForCheck(); return; }
    if (this.form.nbJoursEstimes < 1) { this.formError = 'Le nombre de jours doit être ≥ 1.'; this.cdr.markForCheck(); return; }
    if (!this.form.montantCaution || this.form.montantCaution <= 0) { this.formError = 'Saisissez le montant de la caution.'; this.cdr.markForCheck(); return; }
    if (this.form.montantCaution > this.montantTotal) { this.formError = 'La caution ne peut pas dépasser le montant total.'; this.cdr.markForCheck(); return; }

    this.submitting = true;
    this.formError  = '';
    this.svc.genererFacture({ ...this.form, niveauHotellerieId: +this.form.niveauHotellerieId }).subscribe({
      next: (f) => {
        this.submitting = false;
        this.showModal  = false;
        this.cdr.markForCheck();
        this.router.navigate(['/hospital/factures', f.id]);
      },
      error: (err) => {
        this.submitting = false;
        this.formError  = err?.error?.message ?? 'Erreur lors de la génération.';
        this.cdr.markForCheck();
      },
    });
  }

  goDetail(f: Facture): void { this.router.navigate(['/hospital/factures', f.id]); }

  statutLabel(s: FactureStatut): string { return STATUT_LABELS[s] ?? s; }

  statutClass(s: FactureStatut): string {
    const map: Record<string, string> = {
      BROUILLON:           'bg-gray-100 text-gray-500',
      OUVERTE:             'bg-[#EEF4FF] text-[#104382]',
      CAUTION_ATTEINTE:    'bg-[#FFF3E8] text-[#F97316]',
      PARTIELLEMENT_PAYEE: 'bg-[#FEF9C3] text-[#92400E]',
      SOLDEE:              'bg-[#E8F5E9] text-[#2E7D32]',
      CLOTUREE:            'bg-gray-100 text-gray-400',
    };
    return map[s] ?? 'bg-gray-100 text-gray-500';
  }

  fmt(n: number): string { return Number(n).toLocaleString('fr-FR'); }
  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
