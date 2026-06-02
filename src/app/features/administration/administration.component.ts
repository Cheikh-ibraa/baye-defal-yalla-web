import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Utilisateur {
  id: string;
  nom: string;
  estGele: boolean;
  initiales: string;
  email: string;
  profil: string;
  derniereConnexion: string;
  couleurAvatar: string;
}

interface Alerte {
  id: number;
  type: 'error' | 'success' | 'warning';
  titre: string;
  message: string;
  date: string;
}

interface ActionHistorique {
  id: number;
  admin: string;
  action: string;
  cible: string;
  date: string;
}

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css']
})
export class AdministrationComponent {
  // Statistiques
  rolesActifs = 8;
  totalActions = 342;
  alertesActives = 4;
  derniereSauvegarde = 'Il y a 2h';

  // Recherche
  rechercheUtilisateur = '';

  // Utilisateurs
  utilisateurs: Utilisateur[] = [
    {
      id: 'MD',
      nom: 'Dr. Moussa Wade',
      estGele: false,
      initiales: 'MD',
      email: 'moussawade@gmail.com',
      profil: 'Médecin',
      derniereConnexion: '2025-01-15',
      couleurAvatar: 'bg-blue-500 text-white'
    },
    {
      id: 'MF',
      nom: 'Maman Fall',
      estGele: true,
      initiales: 'MF',
      email: 'mamanfall@gmail.com',
      profil: 'Utilisateur',
      derniereConnexion: '2025-01-15',
      couleurAvatar: 'bg-pink-500 text-white'
    },
    {
      id: 'PC',
      nom: 'Pharmacie Centrale',
      estGele: false,
      initiales: 'PC',
      email: 'contact@pharma-centrale.com',
      profil: 'Pharmacie',
      derniereConnexion: '2025-01-15',
      couleurAvatar: 'bg-green-500 text-white'
    },
    {
      id: 'FF',
      nom: 'Fatou Fall',
      estGele: false,
      initiales: 'FF',
      email: 'fatoufall@gmail.com',
      profil: 'Patient',
      derniereConnexion: '2025-01-15',
      couleurAvatar: 'bg-purple-500 text-white'
    },
    {
      id: 'AS',
      nom: 'Admin Support',
      estGele: false,
      initiales: 'AS',
      email: 'support@pod.com',
      profil: 'Admin',
      derniereConnexion: '2025-01-15',
      couleurAvatar: 'bg-yellow-500 text-white'
    }
  ];

  utilisateursFiltres: Utilisateur[] = [...this.utilisateurs];

  // Alertes
  alertes: Alerte[] = [
    {
      id: 1,
      type: 'error',
      titre: 'Connexion suspecte',
      message: 'Pharmacie du Nord',
      date: 'Il y a 1 heure'
    },
    {
      id: 2,
      type: 'error',
      titre: 'Erreur de paiement',
      message: 'Transaction #4521',
      date: 'Il y a 1 heure'
    },
    {
      id: 3,
      type: 'success',
      titre: 'Sauvegarde automatique complétée',
      message: '1.2GB sauvés avec succès',
      date: 'Il y a 2 jours'
    },
    {
      id: 4,
      type: 'success',
      titre: 'Sauvegarde automatique complétée',
      message: '1.2GB sauvés avec succès',
      date: 'Il y a 2 jours'
    }
  ];

  // Historique des actions
  historiqueActions: ActionHistorique[] = [
    {
      id: 1,
      admin: 'Admin Principal',
      action: 'Modification du rôle',
      cible: 'Dr. Diop',
      date: '2025-01-15 14:30'
    },
    {
      id: 2,
      admin: 'Admin Support',
      action: 'Blocage utilisateur',
      cible: 'Lunise #2',
      date: '2025-01-13 13:15'
    },
    {
      id: 3,
      admin: 'Admin Principal',
      action: 'Création compte',
      cible: 'Pharmacie',
      date: '2025-01-15 11:45'
    },
    {
      id: 4,
      admin: 'Admin Support',
      action: 'Modification données',
      cible: 'Patient #11',
      date: '2025-01-15 10:20'
    },
    {
      id: 5,
      admin: 'Admin Principal',
      action: 'Connexion système',
      cible: 'Dashboard',
      date: '2025-01-15 09:00'
    }
  ];

  rechercherUtilisateur(): void {
    if (!this.rechercheUtilisateur.trim()) {
      this.utilisateursFiltres = [...this.utilisateurs];
      return;
    }

    const recherche = this.rechercheUtilisateur.toLowerCase();
    this.utilisateursFiltres = this.utilisateurs.filter(u =>
      u.nom.toLowerCase().includes(recherche) ||
      u.email.toLowerCase().includes(recherche) ||
      u.profil.toLowerCase().includes(recherche)
    );
  }

  supprimerUtilisateur(utilisateur: Utilisateur): void {
    if (confirm(`Voulez-vous vraiment supprimer ${utilisateur.nom} ?`)) {
      this.utilisateurs = this.utilisateurs.filter(u => u.id !== utilisateur.id);
      this.rechercherUtilisateur();
    }
  }
  gelerOuDegelerUtilisateur(utilisateur: Utilisateur): void {
    const action = utilisateur.estGele ? 'Dégeler' : 'Geler';

    if (confirm(`Voulez-vous vraiment ${action} ${utilisateur.nom} ?`)) {
      utilisateur.estGele = !utilisateur.estGele;  // on inverse l’état

      // Si tu veux rafraîchir une recherche existante
      this.rechercherUtilisateur?.();
    }
  }

  modifierUtilisateur(utilisateur: Utilisateur): void {
    console.log('Modifier utilisateur:', utilisateur);
    // Implémentez votre logique de modification ici
  }

  getAlerteIcone(type: string): string {
    switch (type) {
      case 'error':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return '';
    }
  }

  getAlerteCouleur(type: string): string {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }

  afficherTousStatuts(): void {
    console.log('Afficher tous les statuts');
  }
}