import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { User } from '../../../core/auth.types';
import { Subscription, filter } from 'rxjs';

export interface MenuItem {
  id: string;
  label: string;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  @Output() menuItemClicked = new EventEmitter<string>();

  activeItem = '';
  currentUser: User | null = null;

  isDoctor = false;
  isAdmin = false;
  isPharmacy = false;
  isLab = false;        // LABORATORY
  isImagerie = false;  // IMAGING_CENTER
  isHospital = false;  // HOSPITAL
  isFournisseur = false; // FOURNISSEUR
  isDonor = false;       // DONOR / DONATEUR
  isOrganisation = false; // ORGANISATION


  financeOpen: boolean = false;

  toggleFinanceMenu() {
    this.financeOpen = !this.financeOpen;
    this.activeItem = 'finance-parent';
  }

  // RESPONSIVE
  isMobileMenuOpen = false;
  isDesktop = window.innerWidth >= 1024;

  private userSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private readonly mockCurrentUser: User = {
    id: 1,
    nom: 'Ndiaye',
    prenom: 'Awa',
    email: 'awa.ndiaye@local.test',
    telephone: '+221770000000',
    profil: 'LABORATORY',
    pharmacyId: 1
  } as User;

  // Menus DOCTOR
  doctorMenuItems: MenuItem[] = [
    { id: 'dashboard-med', label: 'Tableau Med', route: '/dashboard-med' },
    { id: 'create-ordonnance', label: 'Créer une ordonnance', route: '/create-ordonnance' },
    { id: 'ordonnances', label: 'Mes ordonnances', route: '/ordonnances' },
    { id: 'patients', label: 'Patients', route: '/patients' },
    { id: 'planings', label: 'Planings', route: '/planings' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus ADMIN
  adminMenuItems: MenuItem[] = [
    { id: 'dashboard-admin', label: 'Tableau Admin', route: '/dashboard-admin' },
    { id: 'medecins', label: 'Gestion des médecins', route: '/medecins' },
    { id: 'pharmacies', label: 'Gestion des pharmacies', route: '/pharmacies' },
    { id: 'livreurs', label: 'Gestion des livreurs', route: '/livreurs' },
    { id: 'patientmanage', label: 'Gestion des patients', route: '/patientmanage' },
    { id: 'paiements-help', label: 'Paiements & Aide', route: '/paiements-help' },
    { id: 'administration', label: 'Administration', route: '/administration' },
    { id: 'finance-parent', label: 'Gestion financière' },
    { id: 'finance-dashboard', label: 'Tableau de bord', route: '/finance-dashboard' },
    { id: 'finance-pharmacies', label: 'Pharmacies', route: '/finance-pharmacies' },
    { id: 'finance-virements', label: 'Demandes de virement', route: '/finance-virements' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus PHARMACIST
  pharmacyMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', route: '/dashboard' },
    { id: 'commande', label: 'Commandes reçues', route: '/commande' },
    { id: 'gestion-stock', label: 'Gestion stock', route: '/gestion-stock' },
    { id: 'demande-complement', label: 'Demande complément', route: '/demande-complement' },
    { id: 'finance-parent', label: 'Gestion financière' },
    { id: 'finance-dashboardpharmacie', label: 'Tableau de bord', route: '/finance-dashboardpharmacie' },
    { id: 'finance-transactions', label: 'Pharmacies', route: '/finance-transactions' },
    { id: 'finance-retraits', label: 'Demandes de retraits', route: '/finance-retraits' },
    { id: 'parametre-bancaire', label: 'parametre-bancaire', route: '/parametre-bancaire' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus LABORATORY
  labMenuItems: MenuItem[] = [
    { id: 'dashboard-lab', label: 'Tableau Lab', route: '/dashboard-lab' },
    { id: 'examens-laboratoire', label: 'Examens', route: '/examens-laboratoire' },
    { id: 'demande-laboratoire', label: 'Demandes', route: '/demande-laboratoire' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus IMAGING_CENTER
  imagerieMenuItems: MenuItem[] = [
    { id: 'dashboard-imagerie', label: 'Tableau de bord', route: '/dashboard-imagerie' },
    { id: 'examens-imagerie', label: 'Examens', route: '/examens-imagerie' },
    { id: 'demande-imagerie', label: 'Demandes', route: '/demande-imagerie' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus HOSPITAL
  hospitalMenuItems: MenuItem[] = [
    { id: 'dashboard-hospital', label: 'Tableau de bord', route: '/dashboard-hospital' },
    { id: 'demandes', label: 'Demandes médicales', route: '/demandes-medicales' },
    { id: 'patients-hospital', label: 'Patients', route: '/patients-hospital' },
    { id: 'hospitalisations', label: 'Hospitalisations', route: '/hospitalisations' },
    { id: 'chirurgie', label: 'Chirurgie', route: '/chirurgie' },
    { id: 'demande-materiels', label: 'Demande de matériels', route: '/demande-materiels' },
    { id: 'paiements-hospital', label: 'Paiements', route: '/paiements-hospital' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus FOURNISSEUR
  fournisseurMenuItems: MenuItem[] = [
    { id: 'dashboard-fournisseur', label: 'Tableau de bord', route: '/dashboard-fournisseur' },
    { id: 'demandes-fournisseur', label: 'Demandes', route: '/demandes-fournisseur' },
    { id: 'devis-fournisseur', label: 'Devis', route: '/devis-fournisseur' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus DONATEUR
  donateurMenuItems: MenuItem[] = [
    { id: 'dons', label: 'Dons', route: '/dons' },
    { id: 'dons-historique', label: 'Historique', route: '/dons-historique' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus ORGANISATION
  organisationMenuItems: MenuItem[] = [
    { id: 'rapport', label: 'Rapport', route: '/rapport' },
    { id: 'budget', label: 'Budget', route: '/budget' },
    { id: 'demande', label: 'Demande', route: '/demande-organisation' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];


  menuItems: MenuItem[] = [];
  // Mode sandbox: on expose tous les groupes pour garder la navigation libre.
  // À rebrancher plus tard si on réintroduit une logique de rôle.
  private readonly allMenuItems: MenuItem[] = [
    ...this.adminMenuItems,
    ...this.doctorMenuItems,
    ...this.pharmacyMenuItems,
    ...this.labMenuItems,
    ...this.imagerieMenuItems,
    ...this.hospitalMenuItems,
    ...this.fournisseurMenuItems,
    ...this.donateurMenuItems,
    ...this.organisationMenuItems
  ];

  constructor(
    private router: Router,
  ) { }

  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth >= 1024;
    if (this.isDesktop) this.isMobileMenuOpen = false;
  }

  ngOnInit(): void {
    this.onResize();

    this.currentUser = this.getMockCurrentUser();
    this.updateMenuBasedOnProfile();
    this.setActiveItemFromCurrentRoute();

    this.routerSubscription = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.setActiveItemFromCurrentRoute());
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private updateMenuBasedOnProfile(): void {
    const profile = this.currentUser?.profil?.toUpperCase() || 'PHARMACIST';

    this.isAdmin = profile === 'ADMIN';
    this.isDoctor = profile === 'DOCTOR' || profile === 'MEDECIN';
    this.isPharmacy = profile === 'PHARMACIST' || profile === 'PHARMACIE';
    this.isLab = profile === 'LABORATORY' || profile === 'LAB' || profile === 'LABORATOIRE';
    this.isImagerie = profile === 'IMAGING_CENTER' || profile === 'IMAGERIE';
    this.isHospital = profile === 'HOSPITAL' || profile === 'HOPITAL';
    this.isFournisseur = profile === 'FOURNISSEUR' || profile === 'SUPPLIER';
    this.isDonor = profile === 'DONOR' || profile === 'DONATEUR';
    this.isOrganisation = profile === 'ORGANISATION' || profile === 'ORGANIZATION';

    if (this.isAdmin) {
      this.menuItems = [...this.adminMenuItems];
    } else if (this.isDoctor) {
      this.menuItems = [...this.doctorMenuItems];
    } else if (this.isPharmacy) {
      this.menuItems = [...this.pharmacyMenuItems];
    } else if (this.isLab) {
      this.menuItems = [...this.labMenuItems];
    } else if (this.isImagerie) {
      this.menuItems = [...this.imagerieMenuItems];
    } else if (this.isHospital) {
      this.menuItems = [...this.hospitalMenuItems];
    } else if (this.isFournisseur) {
      this.menuItems = [...this.fournisseurMenuItems];
    } else if (this.isDonor) {
      this.menuItems = [...this.donateurMenuItems];
    } else if (this.isOrganisation) {
      this.menuItems = [...this.organisationMenuItems];
    } else {
      this.menuItems = [...this.pharmacyMenuItems]; // fallback
    }
  }

  private detectProfileFromUrl(url: string): string | null {
    if (url.startsWith('/dashboard-admin') || 
        url.startsWith('/medecins') || 
        url.startsWith('/pharmacies') || 
        url.startsWith('/livreurs') || 
        url.startsWith('/patientmanage') || 
        url.startsWith('/paiements-help') || 
        url.startsWith('/administration') || 
        url.startsWith('/finance-dashboard') || 
        url.startsWith('/finance-pharmacies') || 
        url.startsWith('/finance-virements')) {
      return 'ADMIN';
    }
    if (url.startsWith('/dashboard-med') || 
        url.startsWith('/create-ordonnance') || 
        url.startsWith('/ordonnances') || 
        url.startsWith('/patients') || 
        url.startsWith('/planings')) {
      if (url.startsWith('/patients-hospital')) return 'HOSPITAL';
      return 'DOCTOR';
    }
    if (url.startsWith('/dashboard-lab') || 
        url.startsWith('/examens-laboratoire') ||
        url.startsWith('/demande-laboratoire') ||
        url.startsWith('/detail-demande-laboratoire') ||
        url.startsWith('/detail-examen-laboratoire')) {
      return 'LABORATORY';
    }
    if (url.startsWith('/dashboard-imagerie') || 
        url.startsWith('/examens-imagerie') ||
        url.startsWith('/detail-examen-imagerie') ||
        url.startsWith('/demande-imagerie') ||
        url.startsWith('/detail-demande-imagerie')) {
      return 'IMAGING_CENTER';
    }
    if (url.startsWith('/organisation') || 
        url.startsWith('/rapport') || 
        url.startsWith('/detail-rapport') || 
        url.startsWith('/budget') || 
        url.startsWith('/demande-organisation')) {
      return 'ORGANISATION';
    }
    // ⚠️ FOURNISSEUR doit être vérifié AVANT HOSPITAL car /demandes matcherait /demandes-fournisseur
    if (url.startsWith('/dashboard-fournisseur') || 
        url.startsWith('/demandes-fournisseur') || 
        url.startsWith('/devis-fournisseur')) {
      return 'FOURNISSEUR';
    }
    if (url.startsWith('/dashboard-hospital') || 
        url.startsWith('/demandes-medicales') || 
        url.startsWith('/patients-hospital') || 
        url.startsWith('/hospitalisations') || 
        url.startsWith('/chirurgie') || 
        url.startsWith('/demande-materiels') || 
        url.startsWith('/paiements-hospital')) {
      return 'HOSPITAL';
    }
    if (url.startsWith('/dons') || 
        url.startsWith('/dons-historique') ||
        url.startsWith('/detail-don')) {
      return 'DONATEUR';
    }
    if (url.startsWith('/dashboard') || 
        url.startsWith('/commande') || 
        url.startsWith('/gestion-stock') || 
        url.startsWith('/demande-complement') || 
        url.startsWith('/finance-dashboardpharmacie') || 
        url.startsWith('/finance-transactions') || 
        url.startsWith('/finance-retraits') || 
        url.startsWith('/parametre-bancaire')) {
      return 'PHARMACIST';
    }
    return null;
  }

  private setActiveItemFromCurrentRoute(): void {
    const url = this.router.url;

    this.currentUser = this.getMockCurrentUser();

    const detectedProfile = this.detectProfileFromUrl(url);
    if (detectedProfile) {
      if (!this.currentUser) {
        this.currentUser = { ...this.mockCurrentUser };
      }
      this.currentUser = { ...this.currentUser, profil: detectedProfile };
    }
    this.updateMenuBasedOnProfile();

    const item = this.menuItems.find(i => i.route && url.startsWith(i.route));

    if (item) {
      this.activeItem = item.id;
      return;
    }

    // Custom mappings for detail pages to highlight their parent sidebar tab
    if (url.startsWith('/detail-don')) {
      this.activeItem = 'dons-historique';
      return;
    }
    if (url.startsWith('/detail-rapport')) {
      this.activeItem = 'rapport';
      return;
    }
    if (url.startsWith('/detail-examen-laboratoire')) {
      this.activeItem = 'examens-laboratoire';
      return;
    }
    if (url.startsWith('/detail-examen-imagerie')) {
      this.activeItem = 'examens-imagerie';
      return;
    }

    if (this.isDoctor) this.activeItem = 'dashboard-med';
    else if (this.isAdmin) this.activeItem = 'dashboard-admin';
    else if (this.isPharmacy) this.activeItem = 'dashboard';
    else if (this.isLab) this.activeItem = 'dashboard-lab';
    else if (this.isImagerie) this.activeItem = 'dashboard-imagerie';
    else if (this.isHospital) this.activeItem = 'dashboard-hospital';
    else if (this.isFournisseur) this.activeItem = 'dashboard-fournisseur';
    else if (this.isOrganisation) this.activeItem = 'organisation';
    else this.activeItem = '';
  }

  private redirectToDefaultDashboard(): void {
    // Pas d'auto-redirection en mode sandbox: on laisse l'utilisateur rester sur sa page courante.
    return;
  }

  private getMockCurrentUser(): User {
    const stored = localStorage.getItem('user_data');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return { ...this.mockCurrentUser };
  }

  selectItem(id: string): void {
    this.activeItem = id;

    if (id === 'finance-parent') {
      this.financeOpen = !this.financeOpen;
      return;
    }

    const item = this.menuItems.find(i => i.id === id);
    if (item?.route) this.router.navigate([item.route]);

    if (!this.isDesktop) this.isMobileMenuOpen = false;
  }

  logout(): void {
    localStorage.clear();
    this.currentUser = null;
    this.router.navigate(['/portail']);
  }
}
