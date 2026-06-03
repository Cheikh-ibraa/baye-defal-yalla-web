import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Local types inlined from pharmacie.service
interface AmountStats {
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalPaidCount: number;
}

interface WithdrawalItem {
  id: number;
  reference: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: string;
  comment: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface WithdrawalHistoryResponse {
  content: WithdrawalItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

interface BankParameterResponse {
  id: number;
  bankName: string;
  rib: string;
  phone: string;
  fullName: string;
}

interface CreateWithdrawalRequest {
  pharmacyId: number;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  iconColor: string;
  iconBg: string;
}

interface Retrait {
  date: string;
  reference: string;
  montant: string;
  statut: string;
  statutColor: string;
  statutBg: string;
  commentaire: string;
}

interface CartesBancaire {
  id: number;
  iban: string;
  nomBanque: string;
  nomTitulaire: string;
  justificatif?: string;
}

interface User {
  id: number;
  pharmacyId?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  profil?: string;
}

@Component({
  selector: 'app-finance-retraits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-retraits.component.html',
  styleUrls: ['./finance-retraits.component.css']
})
export class FinanceRetraitsComponent implements OnInit, OnDestroy {
  readonly statusOptions = [
    { label: 'Tous les statuts', value: undefined },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Approuvé', value: 'APPROVED' },
    { label: 'Rejeté', value: 'REJECTED' },
    { label: 'Payé', value: 'PAID' }
  ];

  // Gestion du cycle de vie
  private destroy$ = new Subject<void>();


  pharmacyId: number | null = null;
  userId: number | null = null;

  searchQuery = '';
  selectedStatut = 'Tous les statuts';
  showStatutDropdown = false;

  itemsPerPage = 10;
  currentPage = 0; // API commence à 0
  totalPages = 0;
  totalElements = 0;

  // Variables pour le modal de virement et popup
  showModal = false;
  showSuccessPopup = false;
  montantVirement = '';
  soldeDisponible = 0;
  bankInfo: BankParameterResponse | null = null;

  // Variables pour le formulaire d'ajout de carte bancaire
  showAddForm = false;
  showJustificatifModal = false;
  cartesBancaires: CartesBancaire[] = [];

  nouvelleCarteData = {
    iban: '',
    nomBanque: '',
    nomTitulaire: 'Pharmacie Centrale SARL',
    justificatif: null as File | null
  };

  // Données des cartes statistiques
  statsCards: StatCard[] = [];

  // Liste des retraits
  retraits: Retrait[] = [];
  retraitsFiltres: Retrait[] = [];

  // État de chargement et erreurs
  isLoading = false;
  errorMessage = '';
  showError = false;

  constructor() {
    console.log('💳 FinanceRetraitsComponent initialisé');
    this.initializeStatsCards();
  }

  // Local mock current user + fetcher (replaces AuthFacade)
  private getMockCurrentUser(): User {
    return {
      id: 7,
      pharmacyId: 1,
      nom: 'Pharmacie Centrale',
      prenom: 'Admin',
      telephone: '+221770000000'
    };
  }

  private localGetCurrentUserById(userId: number): Observable<User> {
    const mock: User = {
      id: userId,
      pharmacyId: 1,
      nom: 'Pharmacie Centrale',
      prenom: 'Admin',
      telephone: '+221770000000'
    };
    return of(mock).pipe(delay(120));
  }

  // Local mock/state for sandbox
  private mockSolde = 78250;
  private mockBankInfo: BankParameterResponse = {
    id: 1,
    bankName: 'Banque Demo',
    rib: 'FR76 1234 5678 9012 3456 7890 123',
    phone: '+221770000000',
    fullName: 'Pharmacie Centrale SARL'
  };
  private mockAmountStats: AmountStats = { totalPaidAmount: 1523000, totalPendingAmount: 42000, totalPaidCount: 125 };
  private mockWithdrawals: WithdrawalItem[] = [];

  private initMockWithdrawals(): void {
    if (this.mockWithdrawals.length) return;
    for (let i = 1; i <= 47; i++) {
      const status = i % 6 === 0 ? 'REJECTED' : (i % 4 === 0 ? 'PAID' : (i % 3 === 0 ? 'APPROVED' : 'PENDING'));
      this.mockWithdrawals.push({
        id: i,
        reference: `RET-${1000 + i}`,
        amount: Math.floor(Math.random() * 150000) + 5000,
        bankName: this.mockBankInfo.bankName,
        accountNumber: this.mockBankInfo.rib,
        accountHolder: this.mockBankInfo.fullName,
        status,
        comment: status === 'REJECTED' ? 'Montant invalide' : null,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        processedAt: status === 'PAID' ? new Date(Date.now() - (i - 1) * 86400000).toISOString() : null
      });
    }
  }

  private localGetSoldeDashboard(pharmacyId: number): Observable<number> {
    return of(this.mockSolde).pipe(delay(180));
  }

  private localGetBankParameterByPharmacyId(pharmacyId: number): Observable<BankParameterResponse> {
    return of(this.mockBankInfo).pipe(delay(160));
  }

  private localGetAmount(pharmacyId: number, year: number): Observable<AmountStats> {
    return of(this.mockAmountStats).pipe(delay(200));
  }

  private localGetHistoriques(pharmacyId: number, status?: string, page: number = 0, size: number = 10): Observable<WithdrawalHistoryResponse> {
    this.initMockWithdrawals();
    let items = this.mockWithdrawals.slice();
    if (status) {
      items = items.filter(w => w.status === status);
    }
    const totalElements = items.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const content = items.slice(start, start + size);
    const response: WithdrawalHistoryResponse = {
      content,
      pageable: { pageNumber: page, pageSize: size, sort: { sorted: false, unsorted: true, empty: false }, offset: start, paged: true, unpaged: false },
      totalElements,
      totalPages,
      last: page >= totalPages - 1,
      numberOfElements: content.length,
      size,
      number: page,
      sort: { sorted: false, unsorted: true, empty: false },
      first: page === 0,
      empty: content.length === 0
    };
    return of(response).pipe(delay(220));
  }

  private localCreateWithdrawal(payload: CreateWithdrawalRequest): Observable<any> {
    // Simulate creation and append to mock list
    const id = this.mockWithdrawals.length + 1;
    const item: WithdrawalItem = {
      id,
      reference: `RET-${1000 + id}`,
      amount: payload.amount,
      bankName: payload.bankName,
      accountNumber: payload.accountNumber,
      accountHolder: payload.accountHolder,
      status: 'PENDING',
      comment: null,
      createdAt: new Date().toISOString(),
      processedAt: null
    };
    this.mockWithdrawals.unshift(item);
    this.mockSolde -= payload.amount;
    return of({ success: true }).pipe(delay(260));
  }

  ngOnInit(): void {
    console.log('%c[INIT] Finance Retraits chargé', 'color: green; font-weight: bold');
    this.initializeDashboard();
  }

  ngOnDestroy(): void {
    console.log('🔴 Destruction du composant Retraits');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise les cartes statistiques avec valeurs par défaut
   */
  private initializeStatsCards(): void {
    this.statsCards = [
      {
        title: 'Solde Disponible',
        value: '0 F',
        subtitle: 'Disponible pour retrait',
        iconColor: '#06B6D4',
        iconBg: '#ECFEFF'
      },
      {
        title: 'Total Retiré',
        value: '0 F',
        subtitle: 'Depuis le début',
        iconColor: '#06B6D4',
        iconBg: '#ECFEFF'
      },
      {
        title: 'En Attente',
        value: '0 F',
        subtitle: 'En cours de validation',
        iconColor: '#F59E0B',
        iconBg: '#FEF3C7'
      },
      {
        title: 'Virements Réussis',
        value: '0',
        subtitle: 'Transactions complétées',
        iconColor: '#10B981',
        iconBg: '#D1FAE5'
      }
    ];
  }

  /**
   * Initialise le dashboard en récupérant le pharmacyId
   */
  private initializeDashboard(): void {
    console.log('[INIT] 🚀 Démarrage initialisation retraits');

    this.isLoading = true;

    const currentUser = this.getMockCurrentUser();

    if (!currentUser || !currentUser.id) {
      console.error('❌ Aucun utilisateur connecté trouvé');
      this.showErrorMessage('Impossible de récupérer les informations utilisateur');
      this.isLoading = false;
      return;
    }

    this.userId = currentUser.id;
    console.log('✅ User ID récupéré:', this.userId);

    this.localGetCurrentUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          console.log('✅ Utilisateur complet récupéré:', user);

          if (!user.pharmacyId) {
            console.error('❌ Aucun pharmacyId trouvé pour l\'utilisateur');
            this.showErrorMessage('Aucune pharmacie associée à votre compte');
            this.isLoading = false;
            return;
          }

          this.pharmacyId = user.pharmacyId;
          console.log('✅ Pharmacy ID récupéré:', this.pharmacyId);

          this.loadAllData();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données utilisateur:', error);
          this.showErrorMessage('Erreur lors du chargement de vos informations');
          this.isLoading = false;
        }
      });
  }

  /**
   * Charge toutes les données du dashboard
   */
  private loadAllData(): void {
    if (!this.pharmacyId) return;

    console.log('[DATA] 📊 Chargement de toutes les données...');

    // Charger le solde disponible
    this.loadSoldeDisponible();

    // Charger les informations bancaires
    this.loadBankInformation();

    // Charger les statistiques de retraits
    this.loadAmountStats();

    // Charger l'historique des retraits
    this.loadHistoriqueRetraits();
  }

  /**
   * Charge le solde disponible
   */
  private loadSoldeDisponible(): void {
    if (!this.pharmacyId) return;

    console.log('[API] 💰 Chargement du solde disponible...');

    this.localGetSoldeDashboard(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (solde: number) => {
          console.log('✅ Solde chargé:', solde);
          this.soldeDisponible = Number(solde) || 0;
          this.statsCards[0].value = this.formatMontant(solde);
        },
        error: (error) => {
          console.error('❌ Erreur chargement solde:', error);
          this.showErrorMessage('Erreur lors du chargement du solde');
        }
      });
  }

  /**
   * Charge les informations bancaires de la pharmacie
   */
  private loadBankInformation(): void {
    if (!this.pharmacyId) return;

    this.localGetBankParameterByPharmacyId(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bankInfo: BankParameterResponse) => {
          this.bankInfo = bankInfo;
        },
        error: (error) => {
          const apiMessage = error?.originalError?.error?.message || '';
          if (error?.status === 400 && apiMessage.toLowerCase().includes('aucune information bancaire')) {
            this.bankInfo = null;
            return;
          }
          this.showErrorMessage('Impossible de récupérer les informations bancaires');
        }
      });
  }

  /**
   * Charge les statistiques de retraits
   */
  private loadAmountStats(): void {
    if (!this.pharmacyId) return;

    console.log('[API] 📊 Chargement des statistiques de retraits...');

    const currentYear = new Date().getFullYear();

    this.localGetAmount(this.pharmacyId, currentYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: AmountStats) => {
          console.log('✅ Statistiques chargées:', stats);

          // Total Retiré
          this.statsCards[1].value = this.formatMontant(stats.totalPaidAmount);

          // En Attente
          this.statsCards[2].value = this.formatMontant(stats.totalPendingAmount);

          // Virements Réussis
          this.statsCards[3].value = stats.totalPaidCount.toString().padStart(2, '0');
        },
        error: (error) => {
          console.error('❌ Erreur chargement statistiques:', error);
          this.showErrorMessage('Erreur lors du chargement des statistiques');
        }
      });
  }

  /**
   * Charge l'historique des retraits
   */
  private loadHistoriqueRetraits(status?: string): void {
    if (!this.pharmacyId) return;

    console.log('[API] 📜 Chargement historique retraits...');
    console.log('  - Page:', this.currentPage);
    console.log('  - Taille:', this.itemsPerPage);
    console.log('  - Status:', status || 'Tous');

    this.isLoading = true;

    this.localGetHistoriques(
      this.pharmacyId,
      status,
      this.currentPage,
      this.itemsPerPage
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: WithdrawalHistoryResponse) => {
          console.log('✅ Historique chargé:', response);

          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;

          // Convertir les données API vers le format local
          this.retraits = this.convertWithdrawalsToRetraits(response.content);
          this.retraitsFiltres = [...this.retraits];

          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur chargement historique:', error);
          this.showErrorMessage('Erreur lors du chargement de l\'historique');
          this.isLoading = false;
        }
      });
  }

  /**
   * Convertit les données de l'API vers le format local
   */
  private convertWithdrawalsToRetraits(withdrawals: WithdrawalItem[]): Retrait[] {
    return withdrawals.map(w => {
      const statusInfo = this.getStatusInfo(w.status);

      return {
        date: this.formatDate(w.createdAt),
        reference: w.reference,
        montant: this.formatMontant(w.amount),
        statut: statusInfo.label,
        statutColor: statusInfo.color,
        statutBg: statusInfo.bg,
        commentaire: w.comment?.trim() || this.getCommentaire(w.status)
      };
    });
  }

  /**
   * Retourne les informations de style selon le statut
   */
  private getStatusInfo(status: string): { label: string; color: string; bg: string } {
    const statusMap: { [key: string]: { label: string; color: string; bg: string } } = {
      'PENDING': { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7' },
      'APPROVED': { label: 'Approuvé', color: '#2C7BE5', bg: '#DBEAFE' },
      'REJECTED': { label: 'Rejeté', color: '#EF4444', bg: '#FEE2E2' },
      'PAID': { label: 'Payé', color: '#10B981', bg: '#D1FAE5' }
    };

    return statusMap[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
  }

  /**
   * Retourne un commentaire selon le statut
   */
  private getCommentaire(status: string): string {
    const commentaires: { [key: string]: string } = {
      'PENDING': 'En cours de traitement',
      'APPROVED': 'Demande approuvée par l\'administration',
      'REJECTED': 'Demande rejetée par l\'administration',
      'PAID': 'Virement effectué avec succès'
    };

    return commentaires[status] || '-';
  }

  /**
   * Formate une date au format français
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Formate un montant avec séparateur de milliers
   */
  formatMontant(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' F';
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;

    setTimeout(() => {
      this.showError = false;
    }, 5000);
  }

  // ============================================
  // Méthodes pour le modal de virement
  // ============================================
  openModal(): void {
    if (!this.bankInfo) {
      this.showErrorMessage('Aucune information bancaire trouvée. Veuillez configurer vos paramètres bancaires.');
      return;
    }

    this.showModal = true;
    this.montantVirement = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.montantVirement = '';
  }

  soumettreVirement(): void {
    if (!this.pharmacyId || !this.bankInfo) {
      this.showErrorMessage('Informations bancaires indisponibles pour effectuer la demande.');
      return;
    }

    const amount = Number(this.montantVirement.toString().replace(/\s+/g, '').replace(',', '.'));
    if (!amount || amount <= 0) {
      this.showErrorMessage('Veuillez entrer un montant valide');
      return;
    }

    if (amount > this.soldeDisponible) {
      this.showErrorMessage('Le montant demandé dépasse le solde disponible');
      return;
    }

    const payload: CreateWithdrawalRequest = {
      pharmacyId: this.pharmacyId,
      amount,
      bankName: this.bankInfo.bankName,
      accountNumber: this.bankInfo.rib,
      accountHolder: this.bankInfo.fullName
    };

    this.isLoading = true;

    this.localCreateWithdrawal(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.closeModal();
          this.showSuccessPopup = true;

          // Recharger les données après une demande réussie
          this.loadSoldeDisponible();
          this.loadAmountStats();
          this.loadHistoriqueRetraits(
            this.selectedStatut !== 'Tous les statuts'
              ? this.mapStatutToAPI(this.selectedStatut)
              : undefined
          );

          setTimeout(() => {
            this.showSuccessPopup = false;
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMsg = error.userMessage || 'Erreur lors de la soumission de la demande de virement';
          this.showErrorMessage(errorMsg);
        }
      });
  }

  // ============================================
  // Méthodes pour l'ajout de carte bancaire
  // ============================================
  ajouterCarteBancaire(): void {
    this.showAddForm = true;
  }

  annulerAjout(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  ouvrirJustificatif(): void {
    this.showJustificatifModal = true;
  }

  fermerJustificatif(): void {
    this.showJustificatifModal = false;
  }

  supprimerJustificatif(): void {
    this.nouvelleCarteData.justificatif = null;
    this.showJustificatifModal = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB max
      this.nouvelleCarteData.justificatif = file;
    } else if (file && file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Maximum 10MB.');
    }
  }

  enregistrerCarte(): void {
    if (this.nouvelleCarteData.iban &&
      this.nouvelleCarteData.nomBanque &&
      this.nouvelleCarteData.nomTitulaire) {

      const nouvelleCarte: CartesBancaire = {
        id: this.cartesBancaires.length + 1,
        iban: this.nouvelleCarteData.iban,
        nomBanque: this.nouvelleCarteData.nomBanque,
        nomTitulaire: this.nouvelleCarteData.nomTitulaire,
        justificatif: this.nouvelleCarteData.justificatif?.name
      };

      this.cartesBancaires.push(nouvelleCarte);
      this.showAddForm = false;
      this.resetForm();

      alert('Carte bancaire ajoutée avec succès !');
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  resetForm(): void {
    this.nouvelleCarteData = {
      iban: '',
      nomBanque: '',
      nomTitulaire: 'Pharmacie Centrale SARL',
      justificatif: null
    };
    this.showJustificatifModal = false;
  }

  // ============================================
  // Méthodes pour la recherche et filtrage
  // ============================================
  rechercherRetrait(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.retraitsFiltres = [...this.retraits];
    } else {
      this.retraitsFiltres = this.retraits.filter(r =>
        r.reference.toLowerCase().includes(query) ||
        r.montant.toLowerCase().includes(query) ||
        r.commentaire.toLowerCase().includes(query)
      );
    }

    this.currentPage = 0; // Reset à page 0 (API commence à 0)
  }

  toggleStatutDropdown(): void {
    this.showStatutDropdown = !this.showStatutDropdown;
  }

  filtrerParStatut(statut: string): void {
    this.selectedStatut = statut;
    this.currentPage = 0;
    this.showStatutDropdown = false;

    // Mapper les statuts français vers les statuts API
    const statutAPI = this.mapStatutToAPI(statut);

    if (statut === 'Tous les statuts') {
      this.loadHistoriqueRetraits();
    } else {
      this.loadHistoriqueRetraits(statutAPI);
    }
  }

  /**
   * Mappe les statuts français vers les statuts API
   */
  private mapStatutToAPI(statut: string): string | undefined {
    const statutMap: { [key: string]: string } = {
      'En attente': 'PENDING',
      'Approuvé': 'APPROVED',
      'Rejeté': 'REJECTED',
      'Payé': 'PAID'
    };

    return statutMap[statut];
  }

  onItemsPerPageChange(): void {
    this.currentPage = 0; // Reset à page 0
    this.loadHistoriqueRetraits(
      this.selectedStatut !== 'Tous les statuts'
        ? this.mapStatutToAPI(this.selectedStatut)
        : undefined
    );
  }

  // ============================================
  // Méthodes pour la pagination
  // ============================================
  get paginatedRetraits(): Retrait[] {
    // Les données sont déjà paginées par l'API
    return this.retraitsFiltres;
  }

  get displayRange(): string {
    if (this.totalElements === 0) {
      return '0 - 0 sur 0';
    }
    const start = (this.currentPage * this.itemsPerPage) + 1;
    const end = Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalElements);
    return `${start} - ${end} sur ${this.totalElements}`;
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadHistoriqueRetraits(
        this.selectedStatut !== 'Tous les statuts'
          ? this.mapStatutToAPI(this.selectedStatut)
          : undefined
      );
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadHistoriqueRetraits(
        this.selectedStatut !== 'Tous les statuts'
          ? this.mapStatutToAPI(this.selectedStatut)
          : undefined
      );
    }
  }
}