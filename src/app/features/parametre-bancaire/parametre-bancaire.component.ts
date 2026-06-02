import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PharmacieService, BankParameterRequest, BankParameterResponse } from '../../services/pharmacie.service';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CartesBancaire {
  id: number;
  iban: string;
  nomBanque: string;
  nomTitulaire: string;
  telephone: string;
  justificatif?: {
    nom: string;
    dateMAJ: string;
    statut: 'validation' | 'valide' | 'rejete';
  };
}

interface ModificationHistorique {
  date: string;
  contenu: string;
  par: string;
  action: string;
  actionColor: string;
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
  selector: 'app-parametre-bancaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametre-bancaire.component.html',
  styleUrls: ['./parametre-bancaire.component.css']
})
export class ParametreBancaireComponent implements OnInit, OnDestroy {
  // Gestion du cycle de vie
  private destroy$ = new Subject<void>();

  // IDs
  pharmacyId: number | null = null;
  userId: number | null = null;

  // Données
  carteBancaire: CartesBancaire | null = null;
  historiqueModifications: ModificationHistorique[] = [];

  // États d'affichage
  showAddForm = false; // Par défaut on montre l'état vide
  showViewMode = false; // Mode visualisation après enregistrement
  showJustificatifModal = false;

  nouvelleCarteData = {
    iban: '',
    nomBanque: '',
    nomTitulaire: '',
    telephone: '',
    justificatif: null as File | null
  };

  // État de chargement et erreurs
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  showError = false;
  showSuccess = false;

  constructor(
    private pharmacieService: PharmacieService,
    private authService: AuthService
  ) {
    console.log('💳 ParametreBancaireComponent initialisé');
  }

  ngOnInit(): void {
    console.log('%c[INIT] Paramètres Bancaires chargé', 'color: green; font-weight: bold');
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    console.log('🔴 Destruction du composant Paramètres Bancaires');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le composant en récupérant le pharmacyId
   */
  private initializeComponent(): void {
    console.log('[INIT] 🚀 Démarrage initialisation paramètres bancaires');

    if (!this.authService.isLoggedIn()) {
      console.error('❌ Utilisateur non connecté');
      this.showErrorMessage('Vous devez être connecté pour accéder à cette page');
      return;
    }

    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      console.error('❌ Aucun utilisateur connecté trouvé');
      this.showErrorMessage('Impossible de récupérer les informations utilisateur');
      this.isLoading = false;
      return;
    }

    this.userId = currentUser.id;
    console.log('✅ User ID récupéré:', this.userId);

    this.authService.getCurrentUserById(this.userId)
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

          // Pré-remplir le téléphone si disponible
          if (user.telephone) {
            this.nouvelleCarteData.telephone = user.telephone;
          }

          // Pré-remplir le nom du titulaire avec le nom de la pharmacie si disponible
          if (user.nom) {
            this.nouvelleCarteData.nomTitulaire = user.nom;
          }

          // Vérifier si la pharmacie dispose déjà d'une information bancaire
          this.loadExistingBankInformation();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données utilisateur:', error);
          this.showErrorMessage('Erreur lors du chargement de vos informations');
          this.isLoading = false;
        }
      });
  }

  /**
   * Affiche le formulaire d'ajout de carte bancaire
   */
  ajouterCarteBancaire(): void {
    this.showAddForm = true;
    this.showViewMode = false;
    console.log('📝 Formulaire d\'ajout affiché');
  }

  /**
   * Annule l'ajout et réinitialise le formulaire
   */
  annulerAjout(): void {
    if (this.carteBancaire) {
      // Si une carte existe déjà, retourner en mode visualisation
      this.showAddForm = false;
      this.showViewMode = true;
    } else {
      // Sinon, cacher le formulaire
      this.showAddForm = false;
    }
    this.resetForm();
    console.log('❌ Ajout annulé');
  }

  /**
   * Passe en mode modification
   */
  modifierCarte(): void {
    this.showViewMode = false;
    this.showAddForm = true;

    // Pré-remplir le formulaire avec les données existantes
    if (this.carteBancaire) {
      this.nouvelleCarteData = {
        iban: this.carteBancaire.iban,
        nomBanque: this.carteBancaire.nomBanque,
        nomTitulaire: this.carteBancaire.nomTitulaire,
        telephone: this.carteBancaire.telephone,
        justificatif: null
      };
    }

    console.log('✏️ Mode modification activé');
  }

  /**
   * Ouvre le modal de justificatif
   */
  ouvrirJustificatif(): void {
    this.showJustificatifModal = true;
    console.log('📄 Modal justificatif ouvert');
  }

  /**
   * Supprime le justificatif
   */
  supprimerJustificatif(): void {
    this.nouvelleCarteData.justificatif = null;
    this.showJustificatifModal = false;
    console.log('🗑️ Justificatif supprimé');
  }

  /**
   * Gère la sélection d'un fichier
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB max
      this.nouvelleCarteData.justificatif = file;
      console.log('✅ Fichier sélectionné:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    } else if (file) {
      this.showErrorMessage('Le fichier ne doit pas dépasser 10MB');
      console.error('❌ Fichier trop volumineux');
    }
  }

  /**
   * Enregistre la carte bancaire via l'API
   */
  enregistrerCarte(): void {
    console.log('[SAVE] 💾 Tentative d\'enregistrement des paramètres bancaires...');

    // Validation des champs
    if (!this.validateForm()) {
      return;
    }

    if (!this.pharmacyId) {
      this.showErrorMessage('ID de pharmacie non disponible');
      return;
    }

    this.isSaving = true;

    // Préparer les données pour l'API
    const bankData: BankParameterRequest = {
      bankName: this.nouvelleCarteData.nomBanque,
      rib: this.nouvelleCarteData.iban,
      phone: this.nouvelleCarteData.telephone,
      fullName: this.nouvelleCarteData.nomTitulaire,
      pharmacyId: this.pharmacyId
    };

    const isEditing = !!this.carteBancaire?.id;
    const request$ = isEditing
      ? this.pharmacieService.updateBankParameter(this.carteBancaire!.id, bankData)
      : this.pharmacieService.saveBankParameter(bankData);

    console.log('📤 Envoi des données:', bankData);

    // Appel API
    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log(`✅ Paramètres bancaires ${isEditing ? 'mis à jour' : 'enregistrés'} avec succès:`, response);

          // Créer l'objet carte bancaire
          this.carteBancaire = {
            id: this.carteBancaire?.id || response?.id || 1,
            iban: this.nouvelleCarteData.iban,
            nomBanque: this.nouvelleCarteData.nomBanque,
            nomTitulaire: this.nouvelleCarteData.nomTitulaire,
            telephone: this.nouvelleCarteData.telephone
          };

          // Ajouter le justificatif si présent
          if (this.nouvelleCarteData.justificatif) {
            this.carteBancaire.justificatif = {
              nom: this.nouvelleCarteData.justificatif.name,
              dateMAJ: this.formatDate(new Date()),
              statut: 'validation'
            };
          }

          // Ajouter à l'historique
          this.ajouterHistorique(
            isEditing ? 'Compte bancaire modifié' : 'Compte bancaire créé',
            'Pharmacie Centrale',
            isEditing ? 'Modification' : 'Création',
            isEditing ? 'text-amber-600' : 'text-blue-600'
          );

          // Afficher un message de succès
          this.showSuccessMessage(
            isEditing
              ? 'Paramètres bancaires mis à jour avec succès'
              : 'Paramètres bancaires enregistrés avec succès'
          );

          // Passer en mode visualisation
          this.showAddForm = false;
          this.showViewMode = true;

          // Réinitialiser le formulaire
          this.resetForm();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'enregistrement:', error);

          // Si la pharmacie dispose déjà d'une information bancaire, basculer en mode visualisation
          if (this.isAlreadyExistingBankInfoError(error)) {
            this.loadExistingBankInformation(true);
            this.showSuccessMessage('Information bancaire existante chargée.');
            return;
          }

          const errorMsg = error.userMessage || 'Erreur lors de l\'enregistrement des paramètres bancaires';
          this.showErrorMessage(errorMsg);
          this.isSaving = false;
        }
      });
  }

  /**
   * Ajoute une entrée à l'historique
   */
  private ajouterHistorique(contenu: string, par: string, action: string, actionColor: string): void {
    const now = new Date();
    const dateStr = this.formatDateTime(now);

    this.historiqueModifications.unshift({
      date: dateStr,
      contenu: contenu,
      par: par,
      action: action,
      actionColor: actionColor
    });
  }

  /**
   * Formate une date en DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formate une date avec l'heure en DD/MM/YYYY HH:MM
   */
  private formatDateTime(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Obtient le texte du statut du justificatif
   */
  getStatutText(statut: string): string {
    switch (statut) {
      case 'validation': return 'En attente de validation';
      case 'valide': return 'Validé';
      case 'rejete': return 'Rejeté';
      default: return statut;
    }
  }

  /**
   * Obtient la couleur du statut du justificatif
   */
  getStatutColor(statut: string): string {
    switch (statut) {
      case 'validation': return 'text-yellow-600';
      case 'valide': return 'text-green-600';
      case 'rejete': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Valide le formulaire
   */
  private validateForm(): boolean {
    if (!this.nouvelleCarteData.iban.trim()) {
      this.showErrorMessage('L\'IBAN/RIB est requis');
      return false;
    }

    if (!this.nouvelleCarteData.nomBanque.trim()) {
      this.showErrorMessage('Le nom de la banque est requis');
      return false;
    }

    if (!this.nouvelleCarteData.nomTitulaire.trim()) {
      this.showErrorMessage('Le nom du titulaire est requis');
      return false;
    }

    if (!this.nouvelleCarteData.telephone.trim()) {
      this.showErrorMessage('Le numéro de téléphone est requis');
      return false;
    }

    // Validation basique du format téléphone (au moins 9 chiffres)
    const phoneDigits = this.nouvelleCarteData.telephone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      this.showErrorMessage('Le numéro de téléphone n\'est pas valide');
      return false;
    }

    console.log('✅ Validation du formulaire réussie');
    return true;
  }

  /**
   * Réinitialise le formulaire
   */
  private resetForm(): void {
    this.nouvelleCarteData = {
      iban: '',
      nomBanque: '',
      nomTitulaire: '',
      telephone: '',
      justificatif: null
    };
    this.showJustificatifModal = false;
    console.log('🔄 Formulaire réinitialisé');
  }

  /**
   * Charge les informations bancaires existantes de la pharmacie
   */
  private loadExistingBankInformation(fromSaveAction: boolean = false): void {
    if (!this.pharmacyId) {
      this.isLoading = false;
      if (fromSaveAction) this.isSaving = false;
      return;
    }

    this.isLoading = true;

    this.pharmacieService.getBankParameterByPharmacyId(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: BankParameterResponse) => {
          this.applyBankInformation(response);
          this.isLoading = false;
          if (fromSaveAction) this.isSaving = false;
        },
        error: (error) => {
          // Cas attendu: aucune information bancaire encore enregistrée
          if (this.isNoBankInformationError(error)) {
            this.carteBancaire = null;
            this.showViewMode = false;
            this.showAddForm = false;
            this.isLoading = false;
            if (fromSaveAction) this.isSaving = false;
            return;
          }

          this.showErrorMessage(error.userMessage || 'Impossible de récupérer les informations bancaires');
          this.isLoading = false;
          if (fromSaveAction) this.isSaving = false;
        }
      });
  }

  /**
   * Applique les informations bancaires récupérées à l'état du composant
   */
  private applyBankInformation(data: BankParameterResponse): void {
    this.carteBancaire = {
      id: data.id,
      iban: data.rib,
      nomBanque: data.bankName,
      nomTitulaire: data.fullName,
      telephone: data.phone
    };

    this.showAddForm = false;
    this.showViewMode = true;
  }

  /**
   * Détecte l'erreur "aucune information bancaire" renvoyée par l'API
   */
  private isNoBankInformationError(error: any): boolean {
    const message = this.extractApiMessage(error).toLowerCase();
    return (error?.status === 400 || error?.status === 404)
      && message.includes('aucune information bancaire');
  }

  /**
   * Détecte l'erreur "information bancaire déjà existante" sur save
   */
  private isAlreadyExistingBankInfoError(error: any): boolean {
    const message = this.extractApiMessage(error).toLowerCase();
    return error?.status === 400 && message.includes('dispose déjà d\'une information bancaire');
  }

  /**
   * Extrait le message retourné par l'API depuis le wrapper d'erreur
   */
  private extractApiMessage(error: any): string {
    return error?.originalError?.error?.message
      || error?.originalError?.message
      || error?.message
      || '';
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    console.error('⚠️ Erreur:', message);

    setTimeout(() => {
      this.showError = false;
    }, 5000);
  }

  /**
   * Affiche un message de succès
   */
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
    console.log('✅ Succès:', message);

    setTimeout(() => {
      this.showSuccess = false;
    }, 5000);
  }
}