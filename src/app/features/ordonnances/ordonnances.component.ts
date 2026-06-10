import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MedicalService, Prescription } from '../../core/services/medical.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-ordonnances',
  templateUrl: './ordonnances.component.html',
  styleUrls: ['./ordonnances.component.css']
})
export class OrdonnancesComponent implements OnInit, OnDestroy {
  prescriptions: Prescription[] = [];
  selectedPrescription: Prescription | null = null;
  qrCodeData: string | null = null;
  loadingQr = false;

  rechercheTexte = '';
  filtreStatut = 'Tous les statuts';
  menuStatutOuvert = false;

  pageActuelle = 1;
  elementsParPage = 10;
  totalElements = 0;
  totalPages = 0;
  isLastPage = false;
  isFirstPage = true;

  loading = false;
  error = false;
  errorMessage = '';

  statutsDisponibles = [
    'Tous les statuts',
    'Brouillon',
    'Transmise',
    'En don',
    'Financée',
    'QR Généré',
    'En préparation',
    'Livrée',
  ];

  private readonly statusApiMap: Record<string, string> = {
    'Brouillon':       'DRAFT',
    'Transmise':       'SENT_TO_PATIENT',
    'En don':          'SUBMITTED_FOR_DONATION',
    'Financée':        'FULLY_FUNDED',
    'QR Généré':       'QR_GENERATED',
    'En préparation':  'IN_PROGRESS',
    'Livrée':          'DELIVERED',
  };

  private destroy$ = new Subject<void>();

  constructor(
    private medicalService: MedicalService,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadOrdonnances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrdonnances(page = 1): void {
    this.loading = true;
    this.error = false;
    this.pageActuelle = page;

    const params: any = { page, limit: this.elementsParPage };
    const apiStatus = this.statusApiMap[this.filtreStatut];
    if (apiStatus) params['status'] = apiStatus;
    if (this.rechercheTexte.trim()) params['search'] = this.rechercheTexte.trim();

    this.medicalService.getDoctorPrescriptions(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.prescriptions = resp.data;
          this.totalElements = resp.total;
          this.totalPages = Math.ceil(resp.total / this.elementsParPage);
          this.isFirstPage = page === 1;
          this.isLastPage = page >= this.totalPages;
          this.loading = false;

          if (this.prescriptions.length > 0 && !this.selectedPrescription) {
            this.selectionnerOrdonnance(this.prescriptions[0]);
          }
        },
        error: () => {
          this.error = true;
          this.errorMessage = 'Impossible de charger les ordonnances.';
          this.loading = false;
        }
      });
  }

  selectionnerOrdonnance(p: Prescription): void {
    this.selectedPrescription = p;
    this.qrCodeData = null;
    this.loadQrCode(p.id);
  }

  loadQrCode(id: string): void {
    this.loadingQr = true;
    this.http.get<{ qrData: string; reference: string }>(`${environment.baseUrl}/medical/prescriptions/${id}/qr-code`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.qrCodeData = data.qrData || null;
          this.loadingQr = false;
        },
        error: () => {
          this.qrCodeData = null;
          this.loadingQr = false;
        }
      });
  }

  get ordonnancesFiltrees(): Prescription[] {
    if (!this.rechercheTexte.trim()) return this.prescriptions;
    const q = this.rechercheTexte.toLowerCase();
    return this.prescriptions.filter(p =>
      (p.reference || '').toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q)
    );
  }

  getPatientName(p: Prescription): string {
    return `Patient #${p.patientId.substring(0, 8).toUpperCase()}`;
  }

  getPharmacyName(_p: Prescription): string {
    return '—';
  }

  getStatutClass(status: string): string {
    const classes: Record<string, string> = {
      DRAFT:                   'bg-gray-100 text-gray-700',
      SENT_TO_PATIENT:         'bg-blue-100 text-blue-700',
      SUBMITTED_FOR_DONATION:  'bg-yellow-100 text-yellow-700',
      FULLY_FUNDED:            'bg-green-100 text-green-700',
      QR_GENERATED:            'bg-purple-100 text-purple-700',
      IN_PROGRESS:             'bg-orange-100 text-orange-700',
      DELIVERED:               'bg-teal-100 text-teal-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatutLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT:                   'Brouillon',
      SENT_TO_PATIENT:         'Transmise',
      SUBMITTED_FOR_DONATION:  'En don',
      FULLY_FUNDED:            'Financée',
      QR_GENERATED:            'QR Généré',
      IN_PROGRESS:             'En préparation',
      DELIVERED:               'Livrée',
    };
    return labels[status] || status;
  }

  changerFiltreStatut(statut: string): void {
    this.filtreStatut = statut;
    this.menuStatutOuvert = false;
    this.selectedPrescription = null;
    this.qrCodeData = null;
    this.loadOrdonnances(1);
  }

  rechercher(texte: string): void {
    this.rechercheTexte = texte;
    this.loadOrdonnances(1);
  }

  changerElementsParPage(nombre: number): void {
    this.elementsParPage = nombre;
    this.loadOrdonnances(1);
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) this.loadOrdonnances(this.pageActuelle - 1);
  }

  pageSuivante(): void {
    if (!this.isLastPage) this.loadOrdonnances(this.pageActuelle + 1);
  }

  get infosPagination(): string {
    const debut = (this.pageActuelle - 1) * this.elementsParPage + 1;
    const fin = Math.min(this.pageActuelle * this.elementsParPage, this.totalElements);
    if (this.totalElements === 0) return '0 - 0 sur 0';
    return `${debut} - ${fin} sur ${this.totalElements}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  getTotalAmount(p: Prescription): number {
    if (!p.items) return 0;
    return p.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  getQrCodeImageUrl(data: string): string {
    if (!data) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(data.trim())}`;
  }

  creerNouvelleOrdonnance(): void {
    this.router.navigate(['/create-ordonnance']);
  }

  sendToPatient(): void {
    if (!this.selectedPrescription) return;
    this.http.post(`${environment.baseUrl}/medical/prescriptions/${this.selectedPrescription.id}/send-to-patient`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.selectedPrescription) {
            this.selectedPrescription = { ...this.selectedPrescription, status: 'SENT_TO_PATIENT' };
          }
          this.loadOrdonnances(this.pageActuelle);
        },
        error: (err) => console.error('[ORDONNANCES] Erreur envoi:', err)
      });
  }

  exportPDF(): void {
    console.log('[ORDONNANCES] Export PDF à implémenter');
  }

  retry(): void {
    this.error = false;
    this.errorMessage = '';
    this.loadOrdonnances(this.pageActuelle);
  }
}
