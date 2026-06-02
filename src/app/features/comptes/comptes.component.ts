import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  CompteService,
  User,
  Document,
  Pharmacy,
  UpdateUserRequest,
  UpdatePharmacyRequest
} from '../../services/compte.service';
import { AuthService } from '../../services/auth.service';

interface PersonalInfo {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

interface Facture {
  id: string;
  reference: string;
  echeance: string;
  montant: string;
  statut: 'en_attente' | 'payee';
}

interface Subscription {
  id: number;
  pack: string;
  startDate: string;
  endDate: string;
  status: 'Actif' | 'Expiré';
}

@Component({
  selector: 'app-comptes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptes.component.html',
  styleUrl: './comptes.component.css'
})
export class ComptesComponent implements OnInit, OnDestroy {
  // === État général ===
  activeSection: string = 'personal';
  userId: number = 0;
  isLoading: boolean = false;
  private readonly destroy$ = new Subject<void>();

  // === Données utilisateur ===
  personalInfo: PersonalInfo = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  };

  documents: Document[] = [];
  pharmacyInfo: Pharmacy = {
    id: 0,
    name: '',
    address: '',
    phone: '',
    hourly: '',
    email: '',
    latitude: 0,
    longitude: 0,
    logo: '',
    pharmacist: { id: 0, nom: '', prenom: '' }
  };
  selectedPharmacyLogoFile: File | null = null;

  showSuccessPopup = false;
  successMessage = '';
  nextDueDate = '';

  showAddDocumentForm = false;
  documentName = '';
  selectedDocumentFile: File | null = null;
  isUploadingDocument = false;
  documentUploadError = '';
  documentUploadSuccess = '';

  // === Données mockées ===
  subscriptions: Subscription[] = [
    { id: 1, pack: 'Pro', startDate: '05/07/2025', endDate: '05/08/2025', status: 'Expiré' },
    { id: 2, pack: 'Pro', startDate: '05/06/2025', endDate: '05/07/2025', status: 'Actif' },
    { id: 3, pack: 'Pro', startDate: '05/05/2025', endDate: '05/06/2025', status: 'Actif' },
    { id: 4, pack: 'Pro Plus', startDate: '05/04/2025', endDate: '05/05/2025', status: 'Actif' }
  ];

  factures: Facture[] = [
    { id: '1', reference: 'FAC-2025-07', echeance: '05/07/2025', montant: '250 000', statut: 'en_attente' },
    { id: '2', reference: 'FAC-2025-06', echeance: '05/06/2025', montant: '250 000', statut: 'payee' },
    { id: '3', reference: 'FAC-2025-05', echeance: '05/05/2025', montant: '250 000', statut: 'payee' },
    { id: '4', reference: 'FAC-2025-04', echeance: '05/04/2025', montant: '250 000', statut: 'payee' }
  ];

  // === Menu dynamique ===
  get menuItems() {
    try {
      console.log('[MENU ITEMS] Calcul du menu...');
      const profile = this.getCurrentUserProfile();
      console.log('[MENU ITEMS] Profil utilisateur =', profile);
    } catch (e) {
      console.error('[MENU ITEMS ERROR] Erreur dans menuItems():', e);
    }

    const baseItems = [
      { id: 'personal', label: 'Informations personnelles', icon: 'user' },
      { id: 'documents', label: 'Documents justificatifs', icon: 'document' },
      { id: 'pharmacy', label: 'Informations de la pharmacie', icon: 'pharmacy' },
      { id: 'invoices', label: 'Mes factures', icon: 'invoice' }
    ];

    try {
      const profile = this.getCurrentUserProfile();
      if (['PHARMACIEN', 'ADMIN'].includes(profile)) {
        baseItems.splice(3, 0, { id: 'subscription', label: 'Abonnements', icon: 'package' });
      }
    } catch (e) {
      console.error('[MENU PROFILE ERROR] Erreur lors du traitement du profil:', e);
    }

    return baseItems;
  }


  // === Pagination ===
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 4;
  totalItems = 4;

  // === Modal de renouvellement ===
  showRenewalModal = false;
  selectedSubscription: Subscription | null = null;
  billingPeriod: 'monthly' | 'annual' = 'monthly';
  selectedPlan: string = '';

  // === Modal de paiement (abonnement) ===
  showPaymentModal = false;
  paymentMethod: 'card' | 'mobile' = 'card';
  paymentPlanName = '';
  startDate = '21 nov. 2025';
  currentEndDate = '21 nov. 2025';
  mobileOperator: 'wave' | 'orange' | null = null;

  // === MODAL DE PAIEMENT FACTURE (NOUVEAU) ===
  showInvoicePaymentModal = false;
  selectedInvoice: {
    reference: string;
    amount: string;
    dueDate: string;
    status: string;
  } | null = null;

  // Champs du formulaire de paiement facture
  invoicePaymentMethod: 'card' | 'mobile' = 'card';
  invoiceMobileOperator: 'wave' | 'orange' | '' = '';
  invoiceCardName = '';
  invoiceCardNumber = '';
  invoiceCardExpiry = '';
  invoiceCardCVV = '';
  invoiceMobileNumber = '';

  constructor(
    private compteService: CompteService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    console.log('%c[INIT] ComptesComponent chargé', 'color: green; font-weight: bold');

    try {
      this.initializeUserData();
    } catch (e) {
      console.error('[INIT ERROR] Erreur dans initializeUserData():', e);
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Initialisation ===
  private initializeUserData(): void {
    if (!this.authService.isLoggedIn()) {
      console.error('Utilisateur non connecté');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id) {
      this.userId = currentUser.id;
      this.loadAllData();
    } else {
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          if (user?.id) {
            this.userId = user.id;
            this.loadAllData();
          }
        });
    }
  }

  private loadAllData(): void {
    if (this.userId > 0) {
      this.loadUserData();
      this.loadDocuments();
      this.loadPharmacyInfo();
    }
  }

  // === Chargement des données ===
  loadUserData(): void {
    console.log('[LOAD USER] Chargement user id =', this.userId);

    this.isLoading = true;
    this.compteService.getUserById(this.userId).subscribe({
      next: (user: User) => {
        console.log('[LOAD USER OK] Données reçues:', user);
        this.personalInfo = {
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          telephone: user.telephone,
          adresse: user.adress
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[LOAD USER ERROR] Erreur chargement user:', err);
        this.isLoading = false;
      }
    });
  }


  loadDocuments(): void {
    this.compteService.getDocumentByUser(this.userId).subscribe({
      next: (docs: Document[]) => {
        this.documents = docs.map(d => ({
          ...d,
          status: this.mapDocumentStatus(d.status)
        }));
      },
      error: (err) => console.error('Erreur documents:', err)
    });
  }

  loadPharmacyInfo(): void {
    console.log('[PHARMACY] Récupération infos pharmacie pour user', this.userId);

    this.authService.getCurrentUserById(this.userId).subscribe({
      next: (user: User) => {
        console.log('[PHARMACY USER OK] Utilisateur récupéré:', user);

        if (!user?.pharmacyId) {
          console.warn('[PHARMACY WARNING] Aucune pharmacyId dans le user !');
          return;
        }

        console.log('[PHARMACY] Appel getInfoPharmacie avec ID:', user.pharmacyId);

        this.compteService.getInfoPharmacie(user.pharmacyId).subscribe({
          next: (ph: Pharmacy) => {
            console.log('[PHARMACY OK] Données reçues:', ph);
            this.pharmacyInfo = ph;
          },
          error: (err) => {
            console.error('[PHARMACY ERROR] Erreur chargement pharmacie:', err);
          }
        });
      },
      error: (err) => {
        console.error('[PHARMACY ERROR] Erreur récupération utilisateur:', err);
      }
    });
  }


  // === Utilitaires ===
  mapDocumentStatus(status: string): 'verified' | 'pending' | 'missing' {
    switch (status.toUpperCase()) {
      case 'VALIDATED': return 'verified';
      case 'PENDING': return 'pending';
      case 'REJECTED': return 'missing';
      default: return 'missing';
    }
  }

  setActiveSection(id: string): void {
    this.activeSection = id;
  }

  // === Sauvegarde ===
  onSaveChanges(): void {
    this.isLoading = true;
    const cur = this.authService.getCurrentUser();
    const payload: UpdateUserRequest = {
      nom: this.personalInfo.nom,
      prenom: this.personalInfo.prenom,
      email: this.personalInfo.email,
      password: '',
      telephone: this.personalInfo.telephone,
      adress: this.personalInfo.adresse,
      lat: cur?.lat ?? 0,
      lon: cur?.lon ?? 0,
      profil: cur?.profil ?? 'ADMIN'
    };

    this.compteService.updateUser(this.userId, payload).subscribe({
      next: () => {
        alert('Modifications enregistrées !');
        this.isLoading = false;
      },
      error: (err) => {
        alert('Erreur sauvegarde');
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onSavePharmacyChanges(): void {
    this.isLoading = true;
    const payload: UpdatePharmacyRequest = {
      name: this.pharmacyInfo.name,
      address: this.pharmacyInfo.address,
      phone: this.pharmacyInfo.phone,
      hourly: this.pharmacyInfo.hourly,
      email: this.pharmacyInfo.email,
      latitude: this.pharmacyInfo.latitude,
      longitude: this.pharmacyInfo.longitude,
      pharmacistId: this.pharmacyInfo.pharmacist.id,
      logoFile: this.selectedPharmacyLogoFile ?? undefined
    };

    this.compteService.updatePharmacie(this.pharmacyInfo.id, payload).subscribe({
      next: () => {
        alert('Pharmacie mise à jour !');
        this.selectedPharmacyLogoFile = null;
        this.isLoading = false;
      },
      error: (err) => {
        alert('Erreur mise à jour pharmacie');
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // === Documents & Logo ===
  downloadDocument(id: string): void {
    console.log('Téléchargement du document:', id);
  }

  addDocument(): void {
    this.showAddDocumentForm = !this.showAddDocumentForm;
    this.documentUploadError = '';
    this.documentUploadSuccess = '';

    if (!this.showAddDocumentForm) {
      this.resetDocumentForm();
    }
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedDocumentFile = file;
    this.documentUploadError = '';
  }

  submitDocumentUpload(): void {
    if (!this.userId) {
      this.documentUploadError = 'Utilisateur non connecté.';
      return;
    }

    const trimmedName = this.documentName.trim();
    if (!trimmedName) {
      this.documentUploadError = 'Veuillez renseigner le nom du document.';
      return;
    }

    if (!this.selectedDocumentFile) {
      this.documentUploadError = 'Veuillez sélectionner un fichier.';
      return;
    }

    this.isUploadingDocument = true;
    this.documentUploadError = '';
    this.documentUploadSuccess = '';

    this.compteService.uploadUserDocument(this.userId, trimmedName, this.selectedDocumentFile).subscribe({
      next: () => {
        this.documentUploadSuccess = 'Document ajouté avec succès.';
        this.loadDocuments();
        this.resetDocumentForm();
        this.showAddDocumentForm = false;
        this.isUploadingDocument = false;
      },
      error: (err) => {
        console.error('Erreur upload document:', err);
        this.documentUploadError = 'Erreur lors de l’ajout du document.';
        this.isUploadingDocument = false;
      }
    });
  }

  cancelDocumentUpload(): void {
    this.showAddDocumentForm = false;
    this.documentUploadError = '';
    this.documentUploadSuccess = '';
    this.resetDocumentForm();
  }

  private resetDocumentForm(): void {
    this.documentName = '';
    this.selectedDocumentFile = null;
  }

  onLogoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedPharmacyLogoFile = file;
      const reader = new FileReader();
      reader.onload = e => (this.pharmacyInfo.logo = e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  onLogoUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = ev => this.onLogoChange(ev);
    input.click();
  }

  // === STATUT DES DOCUMENTS ===
  getStatusClass(status: string): string {
    switch (status) {
      case 'verified': return 'bg-[#00B8940F] text-[#00B894]';
      case 'pending': return 'bg-[#F39C121A] text-[#F39C12]';
      case 'missing': return 'bg-[#FF6B6B1A] text-[#FF6B6B]';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'verified': return 'Vérifié';
      case 'pending': return 'En attente';
      case 'missing': return 'Manquant';
      default: return 'Inconnu';
    }
  }

  // === Factures ===
  getStatusClassFact(statut: string): string {
    return statut === 'en_attente' ? 'bg-orange-100 text-orange-800' :
      statut === 'payee' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  getStatusTextFact(statut: string): string {
    return statut === 'en_attente' ? 'En attente' :
      statut === 'payee' ? 'Payée' : 'Inconnu';
  }

  // === PAIEMENT FACTURE : OUVRIR LE MODAL ===
  payerFacture(id: string): void {
    const facture = this.factures.find(f => f.id === id);
    if (!facture) return;

    this.selectedInvoice = {
      reference: facture.reference,
      amount: facture.montant,
      dueDate: facture.echeance,
      status: this.getStatusTextFact(facture.statut)
    };

    // Réinitialiser les champs du formulaire
    this.invoicePaymentMethod = 'card';
    this.invoiceMobileOperator = '';
    this.invoiceCardName = '';
    this.invoiceCardNumber = '';
    this.invoiceCardExpiry = '';
    this.invoiceCardCVV = '';
    this.invoiceMobileNumber = '';

    // OUVRIR LE MODAL
    this.showInvoicePaymentModal = true;
  }

  // === FERMER LE MODAL DE PAIEMENT FACTURE ===
  closeInvoicePaymentModal(): void {
    this.showInvoicePaymentModal = false;
    this.selectedInvoice = null;
  }

  // === TRAITER LE PAIEMENT DE LA FACTURE ===
  processInvoicePayment(): void {
    if (!this.selectedInvoice) return;

    // Simulation du paiement réussi
    const facture = this.factures.find(f => f.reference === this.selectedInvoice!.reference);
    if (facture) {
      facture.statut = 'payee';
    }

    // Afficher succès
    this.showSuccessPopup = true;
    this.successMessage = `Facture ${this.selectedInvoice.reference} payée avec succès !`;
    this.nextDueDate = new Date().toLocaleDateString('fr-FR');

    setTimeout(() => {
      this.showSuccessPopup = false;
    }, 3000);

    // Fermer le modal
    this.closeInvoicePaymentModal();
  }

  telechargerFacture(id: string): void {
    console.log('Télécharger facture', id);
  }

  // === ABONNEMENTS ===
  downloadInvoice(id: number): void {
    console.log('Téléchargement facture abonnement:', id);
  }

  openRenewalModal(subscription: Subscription): void {
    this.selectedSubscription = subscription;
    this.selectedPlan = subscription.pack.toLowerCase().replace(' ', '-');
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

  // === PAIEMENT ABONNEMENT ===
  selectPaymentMethod(method: 'card' | 'mobile') {
    this.paymentMethod = method;
    if (method === 'card') {
      this.mobileOperator = null;
    }
  }

  selectMobileOperator(operator: 'wave' | 'orange') {
    this.mobileOperator = operator;
  }

  processPayment(): void {
    if (!this.paymentMethod || !this.selectedSubscription) {
      alert('Veuillez choisir un mode de paiement');
      return;
    }

    const amount = this.billingPeriod === 'monthly' ? '14 900' : '143 040';
    const planName = this.paymentPlanName;
    const today = new Date();

    const newEndDate = new Date(today);
    if (this.billingPeriod === 'monthly') {
      newEndDate.setMonth(today.getMonth() + 1);
    } else {
      newEndDate.setFullYear(today.getFullYear() + 1);
    }

    const formattedEndDate = newEndDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    this.subscriptions = this.subscriptions.map(sub => {
      if (sub.id === this.selectedSubscription!.id) {
        return {
          ...sub,
          status: 'Actif' as const,
          startDate: today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          endDate: formattedEndDate
        };
      }
      return sub;
    });

    this.closePaymentModal();
    this.showSuccessPopup = true;
    this.successMessage = `Votre offre ${planName} est activée.`;
    this.nextDueDate = formattedEndDate;

    setTimeout(() => {
      this.showSuccessPopup = false;
    }, 3000);

    this.closeRenewalModal();
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

  // === PAGINATION ===
  changeItemsPerPage(value: number): void {
    this.itemsPerPage = value;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  // === PROFIL ===
  getCurrentUserProfile(): string {
    try {
      const user = this.authService.getCurrentUser();
      console.log('[PROFILE] Profil du user:', user?.profil);
      return user?.profil?.toUpperCase() || '';
    } catch (e) {
      console.error('[PROFILE ERROR] Impossible de récupérer le profil:', e);
      return '';
    }
  }


  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getAddressFromCoordinates(lat: number, lng: number): string {
    return this.pharmacyInfo.address || `Lat: ${lat}, Lng: ${lng}`;
  }
}