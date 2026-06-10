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
  code?: string;
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
  selector: 'app-demande-complement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-complement.component.html',
  styleUrls: ['./demande-complement.component.css']
})
export class DemandeComplementComponent implements OnInit, OnDestroy {

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
  selectedStatus: string = 'PENDING';
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
      code: 'PH-00231',
      name: 'Pharmacie Almadies Santé',
      address: 'Almadies, Dakar, Sénégal',
      phone: '+221 77 345 67 88',
      email: 'almadies@sante.local',
      latitude: 14.7483,
      longitude: -17.5123,
      logo: 'assets/images/logoPharmacie.png',
      hourly: '08:00-22:00',
      pharmacist: { id: 1, nom: 'Diallo', prenom: 'Amath' }
    };

    const prescriptionBase: Prescription = {
      id: 1,
      reference: 'CMD-0001',
      doctor: { id: 10, nom: 'Dupont', prenom: 'Jean' },
      patient: { id: 20, nom: 'Martin', prenom: 'Alice' },
      createdAt: '2025-04-23T10:00:00Z',
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

    const makeDelivery = (id: number, ref: string, patientNom: string, patientPrenom: string, date: string, status: string, medsOverride?: any[]): Delivery => ({
      id,
      prescription: {
        ...prescriptionBase,
        id,
        reference: ref,
        status,
        patient: { id, nom: patientNom, prenom: patientPrenom },
        medications: medsOverride ?? prescriptionBase.medications
      },
      deliveryPerson: { id: 1, nom: 'Diallo', prenom: 'Ibrahima' },
      deliveryAddress: 'Dakar, Sénégal',
      deliveryTime: date,
      status,
      patientOrRepresentativePickup: false,
      pharmacyLat: 0, pharmacyLon: 0, patientLat: 0, patientLon: 0,
      price: 500,
      deliveredAt: null,
      cancelledAt: null
    });

    this.mockDeliveries = [
      makeDelivery(4532, 'D-4532', 'Diop', 'Babacar', '2025-04-23T10:00:00Z', 'PENDING',
        [{ id: 1, name: 'Paracétamol', quantity: 2, dosage: '500mg', price: 1200 }]),
      makeDelivery(4531, 'D-4531', 'Tall', 'Maimouna', '2025-04-23T11:00:00Z', 'PENDING',
        [{ id: 2, name: 'Amoxicilline', quantity: 1, dosage: '1g', price: 5400 }]),
      makeDelivery(4530, 'D-4530', 'Gueye', 'Lamine', '2025-04-23T12:00:00Z', 'ACCEPTED',
        [{ id: 3, name: 'Ibuprofène', quantity: 1, dosage: '400mg', price: 2000 }]),
      makeDelivery(4529, 'D-4529', 'Tall', 'Maimouna', '2025-04-22T09:00:00Z', 'ACCEPTED',
        [{ id: 4, name: 'Doliprane', quantity: 3, dosage: '1g', price: 1500 }])
    ];
  }

  private localGetDeliveries(
    pharmacyId: number,
    status: string = 'CREATED',
    page: number = 0,
    size: number = 10
  ) {
    this.initMockDeliveries();
    const filtered = status ? this.mockDeliveries.filter(delivery => delivery.status === status) : this.mockDeliveries;
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
        return 'bg-[#FFF3CD] text-[#B8860B]';
      case 'ACCEPTED':
        return 'bg-[#D4EDDA] text-[#2E7D32]';
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
        return 'Validée';
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

  // UI state sets — ne modifient pas delivery.status
  private acceptedIds = new Set<number>();
  private readyIds = new Set<number>();

  isAccepted(deliveryId: number): boolean {
    return this.acceptedIds.has(deliveryId);
  }

  isReady(deliveryId: number): boolean {
    return this.readyIds.has(deliveryId);
  }

  markAsReady(delivery: Delivery): void {
    this.readyIds.add(delivery.id);
    Swal.fire({ title: 'Prête !', text: `La demande ${delivery.prescription.reference} est marquée comme prête.`, icon: 'success', confirmButtonColor: '#4FBFA5' });
  }

  scanQrCode(delivery: Delivery): void {
    Swal.fire({
      title: 'Scanner un QR Code',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:8px 0">
          <div style="background:#4a4a4a;border-radius:12px;padding:20px;display:flex;align-items:center;justify-content:center;width:220px;height:220px">
            <div style="position:relative;width:180px;height:180px">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${delivery.prescription.reference}" style="width:100%;height:100%;border-radius:4px" />
              <div style="position:absolute;inset:0;pointer-events:none">
                <div style="position:absolute;top:0;left:0;width:28px;height:28px;border-top:3px solid #2C7BE5;border-left:3px solid #2C7BE5;border-radius:2px 0 0 0"></div>
                <div style="position:absolute;top:0;right:0;width:28px;height:28px;border-top:3px solid #2C7BE5;border-right:3px solid #2C7BE5;border-radius:0 2px 0 0"></div>
                <div style="position:absolute;bottom:0;left:0;width:28px;height:28px;border-bottom:3px solid #2C7BE5;border-left:3px solid #2C7BE5;border-radius:0 0 0 2px"></div>
                <div style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-bottom:3px solid #2C7BE5;border-right:3px solid #2C7BE5;border-radius:0 0 2px 0"></div>
              </div>
            </div>
          </div>
          <p style="font-size:14px;color:#6B7280;text-align:center;max-width:280px">Placez le QR Code de la patiente devant la caméra pour la réception de ses médicaments</p>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Fermer',
      cancelButtonColor: '#E5E7EB',
      showCloseButton: true,
      customClass: {
        title: 'text-lg font-semibold text-left',
        cancelButton: 'text-gray-700 font-medium px-8 py-2.5 rounded-lg',
        popup: 'rounded-2xl'
      }
    });
  }

  acceptDemande(delivery: Delivery): void {
    Swal.fire({
      title: 'Confirmer l\'acceptation',
      text: `Voulez-vous accepter la demande ${delivery.prescription.reference} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4FBFA5',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Oui, accepter',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.acceptedIds.add(delivery.id);
        Swal.fire({
          title: 'Acceptée !',
          text: `La demande ${delivery.prescription.reference} est prête à être récupérée.`,
          icon: 'success',
          confirmButtonColor: '#4FBFA5'
        });
      }
    });
  }

  refuseDemande(delivery: Delivery): void {
    Swal.fire({
      title: 'Confirmation',
      html: `Souhaitez-vous <strong>refuser</strong> cette commande ?`,
      iconHtml: '<div style="width:60px;height:60px;border-radius:50%;border:3px solid #F5A623;display:flex;align-items:center;justify-content:center;font-size:28px;color:#F5A623;font-weight:bold">!</div>',
      customClass: { icon: 'border-0' },
      showCancelButton: true,
      confirmButtonColor: '#F36B6B',
      cancelButtonColor: 'transparent',
      confirmButtonText: 'Oui, refuser',
      cancelButtonText: 'Annuler',
      reverseButtons: false
    }).then(result => {
      if (!result.isConfirmed) return;
      Swal.fire({
        title: 'Motif du rejet',
        html: `
          <div style="text-align:left">
            <label style="font-size:14px;color:#374151;display:block;margin-bottom:8px">Commentaire</label>
            <textarea id="swal-motif" placeholder="Saisir" rows="4"
              style="width:100%;border:1px solid #D1D5DB;border-radius:8px;padding:10px;font-size:14px;resize:none;outline:none"></textarea>
          </div>`,
        showCancelButton: true,
        confirmButtonColor: '#F36B6B',
        cancelButtonColor: 'transparent',
        confirmButtonText: 'Soumettre',
        cancelButtonText: 'Annuler',
        showCloseButton: true,
        preConfirm: () => {
          return (document.getElementById('swal-motif') as HTMLTextAreaElement)?.value || '';
        }
      }).then(motifResult => {
        if (!motifResult.isConfirmed) return;
        Swal.fire({
          title: 'Refus enregistré',
          text: `La demande ${delivery.prescription.reference} a été refusée.`,
          icon: 'success',
          confirmButtonColor: '#4FBFA5'
        });
      });
    });
  }
}