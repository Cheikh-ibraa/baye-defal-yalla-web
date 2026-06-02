import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CommandeService, Prescription, PaginatedResponse, MedicationValidation, ReadyCommandeRequest, RejectCommandeRequest, ValidateCommandeRequest } from '../../services/commande.service';
import { AuthService, User } from '../../services/auth.service';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  reference: string;
  patient: string;
  date: string;
  status: 'En attente' | 'Validée';
  items: OrderItem[];
}

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.css']
})
export class CommandesComponent implements OnInit, OnDestroy {
  // Data properties from service
  prescriptions: Prescription[] = [];
  selectedPrescription: Prescription | null = null;

  // UI state
  saisieMode: 'medicament' | 'total' = 'medicament';
  montantTotal: number = 0;
  loading: boolean = false;
  error: string = '';

  // Responsive properties
  showMobileDetails: boolean = false;
  isMobileView: boolean = false;
  isTabletView: boolean = false;

  // Filter and search properties
  filteredPrescriptions: Prescription[] = [];
  paginatedPrescriptions: Prescription[] = [];
  searchTerm: string = '';
  showFilter: boolean = false;

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 100;
  totalItems: number = 0;
  totalPages: number = 0;

  // Math reference for template
  Math = Math;

  // User and pharmacy IDs - dynamically retrieved from AuthService
  private userId: number = 0;
  private pharmacyId: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private commandeService: CommandeService,
    private authService: AuthService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.initializeUserData();
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Écouter les changements de taille d'écran
   */
  @HostListener('window:resize', ['$event'])
  onResize(event?: any): void {
    this.checkScreenSize();
  }

  /**
   * Vérifier la taille de l'écran pour la responsivité
   */
  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isMobileView = width < 768;
    this.isTabletView = width >= 768 && width < 1024;

    // Réinitialiser showMobileDetails si on passe en desktop
    if (width >= 1024) {
      this.showMobileDetails = false;
    }
  }

  /**
   * Basculer entre la liste et les détails sur mobile
   */
  toggleMobileView(): void {
    this.showMobileDetails = !this.showMobileDetails;

    // Si on retourne à la liste, déselectionner la commande
    if (!this.showMobileDetails) {
      // On garde la sélection mais on masque les détails
    }
  }

  /**
   * Initialiser les données utilisateur à partir de l'AuthService
   */
  private initializeUserData(): void {
    // Vérifier si l'AuthService est disponible
    if (!this.authService) {
      console.error('AuthService non disponible');
      this.showAuthenticationError();
      return;
    }

    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      console.error('Utilisateur non connecté');
      this.showAuthenticationError();
      return;
    }

    // Récupérer l'utilisateur actuel depuis l'AuthService
    const currentUser = this.authService.getCurrentUser();

    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;

      // Charger les données une fois l'ID récupéré
      this.loadUserDataAndCommandes();
    } else {
      // Si pas d'utilisateur en cache, écouter les changements
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          if (user && user.id) {
            this.userId = user.id;
            this.loadUserDataAndCommandes();
          }
        });
    }
  }

  /**
   * Charger les données utilisateur et ensuite les commandes
   */
  private loadUserDataAndCommandes(): void {
    if (this.userId <= 0) {
      console.error('ID utilisateur invalide');
      return;
    }

    this.loading = true;

    // Récupérer les informations complètes de l'utilisateur pour obtenir le pharmacyId
    this.authService.getCurrentUserById(this.userId).subscribe({
      next: (user: User) => {
        if (user.pharmacyId) {
          this.pharmacyId = user.pharmacyId;

          // Maintenant charger les commandes
          this.loadCommandes();
        } else {
          console.error('Aucun ID de pharmacie trouvé pour l\'utilisateur connecté');
          this.loading = false;
          this.showNoPharmacyError();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        this.loading = false;
        this.showUserDataError();
      }
    });
  }

  /**
   * Charger les commandes depuis le service
   */
  loadCommandes(): void {
    if (this.pharmacyId <= 0) {
      console.error('ID pharmacie invalide');
      this.loadUserDataAndCommandes();
      return;
    }

    this.loading = true;
    this.error = '';
    const page = this.currentPage - 1; // API uses 0-based pagination

    this.commandeService.getCommandes(this.pharmacyId, page, this.itemsPerPage)
      .subscribe({
        next: (response: PaginatedResponse<Prescription>) => {
          this.prescriptions = response.content;
          this.filteredPrescriptions = [...this.prescriptions];
          this.totalItems = response.totalElements;
          this.totalPages = response.totalPages;
          this.updatePagination();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des commandes:', error);
          this.error = 'Erreur lors du chargement des commandes';
          this.loading = false;
          Swal.fire({
            title: 'Erreur',
            text: 'Impossible de charger les commandes',
            icon: 'error',
            confirmButtonColor: '#FF6B6B'
          });
        }
      });
  }

  /**
   * Charger les détails d'une commande
   */
  loadCommandeDetails(prescriptionId: number): void {
    this.commandeService.getDetailsCommande(prescriptionId)
      .subscribe({
        next: (prescription: Prescription) => {
          this.selectedPrescription = prescription;
          // Initialize montantTotal if in total mode
          if (this.saisieMode === 'total') {
            this.montantTotal = prescription.amount || 0;
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des détails:', error);
          Swal.fire({
            title: 'Erreur',
            text: 'Impossible de charger les détails de la commande',
            icon: 'error',
            confirmButtonColor: '#FF6B6B'
          });
        }
      });
  }

  /**
   * Définir le mode de saisie
   */
  setSaisieMode(mode: 'medicament' | 'total'): void {
    this.saisieMode = mode;
    // Ne réinitialiser montantTotal que si l'utilisateur n'a encore rien saisi
    if (mode === 'total' && this.selectedPrescription && this.montantTotal === 0) {
      this.montantTotal = this.selectedPrescription.amount || 0;
    }
  }

  /**
   * Mettre à jour un médicament
   */
  updateMedicament(index: number, field: string, event: any): void {
    if (!this.selectedPrescription) return;

    const value = event.target.value;
    const medication = this.selectedPrescription.medications[index];

    switch (field) {
      case 'name':
        medication.name = value;
        break;
      case 'dosage':
        medication.dosage = value;
        break;
      case 'quantity':
        medication.quantity = parseInt(value) || 0;
        break;
      case 'price':
        medication.price = parseFloat(value) || 0;
        break;
    }
  }

  /**
   * Ajouter un nouveau médicament
   */
  ajouterMedicament(): void {
    if (!this.selectedPrescription) return;

    const nouveauMedicament = {
      id: 0, // Temporary ID for new medication
      name: '',
      dosage: '',
      quantity: 0,
      price: 0
    };

    this.selectedPrescription.medications.push(nouveauMedicament);
  }

  /**
   * Supprimer un médicament
   */
  supprimerMedicament(index: number): void {
    if (!this.selectedPrescription || this.selectedPrescription.medications.length <= 1) {
      Swal.fire({
        title: 'Impossible',
        text: 'Vous devez garder au moins un médicament dans la commande.',
        icon: 'warning',
        confirmButtonColor: '#FF6B6B'
      });
      return;
    }

    Swal.fire({
      title: 'Supprimer ce médicament ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF6B6B',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedPrescription!.medications.splice(index, 1);
        Swal.fire({
          title: 'Supprimé !',
          text: 'Le médicament a été supprimé.',
          icon: 'success',
          confirmButtonColor: '#00B894',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  /**
   * Obtenir le total selon le mode de saisie
   */
  getTotal(): number {
    if (this.saisieMode === 'total') {
      return this.montantTotal;
    }
    return this.calculerTotal();
  }

  /**
   * Calculer le total de la commande
   */
  calculerTotal(): number {
    if (!this.selectedPrescription) return 0;

    return this.selectedPrescription.medications.reduce((total, medication) => {
      return total + (medication.quantity * medication.price);
    }, 0);
  }

  /**
   * Accepter la commande
   */
  accepterCommande(): void {
    if (!this.selectedPrescription) return;

    // Valider le formulaire selon le mode de saisie
    if (this.saisieMode === 'medicament') {
      const medicamentsValides = this.selectedPrescription.medications.every(med =>
        med.name.trim() !== '' && med.quantity > 0 && med.price > 0
      );

      if (!medicamentsValides) {
        Swal.fire({
          title: 'Validation incomplète',
          text: 'Veuillez renseigner le prix unitaire (P U) pour chaque médicament.',
          icon: 'warning',
          confirmButtonColor: '#FF6B6B'
        });
        return;
      }
    } else if (this.saisieMode === 'total') {
      if (!this.montantTotal || this.montantTotal <= 0) {
        Swal.fire({
          title: 'Montant invalide',
          text: 'Veuillez saisir un montant total valide.',
          icon: 'warning',
          confirmButtonColor: '#FF6B6B'
        });
        return;
      }
    }

    const prescriptionRef = `CMD-${this.selectedPrescription.id}`;
    const patientName = `${this.selectedPrescription.patient.prenom} ${this.selectedPrescription.patient.nom}`;

    Swal.fire({
      title: 'Accepter cette commande ?',
      html: `
        <div style="text-align: center; padding: 10px;">
          <p style="margin: 0; font-size: 16px; font-weight: 500;">Commande N° <strong style="color: #00B894;">${prescriptionRef}</strong></p>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: #666;">Patient: <strong>${patientName}</strong></p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Montant: <strong>${this.getTotal().toLocaleString('fr-FR')} FCFA</strong></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00B894',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<span style="font-size: 15px; font-weight: 500; padding: 2px 8px;">✓ Oui, accepter</span>',
      cancelButtonText: '<span style="font-size: 15px; font-weight: 500; padding: 2px 8px;">✕ Annuler</span>',
      buttonsStyling: true,
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;

        // Préparer les données de validation selon le mode de saisie
        let validationData: ValidateCommandeRequest;

        if (this.saisieMode === 'medicament') {
          // Mode médicament : envoyer les prix par médicament, montant = somme calculée
          const medicationsToValidate = this.selectedPrescription!.medications
            .filter(med => med.id && med.id > 0) // Uniquement les médicaments existants (ID valide)
            .map(med => ({
              medicationId: med.id,
              unitPrice: Number(med.price) || 0
            }));

          validationData = {
            prescriptionId: this.selectedPrescription!.id,
            amount: this.calculerTotal(), // Montant calculé depuis les prix par médicament
            medications: medicationsToValidate
          };

          console.log('Données de validation (mode médicament) :', validationData);
        } else {
          // Mode total : montant global saisi, aucun détail par médicament
          validationData = {
            prescriptionId: this.selectedPrescription!.id,
            amount: Number(this.montantTotal),
            medications: []
          };
        }

        // Appeler le service pour valider la commande
        this.commandeService.validerCommande(validationData)
          .subscribe({
            next: (response) => {
              this.loading = false;

              Swal.fire({
                title: 'Acceptée !',
                html: `
                  <div style="text-align: center;">
                    <p style="font-size: 15px; color: #666; margin: 8px 0;">La commande <strong>${prescriptionRef}</strong> a été acceptée avec succès.</p>
                    <p style="font-size: 14px; color: #00B894; margin: 8px 0;">Le patient sera notifié.</p>
                  </div>
                `,
                icon: 'success',
                confirmButtonColor: '#00B894',
                confirmButtonText: 'OK',
                timer: 3000,
                timerProgressBar: true
              });

              // Rafraîchir la liste et réinitialiser la sélection
              this.selectedPrescription = null;
              this.montantTotal = 0;
              this.saisieMode = 'medicament';
              this.showMobileDetails = false; // Retour à la liste sur mobile
              this.loadCommandes();
            },
            error: (error) => {
              this.loading = false;
              console.error('❌ Erreur lors de l\'acceptation:', error);
              console.error('📋 Détails de l\'erreur:', {
                status: error.status,
                statusText: error.statusText,
                message: error.error?.message || error.message,
                error: error.error
              });

              let errorMessage = 'Impossible d\'accepter la commande. Veuillez réessayer.';

              // Gestion des messages d'erreur spécifiques
              if (error.status === 400) {
                errorMessage = 'Données invalides. Veuillez vérifier les informations saisies.';
              } else if (error.status === 404) {
                errorMessage = 'Commande introuvable. Elle a peut-être déjà été traitée.';
              } else if (error.status === 500) {
                errorMessage = 'Erreur serveur. Veuillez contacter l\'administrateur.';
                if (error.error?.message) {
                  errorMessage += `\n\nDétails: ${error.error.message}`;
                }
              } else if (error.error?.message) {
                errorMessage = error.error.message;
              }

              Swal.fire({
                title: 'Erreur',
                html: `
                  <div style="text-align: center;">
                    <p style="font-size: 15px; color: #666; margin: 8px 0;">${errorMessage}</p>
                    ${error.status ? `<p style="font-size: 12px; color: #999; margin-top: 12px;">Code erreur: ${error.status}</p>` : ''}
                  </div>
                `,
                icon: 'error',
                confirmButtonColor: '#FF6B6B',
                confirmButtonText: 'Fermer'
              });
            }
          });
      }
    });
  }

  /**
   * Marquer une commande en préparation comme prête pour livraison
   */
  marquerCommandePretePourLivraison(): void {
    if (!this.selectedPrescription || this.selectedPrescription.status !== 'IN_PREPARATION') {
      return;
    }

    const prescriptionRef = this.getPrescriptionReference(this.selectedPrescription.id);

    Swal.fire({
      html: `
        <div class="text-center px-2 pt-2 pb-1">
          <div class="w-20 h-20 border-[6px] border-[#E6B27B] rounded-full flex items-center justify-center mx-auto mb-5">
            <span class="text-5xl leading-none text-[#E6B27B] font-medium">!</span>
          </div>
          <h3 class="text-3xl font-medium text-[#2B2B33] mb-3">Confirmer la préparation</h3>
          <p class="text-lg leading-7 text-[#3E3E47]">
            Êtes-vous sûr de vouloir marquer cette commande<br>
            comme <strong class="font-bold text-[#2B2B33]">prête pour livraison</strong> ?
          </p>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler',
      buttonsStyling: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'rounded-[20px] p-6 sm:p-7',
        actions: 'flex items-center justify-center gap-4 mt-6',
        confirmButton: 'bg-[#54B796] text-white rounded-md px-6 py-2.5 text-base font-medium hover:bg-[#45A688] transition-colors',
        cancelButton: 'bg-transparent text-[#FF5A5F] px-3 py-2.5 text-base font-medium'
      }
    }).then((result) => {
      if (!result.isConfirmed || !this.selectedPrescription) {
        return;
      }

      this.loading = true;

      const readyData: ReadyCommandeRequest = {
        prescriptionId: this.selectedPrescription.id
      };

      this.commandeService.marquerCommandePrete(readyData).subscribe({
        next: () => {
          this.loading = false;

          Swal.fire({
            title: 'Succès',
            html: `
              <div style="text-align: center;">
                <p style="font-size: 15px; color: #666; margin: 8px 0;">
                  La commande <strong>${prescriptionRef}</strong> est maintenant prête pour livraison.
                </p>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#00B894',
            confirmButtonText: 'OK'
          });

          this.selectedPrescription = null;
          this.showMobileDetails = false;
          this.loadCommandes();
        },
        error: (error) => {
          this.loading = false;
          console.error('❌ Erreur lors du passage en prêt pour livraison:', error);

          Swal.fire({
            title: 'Erreur',
            text: 'Impossible de marquer la commande comme prête pour livraison.',
            icon: 'error',
            confirmButtonColor: '#FF6B6B',
            confirmButtonText: 'Fermer'
          });
        }
      });
    });
  }

  /**
   * Refuser la commande
   */
  refuserCommande(): void {
    if (!this.selectedPrescription) return;

    Swal.fire({
      title: 'Refuser cette commande ?',
      text: 'Veuillez fournir une raison (facultatif) :',
      input: 'text',
      inputPlaceholder: 'Raison du refus',
      showCancelButton: true,
      confirmButtonColor: '#FF6B6B',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Refuser',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const rejectionData: RejectCommandeRequest = {
          prescriptionId: this.selectedPrescription!.id
        };

        this.commandeService.rejeterCommande(rejectionData)
          .subscribe({
            next: () => {
              const raison = result.value || 'Non précisée';

              Swal.fire({
                title: 'Refusée !',
                text: 'La commande a été refusée.',
                icon: 'info',
                confirmButtonColor: '#FF6B6B'
              });

              // Refresh the list and clear selection
              this.selectedPrescription = null;
              this.showMobileDetails = false; // Retour à la liste sur mobile
              this.loadCommandes();
            },
            error: (error) => {
              console.error('Erreur lors du refus:', error);
              Swal.fire({
                title: 'Erreur',
                text: 'Impossible de refuser la commande',
                icon: 'error',
                confirmButtonColor: '#FF6B6B'
              });
            }
          });
      }
    });
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPrescriptions = [...this.prescriptions];
    } else {
      this.filteredPrescriptions = this.prescriptions.filter(prescription => {
        const prescriptionRef = `CMD-${prescription.id}`;
        const patientName = `${prescription.patient.prenom} ${prescription.patient.nom}`;
        const doctorName = `${prescription.doctor.prenom} ${prescription.doctor.nom}`;

        return prescriptionRef.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          patientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          doctorName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          prescription.createdAt.includes(this.searchTerm) ||
          prescription.status.toLowerCase().includes(this.searchTerm.toLowerCase());
      });
    }
    this.totalItems = this.filteredPrescriptions.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Filter functionality
  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  // Selection functionality
  selectPrescription(prescription: Prescription): void {
    this.loadCommandeDetails(prescription.id);

    // Sur mobile et tablet, afficher automatiquement les détails
    if (this.isMobileView || this.isTabletView) {
      this.showMobileDetails = true;
    }
  }

  // Pagination functionality
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadCommandes();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCommandes();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.loadCommandes();
    }
  }

  private updatePagination(): void {
    this.totalItems = this.filteredPrescriptions.length;
    const maxPage = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    if (this.currentPage > maxPage) this.currentPage = maxPage;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = Math.min(start + this.itemsPerPage, this.totalItems);
    this.paginatedPrescriptions = this.filteredPrescriptions.slice(start, end);
  }

  // Pagination helper methods
  getTotalPages(): number {
    return this.totalPages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  // Status helper methods
  isStatusPending(status: string): boolean {
    return status === 'PENDING';
  }

  isStatusValidated(status: string): boolean {
    return status === 'ACCEPTED';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-[#FEF3C7] text-[#D97706]';
      case 'ACCEPTED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'IN_PREPARATION': return 'bg-blue-100 text-blue-700';
      case 'READY': return 'bg-purple-100 text-purple-700';
      case 'DELIVERED': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'ACCEPTED': return 'Acceptée';
      case 'REJECTED': return 'Refusée';
      case 'IN_PREPARATION': return 'En préparation';
      case 'READY': return 'Prête';
      case 'DELIVERED': return 'Livrée';
      default: return status;
    }
  }

  // Utility methods
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getPrescriptionReference(id: number): string {
    return `CMD-${id}`;
  }

  /**
   * Vérifie si le fichier de l'ordonnance est un PDF
   */
  isPrescriptionPdf(filename: string | null): boolean {
    if (!filename) return false;
    return filename.toLowerCase().endsWith('.pdf');
  }

  /**
   * Retourne l'URL complète du fichier
   */
  getFileUrl(filename: string | null): string {
    if (!filename) return '';
    return `https://wakana.online/repertoire_chantier/${filename}`;
  }

  /**
   * Ouvre le fichier dans un nouvel onglet
   */
  openFile(filename: string | null): void {
    if (!filename) return;
    window.open(this.getFileUrl(filename), '_blank');
  }

  getPatientFullName(prescription: Prescription): string {
    return `${prescription.patient.prenom} ${prescription.patient.nom}`;
  }

  getDoctorFullName(prescription: Prescription): string {
    return `${prescription.doctor.prenom} ${prescription.doctor.nom}`;
  }

  // Filter by status
  filterByStatus(status: string): void {
    if (status === 'all') {
      this.filteredPrescriptions = [...this.prescriptions];
    } else {
      this.filteredPrescriptions = this.prescriptions.filter(prescription => prescription.status === status);
    }
    this.totalItems = this.filteredPrescriptions.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  refreshData(): void {
    this.loadCommandes();
  }

  /**
   * TrackBy function pour optimiser les performances
   */
  trackByPrescriptionId(index: number, prescription: Prescription): number {
    return prescription.id;
  }

  // Error handling methods
  private showAuthenticationError(): void {
    Swal.fire({
      title: 'Erreur d\'authentification',
      text: 'Vous devez être connecté pour accéder à cette page',
      icon: 'warning',
      confirmButtonColor: '#FF6B6B',
      confirmButtonText: 'OK'
    });
  }

  private showNoPharmacyError(): void {
    Swal.fire({
      title: 'Erreur',
      text: 'Aucune pharmacie associée à votre compte',
      icon: 'warning',
      confirmButtonColor: '#FF6B6B',
      confirmButtonText: 'OK'
    });
  }

  private showUserDataError(): void {
    Swal.fire({
      title: 'Erreur',
      text: 'Impossible de récupérer les informations utilisateur',
      icon: 'error',
      confirmButtonColor: '#FF6B6B',
      confirmButtonText: 'OK'
    });
  }

  // Utility methods for component state
  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getCurrentUserProfile(): string {
    const user = this.authService.getCurrentUser();
    return user?.profil || '';
  }

  getCurrentPharmacyId(): number {
    return this.pharmacyId;
  }

  hasValidPharmacy(): boolean {
    return this.pharmacyId > 0;
  }

  /**
   * Formater la devise
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }
}