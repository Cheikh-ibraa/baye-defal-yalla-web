import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { User } from '../../../core/auth.types';
import { Subscription, filter } from 'rxjs';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Menu states
  isUserMenuOpen = false;
  isMobileMenuOpen = false;
  isDropdownOpen = false;
  selectedTheme = 'Clair';

  // User information (sera mis à jour dynamiquement)
  currentUser: User | null = null;
  userDisplayName: string = '';
  userRole: string = '';
  userAvatar: string = '';

  // Subscription pour l'utilisateur
  private userSubscription?: Subscription;
  private readonly mockCurrentUser: User = {
    id: 1,
    nom: 'Ndiaye',
    prenom: 'Awa',
    email: 'awa.ndiaye@local.test',
    telephone: '+221770000000',
    profil: 'PHARMACIST',
    pharmacyId: 1
  } as User;

  // Breadcrumb data
  breadcrumbs = [
    { label: 'Tableau de bord', link: '/dashboard', active: false },
    { label: 'État du Patrimoine Immobilier', link: null, active: true }
  ];

  constructor(
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.getMockCurrentUser();
    this.updateUserDisplay();

    this.userSubscription = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUser = this.getMockCurrentUser();
        const url = this.router.url;
        const detectedProfile = this.detectProfileFromUrl(url);
        if (detectedProfile && this.currentUser) {
          this.currentUser.profil = detectedProfile;
        }
        this.updateUserDisplay();
      });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Charge le profil complet de l'utilisateur depuis l'API
   */
  private loadUserProfile(): void {
    if (!this.currentUser?.id) {
      return;
    }

    this.currentUser = this.getMockCurrentUser();
    this.updateUserDisplay();
  }

  /**
   * Met à jour l'affichage des informations utilisateur
   */
  private updateUserDisplay(): void {
    if (this.currentUser) {
      // Construire le nom complet
      const prenom = this.currentUser.prenom || '';
      const nom = this.currentUser.nom || '';

      if (prenom && nom) {
        this.userDisplayName = `${prenom} ${nom}`;
      } else if (prenom) {
        this.userDisplayName = prenom;
      } else if (nom) {
        this.userDisplayName = nom;
      } else if (this.currentUser.email) {
        this.userDisplayName = this.currentUser.email;
      } else if (this.currentUser.telephone) {
        this.userDisplayName = this.currentUser.telephone;
      } else {
        this.userDisplayName = 'Utilisateur';
      }

      // Déterminer le rôle à afficher
      this.userRole = this.getRoleDisplayName(this.currentUser.profil);


    } else {
      this.userDisplayName = 'Utilisateur';
      this.userRole = 'Invité';
    }
  }

  /**
   * Convertit le code du profil en nom lisible
   */
  private getRoleDisplayName(profil: string): string {
    if (!profil) return 'Utilisateur';
    const cleanProfil = profil.toUpperCase();
    const roleMap: { [key: string]: string } = {
      ADMIN: 'Administrateur',
      DOCTOR: 'Médecin',
      MEDECIN: 'Médecin',
      PHARMACIST: 'Pharmacien',
      PHARMACIE: 'Pharmacien',
      PATIENT: 'Patient',
      REPRESENTATIVE: 'Représentant',
      DONOR: 'Donateur',
      DONATEUR: 'Donateur',
      DELIVERY_PERSON: 'Livreur',
      LIVREUR: 'Livreur',
      IMAGING_CENTER: 'Centre d’imagerie',
      IMAGERIE: 'Centre d’imagerie',
      LABORATORY: 'Laboratoire',
      LAB: 'Laboratoire',
      LABORATOIRE: 'Laboratoire',
      HOSPITAL: 'Hôpital',
      HOPITAL: 'Hôpital',
      EMERGENCY: 'Service d’urgence',
      FOURNISSEUR: 'Fournisseur',
      SUPPLIER: 'Fournisseur'
    };

    return roleMap[cleanProfil] || profil;
  }


  /**
   * Retourne les initiales de l'utilisateur pour l'avatar
   */
  getUserInitials(): string {
    if (!this.currentUser) return 'U';

    const prenom = this.currentUser.prenom || '';
    const nom = this.currentUser.nom || '';

    if (prenom && nom) {
      return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    } else if (prenom) {
      return prenom.substring(0, 2).toUpperCase();
    } else if (nom) {
      return nom.substring(0, 2).toUpperCase();
    } else if (this.currentUser.email) {
      return this.currentUser.email.substring(0, 2).toUpperCase();
    }

    return 'U';
  }

  // ===== GESTION DES MENUS =====

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectTheme(theme: string) {
    this.selectedTheme = theme;
    this.isDropdownOpen = false;
    // TODO: Implémenter la logique pour appliquer le thème
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenus() {
    this.isUserMenuOpen = false;
    this.isMobileMenuOpen = false;
    this.isDropdownOpen = false;
  }

  // Fermer les dropdowns quand on clique ailleurs
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    // Fermer le dropdown de thème si on clique ailleurs
    if (!target.closest('.theme-dropdown')) {
      this.isDropdownOpen = false;
    }

    // Fermer le menu utilisateur si on clique ailleurs
    if (!target.closest('.user-menu-container')) {
      this.isUserMenuOpen = false;
    }
  }

  // ===== NAVIGATION =====

  navigateTo(link: string | null) {
    if (link) {
      this.router.navigate([link]);
      this.closeMenus();
    }
  }

  // ===== ACTIONS UTILISATEUR =====

  onNotificationClick() {
    // TODO: Implémenter la logique des notifications
  }

  onThemeToggle() {
    // TODO: Implémenter le changement de thème
  }

  onProfileClick() {
    this.router.navigate(['/compte']);
    this.closeMenus();
  }

  onLogout() {
    localStorage.clear();
    this.currentUser = null;
    this.updateUserDisplay();
    this.router.navigate(['/portail']);
    this.closeMenus();
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    return this.currentUser?.profil === role;
  }

  /**
   * Retourne le nombre de notifications (à implémenter)
   */
  getNotificationCount(): number {
    // TODO: Implémenter la récupération du nombre de notifications
    return 0;
  }

  formatName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

formatRole(role: string | null | undefined): string {
  if (!role) return '';

  const rolesMap: Record<string, string> = {
    ADMIN: 'Administrateur',
    DOCTOR: 'Médecin',
    MEDECIN: 'Médecin',
    PHARMACIST: 'Pharmacien',
    PHARMACIE: 'Pharmacien',
    PATIENT: 'Patient',
    REPRESENTATIVE: 'Représentant',
    DONOR: 'Donneur',
    DELIVERY_PERSON: 'Livreur',
    IMAGING_CENTER: 'Centre d’Imagerie',
    IMAGERIE: 'Centre d’Imagerie',
    LABORATORY: 'Laboratoire',
    LAB: 'Laboratoire',
    LABORATOIRE: 'Laboratoire',
    HOSPITAL: 'Hôpital',
    HOPITAL: 'Hôpital',
    EMERGENCY: 'Urgence',
    FOURNISSEUR: 'Fournisseur',
    SUPPLIER: 'Fournisseur'
  };

  return rolesMap[role.toUpperCase()] || this.capitalizeWords(role);
}

private capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
        url.startsWith('/examens-laboratoire')) {
      return 'LABORATORY';
    }
    if (url.startsWith('/dashboard-imagerie') || 
        url.startsWith('/examens-imagerie')) {
      return 'IMAGING_CENTER';
    }
    // ⚠️ FOURNISSEUR must be checked BEFORE HOSPITAL to avoid /demandes matching /demandes-fournisseur
    if (url.startsWith('/dashboard-fournisseur') || 
        url.startsWith('/demandes-fournisseur') || 
        url.startsWith('/devis-fournisseur')) {
      return 'FOURNISSEUR';
    }
    if (url.startsWith('/dashboard-hospital') || 
        url.startsWith('/demandes') || 
        url.startsWith('/patients-hospital') || 
        url.startsWith('/hospitalisations') || 
        url.startsWith('/chirurgie') || 
        url.startsWith('/demande-materiels') || 
        url.startsWith('/paiements-hospital')) {
      return 'HOSPITAL';
    }
    if (url.startsWith('/dashboard') || 
        url.startsWith('/commande') || 
        url.startsWith('/gestion-stock') || 
        url.startsWith('/livraison') || 
        url.startsWith('/finance-dashboardpharmacie') || 
        url.startsWith('/finance-transactions') || 
        url.startsWith('/finance-retraits') || 
        url.startsWith('/parametre-bancaire')) {
      return 'PHARMACIST';
    }
    return null;
  }
}
