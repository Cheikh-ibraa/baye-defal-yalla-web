import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, delay } from 'rxjs/operators';
// Inlined Ordonnance types from ordonnance.service
interface Medication {
  id?: number;
  name: string;
  quantity: number;
  dosage: string;
  price: number;
}

interface Person {
  id: number;
  nom: string;
  prenom: string;
}

interface Pharmacist {
  id: number;
  nom: string;
  prenom: string;
}

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  logo: string;
  hourly: string | null;
  pharmacist: Pharmacist;
}

interface Ordonnance {
  id: number;
  reference: string;
  doctor: Person;
  patient: Person;
  createdAt: string;
  status: string;
  qrCodeUrl: string;
  fullyPaidByDonor: boolean;
  partiallyPaidByDonor: boolean;
  pharmacy: Pharmacy;
  amount: number;
  needsHelp: boolean;
  address: string;
  latitude: number;
  longitude: number;
  prescriptionFile: string | null;
  medications: Medication[];
}

interface PageableSort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageableSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

interface OrdonnanceResponse {
  content: Ordonnance[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: PageableSort;
  first: boolean;
  empty: boolean;
}
// AuthFacade removed — using local mock user for static frontend

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-ordonnances',
  templateUrl: './ordonnances.component.html',
  styleUrls: ['./ordonnances.component.css']
})
export class OrdonnancesComponent implements OnInit, OnDestroy {
  // Données
  ordonnances: Ordonnance[] = [];
  ordonnanceSelectionnee: Ordonnance | null = null;
  ordonnanceDetails: Ordonnance | null = null; // Détails complets de l'ordonnance
  currentDoctorId: number = 0;

  // Recherche et filtres
  rechercheTexte: string = '';
  filtreStatut: string = 'Tous les statuts';
  menuStatutOuvert: boolean = false;

  // Pagination (côté serveur)
  pageActuelle: number = 0;
  elementsParPage: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;
  isLastPage: boolean = false;
  isFirstPage: boolean = true;

  // États
  loading: boolean = false;
  loadingDetails: boolean = false;
  error: boolean = false;
  errorMessage: string = '';

  // Liste des statuts disponibles
  statutsDisponibles = [
    'Tous les statuts',
    'En attente',
    'Acceptée',
    'Rejetée',
    'En préparation',
    'Prête',
    'Livrée'
  ];

  private destroy$ = new Subject<void>();

  // Mock local data to run the frontend statically (sandbox)
  private mockOrdonnances: Ordonnance[] = [
    {
      id: 1,
      reference: 'ORD-0001',
      doctor: { id: 10, nom: 'Dupont', prenom: 'Jean' },
      patient: { id: 100, nom: 'Martin', prenom: 'Alice' },
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      qrCodeUrl: null as any,
      fullyPaidByDonor: false,
      partiallyPaidByDonor: false,
      pharmacy: {
        id: 1,
        name: 'Pharmacie Centrale',
        address: '1 Rue Principale',
        phone: '000000000',
        email: 'pharmacie@example.com',
        latitude: 0,
        longitude: 0,
        logo: '',
        hourly: null,
        pharmacist: { id: 1, nom: 'Pharm', prenom: 'Admin' }
      },
      amount: 0,
      needsHelp: false,
      address: '1 Rue Principale',
      latitude: 0,
      longitude: 0,
      prescriptionFile: null,
      medications: [
        { id: 1, name: 'Paracétamol', quantity: 2, dosage: '500mg', price: 2.5 }
      ]
    }
  ];

  // Local helpers that simulate service calls with a small delay
  private localGetOrdonnances(doctorId: number, page: number = 0, size: number = 10) {
    const start = page * size;
    const content = this.mockOrdonnances.slice(start, start + size);
    const response: OrdonnanceResponse = {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { unsorted: true, sorted: false, empty: true },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalPages: Math.ceil(this.mockOrdonnances.length / size),
      totalElements: this.mockOrdonnances.length,
      last: start + content.length >= this.mockOrdonnances.length,
      numberOfElements: content.length,
      size,
      number: page,
      sort: { unsorted: true, sorted: false, empty: true },
      first: page === 0,
      empty: content.length === 0
    };

    return of(response).pipe(delay(250));
  }

  private localGetOrdonnancesByStatus(doctorId: number, status: string, page: number = 0, size: number = 10) {
    const filtered = this.mockOrdonnances.filter(o => o.status === status);
    const start = page * size;
    const content = filtered.slice(start, start + size);
    const response: OrdonnanceResponse = {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { unsorted: true, sorted: false, empty: true },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalPages: Math.ceil(filtered.length / size),
      totalElements: filtered.length,
      last: start + content.length >= filtered.length,
      numberOfElements: content.length,
      size,
      number: page,
      sort: { unsorted: true, sorted: false, empty: true },
      first: page === 0,
      empty: content.length === 0
    };

    return of(response).pipe(delay(200));
  }

  private localGetOrdonnanceById(id: number) {
    const found = this.mockOrdonnances.find(o => o.id === id) || null;
    return of(found).pipe(delay(150));
  }

  private localGetStatusLabel(statut: string): string {
    const mapping: { [key: string]: string } = {
      'PENDING': 'En attente',
      'ACCEPTED': 'Acceptée',
      'REJECTED': 'Rejetée',
      'IN_PREPARATION': 'En préparation',
      'READY': 'Prête',
      'DELIVERED': 'Livrée'
    };
    return mapping[statut] || statut;
  }

  constructor(
    private router: Router
  ) { }

  // Local mock current user (replaces AuthFacade)
  private getMockCurrentUser() {
    return { id: 10, nom: 'Dupont', prenom: 'Jean' } as { id: number; nom?: string; prenom?: string };
  }

  ngOnInit(): void {
    console.log('🏥 OrdonnancesComponent - Initialisation');

    const currentUser = this.getMockCurrentUser();

    if (!currentUser) {
      console.error('❌ Aucun utilisateur connecté');
      this.error = true;
      this.errorMessage = 'Vous devez être connecté pour accéder à cette page';
      return;
    }

    if (!currentUser.id) {
      console.error('❌ ID utilisateur manquant');
      this.error = true;
      this.errorMessage = 'Erreur lors de la récupération de vos informations';
      return;
    }

    this.currentDoctorId = currentUser.id;
    console.log('👨‍⚕️ ID Docteur:', this.currentDoctorId);

    this.loadOrdonnances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
 * Calcule le montant total d'une ordonnance
 */
  getTotalAmount(ordonnance: Ordonnance): number {
    if (!ordonnance.medications) return 0;
    return ordonnance.medications.reduce((total, med) =>
      total + (med.price * med.quantity), 0
    );
  }

  loadOrdonnances(page: number = 0): void {
    this.loading = true;
    this.error = false;
    this.pageActuelle = page;

    console.log('📥 Chargement des ordonnances - Page:', page, '| Taille:', this.elementsParPage);

    this.localGetOrdonnances(this.currentDoctorId, page, this.elementsParPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: OrdonnanceResponse) => {
          console.log('✅ Ordonnances chargées:', response.content.length);

          this.ordonnances = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.isLastPage = response.last;
          this.isFirstPage = response.first;
          this.loading = false;

          // Sélectionner automatiquement la première ordonnance
          if (this.ordonnances.length > 0 && !this.ordonnanceSelectionnee) {
            this.selectionnerOrdonnance(this.ordonnances[0]);
          }
        },
        error: (error: string) => {
          console.error('❌ Erreur lors du chargement:', error);
          this.error = true;
          this.errorMessage = error;
          this.loading = false;
        }
      });
  }

  selectionnerOrdonnance(ordonnance: Ordonnance): void {
    console.log('📋 Ordonnance sélectionnée:', ordonnance.reference);
    this.ordonnanceSelectionnee = ordonnance;

    // Charger les détails complets
    this.loadOrdonnanceDetails(ordonnance.id);
  }

  loadOrdonnanceDetails(ordonnanceId: number): void {
    this.loadingDetails = true;
    console.log('📥 Chargement des détails de l\'ordonnance:', ordonnanceId);

    this.localGetOrdonnanceById(ordonnanceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ordonnance: Ordonnance | null) => {
          console.log('✅ Détails chargés:', ordonnance);
          this.ordonnanceDetails = ordonnance;
          this.loadingDetails = false;
        },
        error: (error: string) => {
          console.error('❌ Erreur lors du chargement des détails:', error);
          this.loadingDetails = false;
        }
      });
  }

  rechercher(texte: string): void {
    this.rechercheTexte = texte;
    console.log('🔍 Recherche:', texte);
  }

  changerFiltreStatut(statut: string): void {
    this.filtreStatut = statut;
    this.menuStatutOuvert = false;
    console.log('🔍 Filtre statut:', statut);

    if (statut === 'Tous les statuts') {
      this.loadOrdonnances(0);
    } else {
      const statusMapping: { [key: string]: string } = {
        'En attente': 'PENDING',
        'Acceptée': 'ACCEPTED',
        'Rejetée': 'REJECTED',
        'En préparation': 'IN_PREPARATION',
        'Prête': 'READY',
        'Livrée': 'DELIVERED'
      };

      const apiStatus = statusMapping[statut];
      if (apiStatus) {
        this.filterByStatus(apiStatus);
      }
    }
  }

  private filterByStatus(status: string): void {
    this.loading = true;
    this.localGetOrdonnancesByStatus(this.currentDoctorId, status, 0, this.elementsParPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ordonnances = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.loading = false;

          // Sélectionner la première si disponible
          if (this.ordonnances.length > 0) {
            this.selectionnerOrdonnance(this.ordonnances[0]);
          } else {
            this.ordonnanceSelectionnee = null;
            this.ordonnanceDetails = null;
          }
        },
        error: (error) => {
          this.error = true;
          this.errorMessage = error;
          this.loading = false;
        }
      });
  }

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'bg-amber-100 text-amber-700',
      'ACCEPTED': 'bg-emerald-100 text-emerald-700',
      'REJECTED': 'bg-rose-100 text-rose-700',
      'IN_PREPARATION': 'bg-blue-100 text-blue-700',
      'READY': 'bg-indigo-100 text-indigo-700',
      'DELIVERED': 'bg-teal-100 text-teal-700'
    };
    return classes[statut] || 'bg-gray-100 text-gray-700';
  }

  getStatutLabel(statut: string): string {
    return this.localGetStatusLabel(statut);
  }

  changerElementsParPage(nombre: number): void {
    console.log('📄 Changement nombre d\'éléments par page:', nombre);
    this.elementsParPage = nombre;
    this.loadOrdonnances(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadOrdonnances(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 0) {
      this.goToPage(this.pageActuelle - 1);
    }
  }

  pageSuivante(): void {
    if (!this.isLastPage) {
      this.goToPage(this.pageActuelle + 1);
    }
  }

  get ordonnancesFiltrees(): Ordonnance[] {
    if (!this.rechercheTexte) {
      return this.ordonnances;
    }

    const texte = this.rechercheTexte.toLowerCase();
    return this.ordonnances.filter(ord => {
      const patientNom = `${ord.patient.prenom} ${ord.patient.nom}`.toLowerCase();
      const pharmacieNom = ord.pharmacy?.name?.toLowerCase() || '';

      return ord.reference.toLowerCase().includes(texte) ||
        patientNom.includes(texte) ||
        pharmacieNom.includes(texte);
    });
  }

  get infosPagination(): string {
    const debut = this.pageActuelle * this.elementsParPage + 1;
    const fin = Math.min((this.pageActuelle + 1) * this.elementsParPage, this.totalElements);
    return `${debut} - ${fin} sur ${this.totalElements}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Calcule l'âge du patient
   */
  getPatientAge(patient: any): number | null {
    if (!patient.dateOfBirth) return null;

    try {
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch (error) {
      return null;
    }
  }

  creerNouvelleOrdonnance(): void {
    console.log('➕ Navigation vers création ordonnance');
    this.router.navigate(['/create-ordonnance']);
  }

  retry(): void {
    console.log('🔄 Nouvelle tentative de chargement');
    this.error = false;
    this.errorMessage = '';
    this.loadOrdonnances(this.pageActuelle);
  }

  getPatientName(ordonnance: Ordonnance): string {
    return `${ordonnance.patient.prenom} ${ordonnance.patient.nom}`;
  }

  getPharmacyName(ordonnance: Ordonnance): string {
    return ordonnance.pharmacy?.name || '—';
  }

  /**
   * Génère l'URL d'image du QR code à partir du qrCodeUrl encodé
   */
  getQrCodeImageUrl(qrCodeUrl: string | null | undefined): string {
    if (!qrCodeUrl) {
      return '';
    }

    const encodedData = encodeURIComponent(qrCodeUrl.trim());
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodedData}`;
  }

  /**
   * Exporte en PDF (placeholder)
   */
  exportPDF(): void {
    console.log('📄 Export PDF');
    // TODO: Implémenter l'export PDF
  }

  /**
   * Envoie l'ordonnance au patient (placeholder)
   */
  sendToPatient(): void {
    console.log('📧 Envoi au patient');
    // TODO: Implémenter l'envoi au patient
  }
}