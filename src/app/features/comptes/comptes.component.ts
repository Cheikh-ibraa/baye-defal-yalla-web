import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { UserService, DoctorDocument } from '../../core/services/user.service';
import { environment } from '../../../environments/environment';

interface PersonalInfo {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

interface PharmacyInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  openingHours: string;
  isOpen: boolean;
  logo?: string;
}

interface DoctorInfo {
  specialization: string;
  licenseNumber: string;
  hospitalName: string;
  phone: string;
  biography: string;
}

interface Facture {
  id: string;
  reference: string;
  amount: number;
  planName: string;
  paymentMethod: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  createdAt: string;
}

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  billingPeriod: string;
  amount: number;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  plan?: { id: string; name: string };
}

@Component({
  selector: 'app-comptes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptes.component.html',
  styleUrl: './comptes.component.css'
})
export class ComptesComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private readonly api = environment.baseUrl;

  activeSection: string = 'personal';
  isLoading: boolean = false;
  isSaving: boolean = false;
  isSavingPharmacy: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  private readonly destroy$ = new Subject<void>();

  // Données utilisateur
  personalInfo: PersonalInfo = { prenom: '', nom: '', email: '', telephone: '', adresse: '' };
  doctorInfo: DoctorInfo = { specialization: '', licenseNumber: '', hospitalName: '', phone: '', biography: '' };
  documents: DoctorDocument[] = [];

  // Rôle courant
  userRole: string = '';

  // Documents form
  showAddDocumentForm = false;
  newDocLabel = '';
  newDocType: 'IDENTITY_CARD' | 'ORDER_CERTIFICATE' | 'DIPLOMA' | 'OTHER' = 'ORDER_CERTIFICATE';
  newDocFileUrl = '';
  isUploadingDocument = false;
  documentUploadError = '';
  documentUploadSuccess = '';
  documentName = '';
  selectedDocumentFile: File | null = null;

  // Pharmacie
  pharmacyInfo: PharmacyInfo = { id: '', name: '', address: '', phone: '', openingHours: '', isOpen: false };
  selectedPharmacyLogoFile: File | null = null;

  subscriptions: Subscription[] = [];
  factures: Facture[] = [];
  isLoadingSubscriptions = false;
  isLoadingInvoices = false;

  // Modal paiement
  showSuccessPopup = false;
  nextDueDate = '';
  showRenewalModal = false;
  selectedSubscription: Subscription | null = null;
  billingPeriod: 'monthly' | 'annual' = 'monthly';
  selectedPlan: string = '';
  showPaymentModal = false;
  paymentMethod: 'card' | 'mobile' = 'card';
  paymentPlanName = '';
  startDate = '21 nov. 2025';
  currentEndDate = '21 nov. 2025';
  mobileOperator: 'wave' | 'orange' | null = null;
  showInvoicePaymentModal = false;
  selectedInvoice: { reference: string; amount: string; dueDate: string; status: string } | null = null;
  invoicePaymentMethod: 'card' | 'mobile' = 'card';
  invoiceMobileOperator: 'wave' | 'orange' | '' = '';
  invoiceCardName = '';
  invoiceCardNumber = '';
  invoiceCardExpiry = '';
  invoiceCardCVV = '';
  invoiceMobileNumber = '';

  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 4;
  totalItems = 4;

  constructor(private userService: UserService) {}

  get menuItems() {
    const isDoctor = this.userRole === 'doctor';
    const isPharmacist = this.userRole === 'pharmacist';
    const isAdmin = this.userRole === 'admin';

    const items: { id: string; label: string; icon: string }[] = [
      { id: 'personal', label: 'Informations personnelles', icon: 'user' },
    ];

    if (isDoctor) {
      items.push({ id: 'doctor-profile', label: 'Profil médecin', icon: 'stethoscope' });
      items.push({ id: 'documents', label: 'Documents justificatifs', icon: 'document' });
    }

    if (isPharmacist || isAdmin) {
      items.push({ id: 'documents', label: 'Documents justificatifs', icon: 'document' });
      items.push({ id: 'pharmacy', label: 'Informations de la pharmacie', icon: 'pharmacy' });
      items.push({ id: 'subscription', label: 'Abonnements', icon: 'package' });
      items.push({ id: 'invoices', label: 'Mes factures', icon: 'invoice' });
    }

    return items;
  }

  get subtitle(): string {
    if (this.userRole === 'doctor') return 'Gérez vos informations personnelles et professionnelles';
    if (this.userRole === 'pharmacist') return 'Gérez les informations de votre pharmacie';
    if (this.userRole === 'hospital') return "Gérez les informations de l'établissement";
    return 'Gérez vos informations personnelles';
  }

  ngOnInit(): void {
    this.userRole = this.getRoleFromToken();
    this.loadProfile();
    if (this.userRole === 'doctor' || this.userRole === 'pharmacist' || this.userRole === 'admin') {
      this.loadDoctorDocuments();
    }
    if (this.userRole === 'pharmacist' || this.userRole === 'admin') {
      this.loadPharmacyInfo();
      this.loadSubscriptions();
      this.loadInvoices();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getRoleFromToken(): string {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload?.realm_access?.roles ?? [];
      const priority = ['admin', 'doctor', 'pharmacist', 'hospital', 'lab-technician', 'radiologist', 'supplier', 'donor-individual', 'donor-organization'];
      return priority.find(r => roles.includes(r)) ?? '';
    } catch { return ''; }
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.userService.getMe().pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.personalInfo = {
          prenom: user.firstName,
          nom: user.lastName,
          email: user.email,
          telephone: user.phone ?? user.doctorProfile?.phone ?? (user.pharmacistProfile as any)?.phone ?? '',
          adresse: (user.pharmacistProfile as any)?.address ?? (user.patientProfile as any)?.address ?? ''
        };
        if (user.doctorProfile) {
          this.doctorInfo = {
            specialization: user.doctorProfile.specialization ?? '',
            licenseNumber: user.doctorProfile.licenseNumber ?? '',
            hospitalName: user.doctorProfile.hospitalName ?? '',
            phone: user.doctorProfile.phone ?? '',
            biography: (user.doctorProfile as any).biography ?? ''
          };
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[PROFIL] Erreur chargement:', err);
        this.errorMessage = 'Impossible de charger le profil.';
        this.isLoading = false;
      }
    });
  }

  private loadPharmacyInfo(): void {
    this.http.get<PharmacyInfo>(`${this.api}/pharmacy/pharmacies/me`)
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.pharmacyInfo = {
            id: data.id ?? '',
            name: data.name ?? '',
            address: data.address ?? '',
            phone: data.phone ?? '',
            email: (data as any).email ?? '',
            openingHours: (data as any).openingHours ?? '',
            isOpen: (data as any).isOpen ?? false,
            logo: (data as any).logoUrl ?? ''
          };
        }
      });
  }

  private loadSubscriptions(): void {
    this.isLoadingSubscriptions = true;
    this.http.get<Subscription | null>(`${this.api}/pharmacy/subscriptions/me`)
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(data => {
        this.subscriptions = data ? [data] : [];
        this.isLoadingSubscriptions = false;
      });
  }

  private loadInvoices(): void {
    this.isLoadingInvoices = true;
    this.http.get<Facture[]>(`${this.api}/pharmacy/subscriptions/invoices`)
      .pipe(catchError(() => of([] as Facture[])), takeUntil(this.destroy$))
      .subscribe(data => {
        this.factures = data;
        this.totalItems = data.length;
        this.totalPages = Math.max(1, Math.ceil(data.length / this.itemsPerPage));
        this.isLoadingInvoices = false;
      });
  }

  private loadDoctorDocuments(): void {
    this.userService.getDoctorDocuments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (docs) => {
        this.documents = docs.map((d: any) => ({
          ...d,
          status: d.status ?? (d.verificationStatus === 'VERIFIED' ? 'VALIDATED' : d.verificationStatus),
          createdAt: d.createdAt ?? d.uploadedAt,
        }));
      },
      error: (err) => console.error('[DOCS] Erreur:', err)
    });
  }

  setActiveSection(id: string): void {
    this.activeSection = id;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // === Sauvegardes ===

  onSaveChanges(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.userService.updateMe({
      firstName: this.personalInfo.prenom,
      lastName: this.personalInfo.nom,
      email: this.personalInfo.email,
      phone: this.personalInfo.telephone
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMessage = 'Informations mises à jour avec succès.';
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('[SAVE ME] Erreur:', err);
        this.errorMessage = 'Erreur lors de la sauvegarde.';
        this.isSaving = false;
      }
    });
  }

  onSaveDoctorProfile(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.userService.updateDoctorProfile({
      specialization: this.doctorInfo.specialization,
      licenseNumber: this.doctorInfo.licenseNumber,
      hospitalName: this.doctorInfo.hospitalName,
      phone: this.doctorInfo.phone,
      biography: this.doctorInfo.biography
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMessage = 'Profil médecin mis à jour avec succès.';
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('[SAVE DOCTOR] Erreur:', err);
        this.errorMessage = 'Erreur lors de la mise à jour du profil médecin.';
        this.isSaving = false;
      }
    });
  }

  // === Documents médecin ===

  addDocument(): void {
    this.showAddDocumentForm = !this.showAddDocumentForm;
    this.documentUploadError = '';
    if (!this.showAddDocumentForm) this.resetDocumentForm();
  }

  submitDocumentUpload(): void {
    if (!this.newDocLabel.trim()) {
      this.documentUploadError = 'Veuillez renseigner le libellé du document.';
      return;
    }
    this.isUploadingDocument = true;
    this.documentUploadError = '';
    this.userService.addDoctorDocument({
      type: this.newDocType,
      label: this.newDocLabel.trim(),
      fileUrl: this.newDocFileUrl || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadDoctorDocuments();
        this.resetDocumentForm();
        this.showAddDocumentForm = false;
        this.isUploadingDocument = false;
      },
      error: (err) => {
        console.error('[ADD DOC] Erreur:', err);
        this.documentUploadError = "Erreur lors de l'ajout du document.";
        this.isUploadingDocument = false;
      }
    });
  }

  deleteDocument(id: string): void {
    if (!confirm('Supprimer ce document ?')) return;
    this.userService.deleteDoctorDocument(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.documents = this.documents.filter(d => d.id !== id); },
      error: (err) => console.error('[DEL DOC] Erreur:', err)
    });
  }

  cancelDocumentUpload(): void {
    this.showAddDocumentForm = false;
    this.documentUploadError = '';
    this.resetDocumentForm();
  }

  private resetDocumentForm(): void {
    this.newDocLabel = '';
    this.newDocType = 'ORDER_CERTIFICATE';
    this.newDocFileUrl = '';
  }

  downloadDocument(id: string): void {
    const doc = this.documents.find(d => d.id === id);
    if (doc?.fileUrl) window.open(doc.fileUrl, '_blank');
  }

  // === Statuts documents ===

  getStatusClass(status: string): string {
    switch (status) {
      case 'VALIDATED': return 'bg-[#00B8940F] text-[#00B894]';
      case 'PENDING':   return 'bg-[#F39C121A] text-[#F39C12]';
      case 'REJECTED':  return 'bg-[#FF6B6B1A] text-[#FF6B6B]';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'VALIDATED': return 'Vérifié';
      case 'PENDING':   return 'En attente';
      case 'REJECTED':  return 'Rejeté';
      default: return 'Inconnu';
    }
  }

  getDocTypeLabel(type: string): string {
    switch (type) {
      case 'IDENTITY_CARD':    return "Carte d'identité";
      case 'ORDER_CERTIFICATE': return "Certificat d'Ordre";
      case 'DIPLOMA':           return 'Diplôme';
      default: return 'Autre';
    }
  }

  // === Factures ===

  getStatusClassFact(status: string): string {
    switch (status) {
      case 'PAID':    return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-orange-100 text-orange-800';
      case 'FAILED':  return 'bg-red-100 text-red-800';
      default:        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusTextFact(status: string): string {
    switch (status) {
      case 'PAID':    return 'Payée';
      case 'PENDING': return 'En attente';
      case 'FAILED':  return 'Échouée';
      default:        return 'Inconnu';
    }
  }

  payerFacture(id: string): void {
    const facture = this.factures.find(f => f.id === id);
    if (!facture) return;
    this.selectedInvoice = {
      reference: facture.reference,
      amount: facture.amount.toLocaleString('fr-FR') + ' FCFA',
      dueDate: this.formatDate(facture.createdAt),
      status: this.getStatusTextFact(facture.status),
    };
    this.invoicePaymentMethod = 'card';
    this.invoiceMobileOperator = '';
    this.invoiceCardName = '';
    this.invoiceCardNumber = '';
    this.invoiceCardExpiry = '';
    this.invoiceCardCVV = '';
    this.invoiceMobileNumber = '';
    this.showInvoicePaymentModal = true;
  }

  closeInvoicePaymentModal(): void {
    this.showInvoicePaymentModal = false;
    this.selectedInvoice = null;
  }

  processInvoicePayment(): void {
    if (!this.selectedInvoice) return;
    const facture = this.factures.find(f => f.reference === this.selectedInvoice!.reference);
    if (facture) facture.status = 'PAID';
    this.showSuccessPopup = true;
    this.successMessage = `Facture ${this.selectedInvoice.reference} payée avec succès !`;
    this.nextDueDate = new Date().toLocaleDateString('fr-FR');
    setTimeout(() => { this.showSuccessPopup = false; }, 3000);
    this.closeInvoicePaymentModal();
  }

  telechargerFacture(id: string): void {
    console.log('Télécharger facture', id);
  }

  // === Abonnements ===

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  openRenewalModal(subscription: Subscription): void {
    this.selectedSubscription = subscription;
    this.selectedPlan = (subscription.plan?.name ?? 'pro').toLowerCase().replace(' ', '-');
    this.showRenewalModal = true;
  }

  closeRenewalModal(): void {
    this.showRenewalModal = false;
    this.selectedSubscription = null;
    this.selectedPlan = '';
    this.billingPeriod = 'monthly';
  }

  toggleBillingPeriod(): void {
    this.billingPeriod = this.billingPeriod === 'monthly' ? 'annual' : 'monthly';
  }

  selectPlan(plan: string): void {
    this.selectedPlan = plan;
  }

  selectPaymentMethod(method: 'card' | 'mobile') {
    this.paymentMethod = method;
    if (method === 'card') this.mobileOperator = null;
  }

  selectMobileOperator(operator: 'wave' | 'orange') {
    this.mobileOperator = operator;
  }

  openPaymentModal(plan: string): void {
    this.selectedPlan = plan;
    this.paymentPlanName = plan === 'pro-plus' ? 'Pro Plus' : 'Pro';
    this.showPaymentModal = true;
    this.paymentMethod = 'card';
    this.startDate = new Date().toLocaleDateString('fr-FR');
    this.currentEndDate = this.selectedSubscription?.endDate || '';
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentMethod = 'card';
  }

  processPayment(): void {
    if (!this.paymentMethod || !this.selectedSubscription) {
      alert('Veuillez choisir un mode de paiement');
      return;
    }
    const today = new Date();
    const newEndDate = new Date(today);
    if (this.billingPeriod === 'monthly') {
      newEndDate.setMonth(today.getMonth() + 1);
    } else {
      newEndDate.setFullYear(today.getFullYear() + 1);
    }
    const formattedEndDate = newEndDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    this.subscriptions = this.subscriptions.map(sub =>
      sub.id === this.selectedSubscription!.id
        ? { ...sub, status: 'ACTIVE' as const, startDate: today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }), endDate: formattedEndDate }
        : sub
    );
    this.closePaymentModal();
    this.showSuccessPopup = true;
    this.successMessage = `Votre offre ${this.paymentPlanName} est activée.`;
    this.nextDueDate = formattedEndDate;
    setTimeout(() => { this.showSuccessPopup = false; }, 3000);
    this.closeRenewalModal();
  }

  // === Pagination ===

  changeItemsPerPage(value: number): void {
    this.itemsPerPage = value;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  previousPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

  // === Stubs pharmacie (template compat) ===

  onLogoUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (ev: any) => {
      const file: File = ev.target.files[0];
      if (file) {
        this.selectedPharmacyLogoFile = file;
        const reader = new FileReader();
        reader.onload = e => (this.pharmacyInfo.logo = e.target?.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  onSavePharmacyChanges(): void {
    if (!this.pharmacyInfo.id) return;
    this.isSavingPharmacy = true;
    this.errorMessage = '';

    const patchFields = (logoUrl?: string) => {
      const body: Record<string, unknown> = {
        name: this.pharmacyInfo.name,
        address: this.pharmacyInfo.address,
        phone: this.pharmacyInfo.phone,
        email: this.pharmacyInfo.email,
        openingHours: this.pharmacyInfo.openingHours,
        isOpen: this.pharmacyInfo.isOpen,
      };
      if (logoUrl) body['logoUrl'] = logoUrl;

      this.http.patch(`${this.api}/pharmacy/pharmacies/${this.pharmacyInfo.id}`, body)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            if (logoUrl) { this.pharmacyInfo.logo = logoUrl; }
            this.selectedPharmacyLogoFile = null;
            this.successMessage = 'Informations de la pharmacie mises à jour.';
            this.isSavingPharmacy = false;
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (err) => {
            console.error('[SAVE PHARMACY] Erreur:', err);
            this.errorMessage = 'Erreur lors de la sauvegarde des informations de la pharmacie.';
            this.isSavingPharmacy = false;
          }
        });
    };

    if (this.selectedPharmacyLogoFile) {
      const formData = new FormData();
      formData.append('logo', this.selectedPharmacyLogoFile);
      this.http.patch<{ logoUrl: string }>(
        `${this.api}/pharmacy/pharmacies/${this.pharmacyInfo.id}/logo`, formData
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => patchFields(res.logoUrl),
        error: (err) => {
          console.error('[LOGO UPLOAD] Erreur:', err);
          this.errorMessage = 'Erreur lors de l\'upload du logo.';
          this.isSavingPharmacy = false;
        }
      });
    } else {
      patchFields();
    }
  }

  downloadInvoice(id: string): void {
    console.log('Téléchargement facture abonnement:', id);
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDocumentFile = input.files?.[0] ?? null;
    this.documentName = this.selectedDocumentFile?.name ?? '';
    this.documentUploadError = '';
  }
}
