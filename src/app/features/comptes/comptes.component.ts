import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adress: string;
  lat: number;
  lon: number;
  profil: string;
  pharmacyId: number;
}

interface UpdateUserRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  adress: string;
  lat: number;
  lon: number;
  profil: string;
}

interface Document {
  id: number;
  name: string;
  fileUrl: string;
  status: string;
  comment: string | null;
  user: {
    id: number;
    nom: string;
    prenom: string;
  };
}

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  hourly: string;
  email: string;
  latitude: number;
  longitude: number;
  logo: string;
  pharmacist: {
    id: number;
    nom: string;
    prenom: string;
  };
}

interface UpdatePharmacyRequest {
  name: string;
  address: string;
  phone: string;
  hourly: string;
  email: string;
  latitude: number;
  longitude: number;
  pharmacistId: number;
  logoFile?: File;
}

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
    const profile = this.getCurrentUserProfile();
    const isPharmaOrAdmin = ['PHARMACIEN', 'PHARMACIST', 'PHARMACIE', 'ADMIN'].includes(profile);
    
    const items = [
      { id: 'personal', label: 'Informations personnelles', icon: 'user' },
      { id: 'documents', label: 'Documents justificatifs', icon: 'document' }
    ];
    
    if (isPharmaOrAdmin) {
      items.push(
        { id: 'pharmacy', label: 'Informations de la pharmacie', icon: 'pharmacy' },
        { id: 'subscription', label: 'Abonnements', icon: 'package' },
        { id: 'invoices', label: 'Mes factures', icon: 'invoice' }
      );
    }
    
    return items;
  }

  get subtitle(): string {
    const profile = this.getCurrentUserProfile();
    if (['PHARMACIEN', 'PHARMACIST', 'PHARMACIE'].includes(profile)) {
      return 'Gérez les informations de votre pharmacie';
    }
    if (['DOCTOR', 'MEDECIN'].includes(profile)) {
      return 'Gérez vos informations personnelles et professionnelles';
    }
    if (['HOSPITAL', 'HOPITAL'].includes(profile)) {
      return 'Gérez les informations de l\'établissement';
    }
    return 'Gérez vos informations personnelles';
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
  ) { }

  // --- Local mock stores & helpers for CompteService ---
  private mockUserStore: User | null = {
    id: 1,
    nom: 'DIAW',
    prenom: 'M',
    email: 'mock@pharma.test',
    telephone: '770000000',
    adress: 'Rue Mock',
    lat: 0,
    lon: 0,
    profil: 'PHARMACIEN',
    pharmacyId: 1
  };

  private mockDocuments: Document[] = [
    { id: 1, name: 'Kbis', fileUrl: '/assets/mock/kbis.pdf', status: 'VALIDATED', comment: null, user: { id: 1, nom: 'DIAW', prenom: 'M' } }
  ];

  private mockPharmacy: Pharmacy = {
    id: 1,
    name: 'Pharmacie Mock',
    address: 'Ave Mock',
    phone: '770000000',
    hourly: '8h-20h',
    email: 'pharm@mock.test',
    latitude: 0,
    longitude: 0,
    logo: '',
    pharmacist: { id: 1, nom: 'DIAW', prenom: 'M' }
  };

  // Provide a mock current user accessor to replace AuthFacade
  private getMockCurrentUser(): User | null {
    const stored = localStorage.getItem('user_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          id: parsed.id || 1,
          nom: parsed.nom || 'DIAW',
          prenom: parsed.prenom || 'M',
          email: parsed.email || 'mock@pharma.test',
          telephone: parsed.telephone || '770000000',
          adress: parsed.adress || 'Rue Mock',
          lat: parsed.lat || 0,
          lon: parsed.lon || 0,
          profil: parsed.profil || 'PHARMACIST',
          pharmacyId: parsed.pharmacyId || 1
        };
      } catch {
        // ignore
      }
    }
    return this.mockUserStore;
  }

  private localGetUserById(id: number) {
    return of(this.getMockCurrentUser()).pipe(delay(80));
  }

  private localGetDocumentByUser(userId: number) {
    return of(this.mockDocuments).pipe(delay(80));
  }

  private localGetInfoPharmacie(id: number) {
    return of(this.mockPharmacy).pipe(delay(80));
  }

  private localUpdateUser(id: number, payload: UpdateUserRequest) {
    if (this.mockUserStore && this.mockUserStore.id === id) {
      this.mockUserStore = { ...this.mockUserStore, nom: payload.nom, prenom: payload.prenom, email: payload.email, telephone: payload.telephone, adress: payload.adress } as User;
    }
    return of('OK').pipe(delay(100));
  }

  private localUpdatePharmacie(id: number, payload: UpdatePharmacyRequest) {
    if (this.mockPharmacy && this.mockPharmacy.id === id) {
      this.mockPharmacy = { ...this.mockPharmacy, name: payload.name, address: payload.address, phone: payload.phone, hourly: payload.hourly, email: payload.email } as Pharmacy;
    }
    return of('OK').pipe(delay(120));
  }

  private localUploadUserDocument(userId: number, name: string, file: File) {
    const newDoc: any = { id: Date.now(), name, fileUrl: '/assets/mock/' + name, status: 'PENDING', comment: null, user: { id: userId, nom: this.mockUserStore?.nom || '', prenom: this.mockUserStore?.prenom || '' } };
    this.mockDocuments.push(newDoc);
    return of(newDoc).pipe(delay(200));
  }

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
    const currentUser = this.getMockCurrentUser();
    if (currentUser?.id) {
      this.userId = currentUser.id;
      this.loadAllData();
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
    this.localGetUserById(this.userId).subscribe({
      next: (user: User | null) => {
        if (user) {
          console.log('[LOAD USER OK] Données reçues:', user);
          this.personalInfo = {
            prenom: user.prenom,
            nom: user.nom,
            email: user.email,
            telephone: user.telephone,
            adresse: user.adress
          };
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('[LOAD USER ERROR] Erreur chargement user:', err);
        this.isLoading = false;
      }
    });
  }


  loadDocuments(): void {
    this.localGetDocumentByUser(this.userId).subscribe({
      next: (docs: Document[]) => {
        this.documents = docs.map(d => ({
          ...d,
          status: this.mapDocumentStatus(d.status)
        }));
      },
      error: (err: any) => console.error('Erreur documents:', err)
    });
  }

  loadPharmacyInfo(): void {
    console.log('[PHARMACY] Récupération infos pharmacie pour user', this.userId);
    // Use local user store to fetch pharmacyId and then pharmacy info
    this.localGetUserById(this.userId).subscribe({
      next: (user: User | null) => {
        if (!user?.pharmacyId) {
          console.warn('[PHARMACY WARNING] Aucune pharmacyId dans le user !');
          return;
        }
        this.localGetInfoPharmacie(user.pharmacyId).subscribe({
          next: (ph: Pharmacy) => {
            this.pharmacyInfo = ph;
          },
          error: (err: any) => console.error('[PHARMACY ERROR] Erreur chargement pharmacie:', err)
        });
      },
      error: (err: any) => console.error('[PHARMACY ERROR] Erreur récupération utilisateur:', err)
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
    const cur = this.getMockCurrentUser();
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

    this.localUpdateUser(this.userId, payload).subscribe({
      next: () => {
        alert('Modifications enregistrées !');
        this.isLoading = false;
      },
      error: (err: any) => {
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

    this.localUpdatePharmacie(this.pharmacyInfo.id, payload).subscribe({
      next: () => {
        alert('Pharmacie mise à jour !');
        this.selectedPharmacyLogoFile = null;
        this.isLoading = false;
      },
      error: (err: any) => {
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

    this.localUploadUserDocument(this.userId, trimmedName, this.selectedDocumentFile).subscribe({
      next: () => {
        this.documentUploadSuccess = 'Document ajouté avec succès.';
        this.loadDocuments();
        this.resetDocumentForm();
        this.showAddDocumentForm = false;
        this.isUploadingDocument = false;
      },
      error: (err: any) => {
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
      const user = this.getMockCurrentUser();
      return user?.profil?.toUpperCase() || '';
    } catch (e) {
      console.error('[PROFILE ERROR] Impossible de récupérer le profil:', e);
      return '';
    }
  }


  isUserLoggedIn(): boolean {
    return !!this.getMockCurrentUser();
  }

  getAddressFromCoordinates(lat: number, lng: number): string {
    return this.pharmacyInfo.address || `Lat: ${lat}, Lng: ${lng}`;
  }
}