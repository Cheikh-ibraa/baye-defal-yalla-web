import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrdonnanceService, Ordonnance, OrdonnanceResponse } from '../../services/ordonnance.service';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private ordonnanceService: OrdonnanceService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('🏥 OrdonnancesComponent - Initialisation');

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('❌ Aucun utilisateur connecté');
      this.error = true;
      this.errorMessage = 'Vous devez être connecté pour accéder à cette page';
      this.router.navigate(['/login']);
      return;
    }

    if (currentUser.profil !== 'DOCTOR') {
      console.error('❌ Utilisateur n\'est pas un docteur');
      this.error = true;
      this.errorMessage = 'Accès réservé aux docteurs';
      this.router.navigate(['/dashboard']);
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

    this.ordonnanceService.getOrdonnances(this.currentDoctorId, page, this.elementsParPage)
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

    this.ordonnanceService.getOrdonnanceById(ordonnanceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ordonnance: Ordonnance) => {
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
    this.ordonnanceService.getOrdonnancesByStatus(this.currentDoctorId, status, 0, this.elementsParPage)
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
    return this.ordonnanceService.getStatusLabel(statut);
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