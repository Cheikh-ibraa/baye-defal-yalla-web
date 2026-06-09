import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

type PrescriptionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PREPARATION'
  | 'READY'
  | 'DELIVERED'
  | string;

interface Patient { prenom: string; nom: string; }
interface Doctor { prenom: string; nom: string; }
interface Medication { id: number; name: string; dosage: string; quantity: number; price: number; }
interface Pharmacy { id: number; name: string; }

interface Prescription {
  id: number;
  patient: Patient;
  doctor: Doctor;
  createdAt: string;
  status: PrescriptionStatus;
  medications: Medication[];
  amount?: number;
  pharmacy?: Pharmacy;
  prescriptionFile?: string;
}

interface ValidateCommandeMedication { medicationId: number; unitPrice: number; }
interface ValidateCommandeRequest { prescriptionId: number; amount: number; medications: ValidateCommandeMedication[]; }
interface ReadyCommandeRequest { prescriptionId: number; }

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.css']
})
export class CommandesComponent implements OnInit, OnDestroy {

  // ── Mock data ──────────────────────────────────────────────────────────────
  private mockData: Prescription[] = [
    {
      id: 1,
      patient: { prenom: 'Alice', nom: 'Martin' },
      doctor: { prenom: 'Jean', nom: 'Dupont' },
      createdAt: new Date().toISOString(),
      status: 'IN_PREPARATION',
      medications: [
        { id: 10, name: 'Paracétamol', dosage: '500mg', quantity: 2, price: 1200 },
        { id: 11, name: 'Ibuprofène', dosage: '400mg', quantity: 1, price: 2000 }
      ],
      amount: 4400
    }
  ];

  private state = {
    getPrescriptions: (_pharmacyId: number, _page: number, _size: number) =>
      of({ content: this.mockData, totalElements: this.mockData.length, totalPages: 1 }),
    getPrescriptionDetails: (id: number) =>
      of(this.mockData.find(p => p.id === id) ?? null),
    validatePrescription: (_payload: ValidateCommandeRequest) => of({}),
    markAsReady: (_payload: ReadyCommandeRequest) => of({})
  };

  // ── Data ───────────────────────────────────────────────────────────────────
  prescriptions: Prescription[] = [];
  selectedPrescription: Prescription | null = null;
  filteredPrescriptions: Prescription[] = [];
  paginatedPrescriptions: Prescription[] = [];

  // ── UI state ───────────────────────────────────────────────────────────────
  saisieMode: 'medicament' | 'total' = 'medicament';
  activeTab = 'medicaments';
  montantTotal = 0;
  loading = false;
  error = '';
  showMobileDetails = false;
  isMobileView = false;
  isTabletView = false;
  searchTerm = '';
  showFilter = false;
  showDemandeModal = false;
  priorite: 'Normal' | 'Prioritaire' | 'Urgent' = 'Urgent';
  messageOptionnel = '';
  medicationAvailability: Map<number, boolean> = new Map();

  // ── Pagination ─────────────────────────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 100;
  totalItems = 0;
  totalPages = 0;

  Math = Math;

  private userId = 0;
  private pharmacyId = 0;
  private destroy$ = new Subject<void>();

  constructor() { this.checkScreenSize(); }

  ngOnInit(): void {
    this.initializeUserData();
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void { this.checkScreenSize(); }

  // ── Screen size ────────────────────────────────────────────────────────────
  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isMobileView = width < 768;
    this.isTabletView = width >= 768 && width < 1024;
    if (width >= 1024) this.showMobileDetails = false;
  }

  toggleMobileView(): void { this.showMobileDetails = !this.showMobileDetails; }

  // ── Init ───────────────────────────────────────────────────────────────────
  private initializeUserData(): void {
    this.userId = 1;
    this.pharmacyId = 1;
    this.loadCommandes();
  }

  // ── Load data ──────────────────────────────────────────────────────────────
  loadCommandes(): void {
    if (this.pharmacyId <= 0) {
      this.showAlert('Erreur', 'Aucune pharmacie associée à votre compte', 'warning');
      return;
    }
    this.loading = true;
    this.error = '';

    this.state.getPrescriptions(this.pharmacyId, this.currentPage - 1, this.itemsPerPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.prescriptions = response.content;
          this.filteredPrescriptions = [...this.prescriptions];
          this.totalItems = response.totalElements;
          this.totalPages = response.totalPages;
          this.updatePagination();
          this.loading = false;
        },
        error: () => {
          this.error = 'Erreur lors du chargement des commandes';
          this.loading = false;
          this.showAlert('Erreur', 'Impossible de charger les commandes', 'error');
        }
      });
  }

  loadCommandeDetails(prescriptionId: number): void {
    this.state.getPrescriptionDetails(prescriptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescription: any) => {
          this.selectedPrescription = prescription;
          if (this.saisieMode === 'total') this.montantTotal = prescription?.amount ?? 0;
        },
        error: () => this.showAlert('Erreur', 'Impossible de charger les détails de la commande', 'error')
      });
  }

  refreshData(): void { this.loadCommandes(); }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectPrescription(prescription: Prescription): void {
    this.loadCommandeDetails(prescription.id);
    if (this.isMobileView || this.isTabletView) this.showMobileDetails = true;
  }

  // ── Saisie mode ────────────────────────────────────────────────────────────
  setSaisieMode(mode: 'medicament' | 'total'): void {
    this.saisieMode = mode;
    if (mode === 'total' && this.selectedPrescription && this.montantTotal === 0)
      this.montantTotal = this.selectedPrescription.amount ?? 0;
  }

  // ── Medications ────────────────────────────────────────────────────────────
  updateMedicament(index: number, field: string, event: any): void {
    if (!this.selectedPrescription) return;
    const val = event.target.value;
    const med = this.selectedPrescription.medications[index];
    if (field === 'name') med.name = val;
    else if (field === 'dosage') med.dosage = val;
    else if (field === 'quantity') med.quantity = parseInt(val) || 0;
    else if (field === 'price') med.price = parseFloat(val) || 0;
  }

  ajouterMedicament(): void {
    if (!this.selectedPrescription) return;
    this.selectedPrescription.medications.push({ id: 0, name: '', dosage: '', quantity: 0, price: 0 });
  }

  supprimerMedicament(index: number): void {
    if (!this.selectedPrescription) return;
    if (this.selectedPrescription.medications.length <= 1) {
      this.showAlert('Impossible', 'Vous devez garder au moins un médicament dans la commande.', 'warning');
      return;
    }
    Swal.fire({
      title: 'Supprimer ce médicament ?', text: 'Cette action est irréversible.', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#FF6B6B', cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.selectedPrescription!.medications.splice(index, 1);
        this.showAlert('Supprimé !', 'Le médicament a été supprimé.', 'success');
      }
    });
  }

  // ── Availability toggle ────────────────────────────────────────────────────
  toggleAvailability(medId: number): void {
    this.medicationAvailability.set(medId, !this.medicationAvailability.get(medId));
  }

  isMedAvailable(medId: number): boolean {
    return this.medicationAvailability.get(medId) ?? false;
  }

  // ── Totals ─────────────────────────────────────────────────────────────────
  getTotal(): number {
    return this.saisieMode === 'total' ? this.montantTotal : this.calculerTotal();
  }

  calculerTotal(): number {
    if (!this.selectedPrescription) return 0;
    return this.selectedPrescription.medications.reduce((sum, m) => sum + (m.price * m.quantity), 0);
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  accepterCommande(): void {
    if (!this.selectedPrescription) return;

    if (this.saisieMode === 'medicament') {
      const invalid = this.selectedPrescription.medications.some(m => !m.price || m.price <= 0);
      if (invalid) {
        this.showAlert('Validation incomplète', 'Veuillez renseigner le prix unitaire (P U) pour chaque médicament.', 'warning');
        return;
      }
    } else if (!this.montantTotal || this.montantTotal <= 0) {
      this.showAlert('Montant invalide', 'Veuillez saisir un montant total valide.', 'warning');
      return;
    }

    const ref = this.getPrescriptionReference(this.selectedPrescription.id);
    const patient = this.getPatientFullName(this.selectedPrescription);

    Swal.fire({
      title: 'Accepter cette commande ?',
      html: `<div style="text-align:center;padding:10px">
        <p style="margin:0;font-size:16px;font-weight:500">Commande N° <strong style="color:#00B894">${ref}</strong></p>
        <p style="margin:12px 0 0;font-size:14px;color:#666">Patient: <strong>${patient}</strong></p>
        <p style="margin:8px 0 0;font-size:14px;color:#666">Montant: <strong>${this.getTotal().toLocaleString('fr-FR')} FCFA</strong></p>
      </div>`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#00B894', cancelButtonColor: '#6c757d',
      confirmButtonText: '✓ Oui, accepter', cancelButtonText: '✕ Annuler',
      allowOutsideClick: false, allowEscapeKey: false
    }).then(result => {
      if (!result.isConfirmed) return;
      this.loading = true;

      const validationData: ValidateCommandeRequest = this.saisieMode === 'medicament'
        ? {
            prescriptionId: this.selectedPrescription!.id,
            amount: this.calculerTotal(),
            medications: this.selectedPrescription!.medications
              .filter(m => m.id > 0)
              .map(m => ({ medicationId: m.id, unitPrice: m.price }))
          }
        : { prescriptionId: this.selectedPrescription!.id, amount: this.montantTotal, medications: [] };

      this.state.validatePrescription(validationData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.loading = false; Swal.fire({ title: 'Acceptée !', text: `La commande ${ref} a été acceptée avec succès.`, icon: 'success', confirmButtonColor: '#00B894' }); this.loadCommandes(); },
          error: () => { this.loading = false; this.showAlert('Erreur', 'Impossible d\'accepter la commande. Veuillez réessayer.', 'error'); }
        });
    });
  }

  marquerCommandePretePourLivraison(): void {
    if (!this.selectedPrescription || this.selectedPrescription.status !== 'IN_PREPARATION') return;
    const ref = this.getPrescriptionReference(this.selectedPrescription.id);

    Swal.fire({
      html: `<div class="text-center px-2 pt-2 pb-1">
        <div class="w-20 h-20 border-[6px] border-[#E6B27B] rounded-full flex items-center justify-center mx-auto mb-5">
          <span class="text-5xl leading-none text-[#E6B27B] font-medium">!</span>
        </div>
        <h3 class="text-3xl font-medium text-[#2B2B33] mb-3">Confirmer la préparation</h3>
        <p class="text-lg leading-7 text-[#3E3E47]">Êtes-vous sûr de vouloir marquer cette commande<br>comme <strong class="font-bold text-[#2B2B33]">prête pour livraison</strong> ?</p>
      </div>`,
      showCancelButton: true, showConfirmButton: true,
      confirmButtonText: 'Oui, confirmer', cancelButtonText: 'Annuler',
      buttonsStyling: false, allowOutsideClick: false, allowEscapeKey: false,
      customClass: {
        popup: 'rounded-[20px] p-6 sm:p-7',
        actions: 'flex items-center justify-center gap-4 mt-6',
        confirmButton: 'bg-[#54B796] text-white rounded-md px-6 py-2.5 text-base font-medium hover:bg-[#45A688] transition-colors',
        cancelButton: 'bg-transparent text-[#FF5A5F] px-3 py-2.5 text-base font-medium'
      }
    }).then(result => {
      if (!result.isConfirmed || !this.selectedPrescription) return;
      this.loading = true;

      this.state.markAsReady({ prescriptionId: this.selectedPrescription.id })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.loading = false; Swal.fire({ title: 'Succès', text: `La commande ${ref} est maintenant prête pour livraison.`, icon: 'success', confirmButtonColor: '#00B894' }); this.loadCommandes(); },
          error: () => { this.loading = false; this.showAlert('Erreur', 'Impossible de marquer la commande comme prête pour livraison.', 'error'); }
        });
    });
  }

  refuserCommande(): void {
    if (!this.selectedPrescription) return;
    const ref = this.getPrescriptionReference(this.selectedPrescription.id);

    Swal.fire({
      title: 'Confirmation',
      html: `Souhaitez-vous <strong>refuser</strong> cette commande ?`,
      iconHtml: '<div style="width:60px;height:60px;border-radius:50%;border:3px solid #F5A623;display:flex;align-items:center;justify-content:center;font-size:28px;color:#F5A623;font-weight:bold">!</div>',
      customClass: { icon: 'border-0' },
      showCancelButton: true,
      confirmButtonColor: '#F36B6B', cancelButtonColor: 'transparent',
      confirmButtonText: 'Oui, refuser', cancelButtonText: 'Annuler'
    }).then(result => {
      if (!result.isConfirmed) return;
      Swal.fire({
        title: 'Motif du rejet',
        html: `<div style="text-align:left">
          <label style="font-size:14px;color:#374151;display:block;margin-bottom:8px">Commentaire</label>
          <textarea id="swal-motif" placeholder="Saisir" rows="4"
            style="width:100%;border:1px solid #D1D5DB;border-radius:8px;padding:10px;font-size:14px;resize:none;outline:none"></textarea>
        </div>`,
        showCancelButton: true,
        confirmButtonColor: '#F36B6B', cancelButtonColor: 'transparent',
        confirmButtonText: 'Soumettre', cancelButtonText: 'Annuler',
        showCloseButton: true,
        preConfirm: () => (document.getElementById('swal-motif') as HTMLTextAreaElement)?.value || ''
      }).then(motifResult => {
        if (!motifResult.isConfirmed) return;
        this.showAlert('Refus enregistré', `La commande ${ref} a été refusée.`, 'success');
      });
    });
  }

  // ── Demande complément ─────────────────────────────────────────────────────
  ouvrirDemandeComplement(): void {
    this.priorite = 'Urgent';
    this.messageOptionnel = '';
    this.showDemandeModal = true;
  }

  fermerDemandeModal(): void { this.showDemandeModal = false; }

  publierDemande(): void {
    this.showDemandeModal = false;
    Swal.fire({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;padding:24px 16px 8px">
          <div style="width:90px;height:90px;border-radius:50%;border:3px dashed #4FBFA5;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
            <div style="width:70px;height:70px;border-radius:50%;background:#4FBFA5;display:flex;align-items:center;justify-content:center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <p style="font-size:16px;font-weight:600;color:#1E293B;margin:0">Demande publiée avec succès</p>
        </div>
      `,
      showConfirmButton: false,
      timer: 2500,
      width: 320,
      padding: '0',
      customClass: { popup: 'rounded-2xl' }
    });
  }

  // ── QR Code ────────────────────────────────────────────────────────────────
  downloadQrCode(): void { this.showAlert('Télécharger QR', 'Téléchargement du QR code...', 'info'); }

  printQrCode(): void { window.print(); }

  scanQrCode(): void {
    if (!this.selectedPrescription) return;
    const ref = this.getPrescriptionReference(this.selectedPrescription.id);
    Swal.fire({
      title: 'Scanner un QR Code',
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:8px 0">
        <div style="background:#4a4a4a;border-radius:12px;padding:20px;width:220px;height:220px;display:flex;align-items:center;justify-content:center">
          <div style="position:relative;width:180px;height:180px">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ref}" style="width:100%;height:100%;border-radius:4px"/>
          </div>
        </div>
        <p style="font-size:14px;color:#6B7280;text-align:center;max-width:280px">Placez le QR Code de la patiente devant la caméra pour la réception de ses médicaments</p>
      </div>`,
      showConfirmButton: false, showCancelButton: true,
      cancelButtonText: 'Fermer', showCloseButton: true,
      customClass: { title: 'text-lg font-semibold text-left', popup: 'rounded-2xl' }
    });
  }

  // ── Search & Filter ────────────────────────────────────────────────────────
  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredPrescriptions = !term
      ? [...this.prescriptions]
      : this.prescriptions.filter(p =>
          this.getPrescriptionReference(p.id).toLowerCase().includes(term) ||
          this.getPatientFullName(p).toLowerCase().includes(term) ||
          this.getDoctorFullName(p).toLowerCase().includes(term) ||
          p.createdAt.includes(term) ||
          p.status.toLowerCase().includes(term)
        );
    this.totalItems = this.filteredPrescriptions.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  toggleFilter(): void { this.showFilter = !this.showFilter; }

  filterByStatus(status: string): void {
    this.filteredPrescriptions = status === 'all'
      ? [...this.prescriptions]
      : this.prescriptions.filter(p => p.status === status);
    this.totalItems = this.filteredPrescriptions.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  onItemsPerPageChange(): void { this.currentPage = 1; this.loadCommandes(); }

  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.loadCommandes(); } }

  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadCommandes(); } }

  private updatePagination(): void {
    this.totalItems = this.filteredPrescriptions.length;
    const maxPage = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    if (this.currentPage > maxPage) this.currentPage = maxPage;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPrescriptions = this.filteredPrescriptions.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(): number { return this.totalPages; }
  getStartIndex(): number { return (this.currentPage - 1) * this.itemsPerPage + 1; }
  getEndIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }

  // ── Status helpers ─────────────────────────────────────────────────────────
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-[#FEF3C7] text-[#D97706]',
      ACCEPTED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      IN_PREPARATION: 'bg-blue-100 text-blue-700',
      READY: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-teal-100 text-teal-700'
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée',
      IN_PREPARATION: 'En préparation', READY: 'Prête', DELIVERED: 'Livrée'
    };
    return map[status] ?? status;
  }

  // ── Utility ────────────────────────────────────────────────────────────────
  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  getPrescriptionReference(id: number): string { return `CMD-${id}`; }

  getPatientFullName(prescription: Prescription): string {
    return `${prescription.patient.prenom} ${prescription.patient.nom}`;
  }

  getDoctorFullName(prescription: Prescription): string {
    return `${prescription.doctor.prenom} ${prescription.doctor.nom}`;
  }

  isPrescriptionPdf(filename: string | null): boolean {
    return !!filename && filename.toLowerCase().endsWith('.pdf');
  }

  getFileUrl(filename: string | null): string {
    return filename ? `https://wakana.online/repertoire_chantier/${filename}` : '';
  }

  openFile(filename: string | null): void {
    if (filename) window.open(this.getFileUrl(filename), '_blank');
  }

  trackByPrescriptionId(_index: number, prescription: Prescription): number {
    return prescription.id;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);
  }

  private showAlert(title: string, text: string, icon: any): void {
    Swal.fire({ title, text, icon, confirmButtonColor: '#104382' });
  }
}
