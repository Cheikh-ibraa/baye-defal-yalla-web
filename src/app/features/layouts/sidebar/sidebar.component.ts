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
import { AuthService, User } from '../../../services/auth.service';
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
    { id: 'livraison', label: 'Livraisons', route: '/livraison' },
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
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  // Menus IMAGING_CENTER
  imagerieMenuItems: MenuItem[] = [
    { id: 'dashboard-imagerie', label: 'Tableau de bord', route: '/dashboard-imagerie' },
    { id: 'examens-imagerie', label: 'Examens', route: '/examens-imagerie' },
    { id: 'comptes', label: 'Mon compte', route: '/compte' }
  ];

  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth >= 1024;
    if (this.isDesktop) this.isMobileMenuOpen = false;
  }

  ngOnInit(): void {
    this.onResize();

    this.currentUser = this.authService.getCurrentUser();
    this.updateMenuBasedOnProfile();
    this.setActiveItemFromCurrentRoute();

    // Ne rediriger que si l'utilisateur change (pas au refresh)
    let isFirstLoad = true;

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateMenuBasedOnProfile();

      // Ne rediriger que lors d'un vrai changement d'utilisateur (login)
      // Pas lors d'un refresh où l'utilisateur est juste restauré
      if (!isFirstLoad && user) {
        this.redirectToDefaultDashboard();
      }
      isFirstLoad = false;
    });

    this.routerSubscription = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.setActiveItemFromCurrentRoute());
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private updateMenuBasedOnProfile(): void {
    this.isAdmin = this.currentUser?.profil === 'ADMIN';
    this.isDoctor = this.currentUser?.profil === 'DOCTOR';
    this.isPharmacy = this.currentUser?.profil === 'PHARMACIST';
    this.isLab = this.currentUser?.profil === 'LABORATORY';
    this.isImagerie = this.currentUser?.profil === 'IMAGING_CENTER';

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
    } else {
      this.menuItems = [...this.pharmacyMenuItems];
    }
  }

  private setActiveItemFromCurrentRoute(): void {
    const url = this.router.url;
    const item = this.menuItems.find(i => i.route && url.startsWith(i.route));

    if (item) {
      this.activeItem = item.id;
      return;
    }

    if (this.isDoctor) this.activeItem = 'dashboard-med';
    else if (this.isAdmin) this.activeItem = 'dashboard-admin';
    else if (this.isPharmacy) this.activeItem = 'dashboard';
    else if (this.isLab) this.activeItem = 'dashboard-lab';
    else if (this.isImagerie) this.activeItem = 'dashboard-imagerie';
    else this.activeItem = '';
  }

  private redirectToDefaultDashboard(): void {
    // Ne rediriger que si on est sur la page de login, portail ou racine
    const currentUrl = this.router.url;
    const shouldRedirect = currentUrl === '/' ||
      currentUrl === '/login' ||
      currentUrl === '/portail' ||
      currentUrl === '/register' ||
      currentUrl === '/forgot-password';

    if (!shouldRedirect) {
      return; // L'utilisateur est déjà sur une page valide
    }

    if (this.isDoctor) this.router.navigate(['/dashboard-med']);
    else if (this.isAdmin) this.router.navigate(['/dashboard-admin']);
    else if (this.isPharmacy) this.router.navigate(['/dashboard']);
    else if (this.isLab) this.router.navigate(['/dashboard-lab']);
    else if (this.isImagerie) this.router.navigate(['/dashboard-imagerie']);
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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
