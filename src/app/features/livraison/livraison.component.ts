import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { of } from 'rxjs';
import { delay, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { User } from '../../core/auth.types';

interface Doctor {
  id: number;
  nom: string;
  prenom: string;
}

interface Patient {
  id: number;
  nom: string;
  prenom: string;
}

interface Pharmacist {
  id: number;
  nom: string;
  prenom: string;
}

interface Medication {
  id: number;
  name: string;
  quantity: number;
  dosage: string;
  price: number;
}

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  logo: string;
  hourly: string;
  pharmacist: Pharmacist;
}

interface Prescription {
  id: number;
  reference: string;
  doctor: Doctor;
  patient: Patient;
  createdAt: string;
  status: string;
  qrCodeUrl: string;
  fullyPaidByDonor: boolean;
  partiallyPaidByDonor: boolean;
  pharmacy: Pharmacy;
  amount: number;
  amountContributed: number;
  needsHelp: boolean;
  address: string;
  latitude: number | null;
  longitude: number | null;
  prescriptionFile: string | null;
  medications: Medication[];
  contributionPercentage: number;
}

interface DeliveryPerson {
  id: number;
  nom: string;
  prenom: string;
}

interface Delivery {
  id: number;
  prescription: Prescription;
  deliveryPerson: DeliveryPerson;
  deliveryAddress: string;
  deliveryTime: string;
  status: string;
  patientOrRepresentativePickup: boolean;
  pharmacyLat: number;
  pharmacyLon: number;
  patientLat: number;
  patientLon: number;
  price: number;
  deliveredAt: string | null;
  cancelledAt: string | null;
}

interface DeliveryItem {
  delivery: Delivery;
  price: number;
}

interface DeliveryResponse {
  content: DeliveryItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { sorted: boolean; unsorted: boolean; empty: boolean };
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
  sort: { sorted: boolean; unsorted: boolean; empty: boolean };
  first: boolean;
  empty: boolean;
}

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
  private mockDeliveries: Delivery[] = [];
  private mockCurrentUser: User = {
    id: 1,
    nom: 'Demo',
    prenom: 'Livreur',
    email: 'demo@pharmacie.local',
    profil: 'PHARMACIEN',
    pharmacyId: 1,
    telephone: '',
    adress: '',
    lat: 0,
    lon: 0
  } as User;

  constructor() { }

  private getMockCurrentUser(): User {
    return this.mockCurrentUser;
  }

  private initMockDeliveries(): void {
    if (this.mockDeliveries.length > 0) return;

    const pharmacy = {
      id: 1,
      name: 'Pharmacie Demo',
      address: 'Adresse de démonstration',
      phone: '000000000',
      email: 'demo@pharmacie.local',
      latitude: 0,
      longitude: 0,
      logo: '',
      hourly: '08:00-18:00',
      pharmacist: { id: 1, nom: 'Demo', prenom: 'Pharmacien' }
    };

    const prescriptionBase: Prescription = {
      id: 1,
      reference: 'CMD-0001',
      doctor: { id: 10, nom: 'Dupont', prenom: 'Jean' },
      patient: { id: 20, nom: 'Martin', prenom: 'Alice' },
      createdAt: new Date().toISOString(),
      status: 'CREATED',
      qrCodeUrl: '',
      fullyPaidByDonor: false,
      partiallyPaidByDonor: false,
      pharmacy,
      amount: 3500,
      amountContributed: 0,
      needsHelp: false,
      address: 'Quartier Centre',
      latitude: null,
      longitude: null,
      prescriptionFile: null,
      medications: [
        { id: 1, name: 'Paracétamol', quantity: 2, dosage: '500mg', price: 1200 }
      ],
      contributionPercentage: 0
    };

    this.mockDeliveries = [
      {
        id: 1,
        prescription: prescriptionBase,
        deliveryPerson: { id: 1, nom: 'Diallo', prenom: 'Ibrahima' },
        deliveryAddress: 'Quartier Centre',
        deliveryTime: '12:30',
        status: 'CREATED',
        patientOrRepresentativePickup: false,
        pharmacyLat: 0,
        pharmacyLon: 0,
        patientLat: 0,
        patientLon: 0,
        price: 500,
        deliveredAt: null,
        cancelledAt: null
      },
      {
        id: 2,
        prescription: {
          ...prescriptionBase,
          id: 2,
          reference: 'CMD-0002',
          status: 'ACCEPTED',
          amount: 5400,
          medications: [
            { id: 2, name: 'Amoxicilline', quantity: 1, dosage: '1g', price: 5400 }
          ]
        },
        deliveryPerson: { id: 2, nom: 'Sy', prenom: 'Moussa' },
        deliveryAddress: 'Quartier Nord',
        deliveryTime: '15:00',
        status: 'PENDING',
        patientOrRepresentativePickup: true,
        pharmacyLat: 0,
        pharmacyLon: 0,
        patientLat: 0,
        patientLon: 0,
        price: 700,
        deliveredAt: null,
        cancelledAt: null
      }
    ];
  }

  private localGetDeliveries(
    pharmacyId: number,
    status: string = 'CREATED',
    page: number = 0,
    size: number = 10
  ) {
    this.initMockDeliveries();
    const filtered = this.mockDeliveries.filter(delivery => delivery.status === status);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(delivery => ({ delivery, price: delivery.price }));

    const response: DeliveryResponse = {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { sorted: false, unsorted: true, empty: true },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      last: start + content.length >= filtered.length,
      numberOfElements: content.length,
      size,
      number: page,
      sort: { sorted: false, unsorted: true, empty: true },
      first: page === 0,
      empty: content.length === 0
    };

    return of(response).pipe(delay(220));
  }

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
    const currentUser = this.getMockCurrentUser();

    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
      console.log('ID utilisateur récupéré:', this.userId);

      this.loadUserDataAndDeliveries();
    } else {
      this.showAuthenticationError();
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

    const currentUser = this.getMockCurrentUser();
    const user = currentUser && currentUser.id === this.userId ? currentUser : null;

    if (!user) {
      this.loading = false;
      this.showUserDataError();
      return;
    }

    if (user.pharmacyId) {
      this.pharmacyId = user.pharmacyId;
      console.log('ID pharmacie récupéré:', this.pharmacyId);

      this.loadDeliveries();
    } else {
      console.error('Aucun ID de pharmacie trouvé pour l\'utilisateur connecté');
      this.loading = false;
      this.showNoPharmacyError();
    }
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

    this.localGetDeliveries(
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
      error: (error: any) => {
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
    return !!this.getMockCurrentUser();
  }

  getCurrentUserProfile(): string {
    const user = this.getMockCurrentUser();
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