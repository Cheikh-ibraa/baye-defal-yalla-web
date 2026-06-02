import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

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

  // Breadcrumb data
  breadcrumbs = [
    { label: 'Tableau de bord', link: '/dashboard', active: false },
    { label: 'État du Patrimoine Immobilier', link: null, active: true }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {

    // Vérifier que le service est bien injecté
    if (!this.authService) {
      return;
    }

    // S'abonner aux changements de l'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
        this.updateUserDisplay();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    });

    // Récupérer l'utilisateur actuel immédiatement
    this.currentUser = this.authService.getCurrentUser();

    // Si l'utilisateur existe mais que les données sont incomplètes, les charger
    if (this.currentUser && this.currentUser.id && (!this.currentUser.nom || !this.currentUser.prenom)) {
      this.loadUserProfile();
    } else {
      this.updateUserDisplay();
    }
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


    this.authService.getCurrentUserById(this.currentUser.id).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.updateUserDisplay();
      },
      error: (error) => {
        // Utiliser les données du token si disponibles
        this.updateUserDisplay();
      }
    });
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
  const roleMap: { [key: string]: string } = {
    ADMIN: 'Administrateur',
    DOCTOR: 'Médecin',
    PHARMACIST: 'Pharmacien',
    PATIENT: 'Patient',
    REPRESENTATIVE: 'Représentant',
    DONOR: 'Donateur',
    DELIVERY_PERSON: 'Livreur',
    IMAGING_CENTER: 'Centre d’imagerie',
    LABORATORY: 'Laboratoire',
    EMERGENCY: 'Service d’urgence'
  };

  return roleMap[profil] || 'Utilisateur';
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

    if (!this.authService) {
      console.error('ERREUR: AuthService non disponible pour logout');
      localStorage.clear();
      this.router.navigate(['/login']);
      return;
    }

    try {
      // Déconnexion via le service
      this.authService.logout();

      // Redirection vers la page de connexion
      this.router.navigate(['/login']);

      // Fermer tous les menus
      this.closeMenus();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer la déconnexion
      localStorage.clear();
      this.router.navigate(['/login']);
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.authService?.isLoggedIn() || false;
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
    PHARMACIST: 'Pharmacien',
    PATIENT: 'Patient',
    REPRESENTATIVE: 'Représentant',
    DONOR: 'Donneur',
    DELIVERY_PERSON: 'Livreur',
    IMAGING_CENTER: 'Centre d’Imagerie',
    LABORATORY: 'Laboratoire',
    EMERGENCY: 'Urgence'
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

}
