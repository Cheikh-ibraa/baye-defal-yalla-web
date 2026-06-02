import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { DeliveryService, DeliveryResponse, Delivery } from '../../services/delivery.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-livraison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './livraison.component.html',
  styleUrls: ['./livraison.component.css']
})
export class LivraisonComponent implements OnInit, OnDestroy {

  // Data properties
  deliveries: Delivery[] = [];
  selectedDelivery: Delivery | null = null;
  activeTab: string = 'medicaments';
  loading: boolean = false;
  error: string = '';

  // Pagination properties
  currentPage: number = 0;
  itemsPerPage: number = 5;
  totalItems: number = 0;
  totalPages: number = 0;
  startIndex: number = 0;
  endIndex: number = 0;

  // Filter properties
  selectedStatus: string = 'CREATED';
  patientId?: number;

  // User and pharmacy IDs - dynamically retrieved from AuthService
  private userId: number = 0;
  private pharmacyId: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private deliveryService: DeliveryService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initializeUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser les données utilisateur à partir de l'AuthService
   */
  private initializeUserData(): void {
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
      console.log('ID utilisateur récupéré:', this.userId);

      // Charger les données une fois l'ID récupéré
      this.loadUserDataAndDeliveries();
    } else {
      // Si pas d'utilisateur en cache, écouter les changements
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          if (user && user.id) {
            this.userId = user.id;
            console.log('ID utilisateur récupéré via observable:', this.userId);
            this.loadUserDataAndDeliveries();
          }
        });
    }
  }

  /**
   * Charger les données utilisateur et ensuite les livraisons
   */
  private loadUserDataAndDeliveries(): void {
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
          console.log('ID pharmacie récupéré:', this.pharmacyId);

          // Maintenant charger les livraisons
          this.loadDeliveries();
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
   * Charge les livraisons depuis l'API
   */
  loadDeliveries(): void {
    if (this.pharmacyId <= 0) {
      console.error('ID pharmacie invalide');
      this.loadUserDataAndDeliveries();
      return;
    }

    this.loading = true;
    this.error = '';

    this.deliveryService.getDeliveries(
      this.pharmacyId, // Utilisation de l'ID de pharmacie dynamique
      this.selectedStatus,
      this.currentPage,
      this.itemsPerPage
    ).subscribe({
      next: (response: DeliveryResponse) => {
        this.deliveries = response.content.map(item => item.delivery);
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
        this.updatePaginationInfo();
        this.loading = false;

        // Auto-select first delivery if none selected
        if (this.deliveries.length > 0 && !this.selectedDelivery) {
          this.selectedDelivery = this.deliveries[0];
        }
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des livraisons';
        this.loading = false;
        console.error('Erreur:', error);

        // Afficher une alerte d'erreur avec SweetAlert2
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de charger les livraisons',
          icon: 'error',
          confirmButtonColor: '#FF6B6B'
        });
      }
    });
  }

  /**
   * Met à jour les informations de pagination
   */
  updatePaginationInfo(): void {
    this.startIndex = this.currentPage * this.itemsPerPage + 1;
    this.endIndex = Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems);
  }

  /**
   * Navigation vers la page précédente
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadDeliveries();
    }
  }

  /**
   * Navigation vers la page suivante
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadDeliveries();
    }
  }

  /**
   * Changement du nombre d'éléments par page
   */
  onItemsPerPageChange(): void {
    this.currentPage = 0;
    this.loadDeliveries();
  }

  /**
   * Changement du statut de filtre
   */
  onStatusChange(): void {
    this.currentPage = 0;
    this.selectedDelivery = null;
    this.loadDeliveries();
  }

  /**
   * Sélection d'une livraison
   */
  selectDelivery(delivery: Delivery): void {
    this.selectedDelivery = delivery;
    this.activeTab = 'medicaments';
  }

  /**
   * Imprimer la commande
   */
  printOrder(): void {
    if (this.selectedDelivery) {
      console.log('Impression de la livraison:', this.selectedDelivery.id);
      window.print();
    }
  }

  /**
   * Rafraîchir les données
   */
  refreshData(): void {
    this.loadDeliveries();
  }

  /**
   * TrackBy function pour optimiser les performances
   */
  trackByDeliveryId(index: number, delivery: Delivery): number {
    return delivery.id;
  }

  /**
   * Obtenir la classe CSS pour le statut
   */
  getStatusColorClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CREATED':
        return 'bg-slate-100 text-slate-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-teal-100 text-teal-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtenir le libellé du statut en français
   */
  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CREATED':
        return 'Créée';
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status || 'Inconnu';
    }
  }

  /**
   * Calculer le total des médicaments
   */
  calculateTotal(medications: any[]): number {
    if (!medications) return 0;
    return medications.reduce((total, med) => total + (med.quantity * med.price), 0);
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

  /**
   * Formater la date
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  /**
   * Obtenir le nom complet d'une personne
   */
  getFullName(person: any): string {
    if (!person) return '';
    return `${person.prenom || ''} ${person.nom || ''}`.trim();
  }

  /**
   * Obtenir la référence de livraison
   */
  getDeliveryReference(id: number): string {
    return `LIV-${id}`;
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

  // Status helper methods
  isStatusPending(status: string): boolean {
    return status?.toUpperCase() === 'PENDING';
  }

  isStatusDelivered(status: string): boolean {
    return status?.toUpperCase() === 'DELIVERED';
  }

  isStatusInProgress(status: string): boolean {
    return status?.toUpperCase() === 'IN_PROGRESS';
  }

  isStatusCancelled(status: string): boolean {
    return status?.toUpperCase() === 'CANCELLED';
  }
}