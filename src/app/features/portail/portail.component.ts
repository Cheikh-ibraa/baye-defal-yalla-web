import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';


interface UserProfile {
  id: string;
  icon: string;
  name: string;
  description: string;
  imagePath: string;
  features: string[];
  gradientFrom: string;
  gradientTo: string;
  hoverColor: string;
}



interface FeatureCard {
  icon: 'prescription' | 'tracking' | 'payment' | 'search' | 'notifications' | 'dashboard';
  title: string;
  description: string;
}


@Component({
  selector: 'app-portail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portail.component.html',
  styleUrls: ['./portail.component.css']
})
export class PortailComponent implements OnInit {
  selectedProfile: UserProfile;

  // API data

  profiles: UserProfile[] = [
    {
      id: 'patient',
      icon: 'patient',
      name: 'Patient',
      description:
        'Envoyez votre ordonnance, comparez les pharmacies proches, suivez votre livraison et payez en toute sécurité.',
      imagePath: 'assets/images/patient.png',
      features: [
        'Commandes rapides',
        'Suivi des traitements',
        'Rappels de médicaments',
        'Historique médical'
      ],
      gradientFrom: 'from-green-50',
      gradientTo: 'to-white',
      hoverColor: 'text-cyan-600'
    },
    {
      id: 'medecin',
      icon: 'medecin',
      name: 'Médecin',
      description:
        'Prescrivez des ordonnances numériques, suivez vos patients et accédez à leur historique médical en temps réel.',
      imagePath: 'assets/images/medecin.png',
      features: [
        'Prescriptions électroniques',
        'Suivi des patients',
        'Historique médical centralisé',
        'Téléconsultation'
      ],
      gradientFrom: 'from-blue-50',
      gradientTo: 'to-white',
      hoverColor: 'text-blue-600'
    },
    {
      id: 'pharmacien',
      icon: 'pharmacien',
      name: 'Pharmacien',
      description:
        'Recevez et traitez les ordonnances, gérez votre stock et communiquez avec les patients et médecins.',
      imagePath: 'assets/images/pharmacien.png',
      features: [
        'Gestion des ordonnances',
        'Gestion du stock',
        'Notification en temps réel',
        'Statistiques de vente'
      ],
      gradientFrom: 'from-teal-50',
      gradientTo: 'to-white',
      hoverColor: 'text-teal-600'
    },
    {
      id: 'livreur',
      icon: 'livreur',
      name: 'Livreur',
      description:
        'Recevez les commandes, optimisez vos itinéraires et assurez une livraison rapide et sécurisée.',
      imagePath: 'assets/images/Livreur.png',
      features: [
        'Gestion des livraisons',
        'Itinéraires optimisés',
        'Suivi en temps réel',
        'Historique des courses'
      ],
      gradientFrom: 'from-indigo-50',
      gradientTo: 'to-white',
      hoverColor: 'text-indigo-600'
    },
    {
      id: 'donateur',
      icon: 'donateur',
      name: 'Donateur',
      description:
        "Soutenez des patients dans le besoin, suivez l'impact de vos dons et participez à des campagnes solidaires.",
      imagePath: 'assets/images/Donateur.png',
      features: [
        'Dons sécurisés',
        "Suivi de l'impact",
        'Campagnes solidaires',
        'Transparence totale'
      ],
      gradientFrom: 'from-pink-50',
      gradientTo: 'to-white',
      hoverColor: 'text-pink-600'
    }
  ];

  features = [
    {
      icon: 'check',
      title: 'Commande simplifiée',
      description: 'Validation rapide et intuitive des ordonnances'
    },
    {
      icon: 'check',
      title: 'Livraison rapide',
      description: 'Recevez vos médicaments où que vous soyez en temps record'
    },
    {
      icon: 'check',
      title: 'Suivi en temps réel',
      description: 'Suivez votre commande de la pharmacie jusqu’à votre porte'
    },
    {
      icon: 'check',
      title: 'Assistance client',
      description: 'Un support dédié pour toutes vos questions'
    }
  ];

  featureCards: FeatureCard[] = [
    {
      icon: 'prescription',
      title: 'Gestion d\'ordonnances',
      description: 'Scan, upload et validation par la pharmacie en quelques minutes.'
    },
    {
      icon: 'tracking',
      title: 'Espace de dons',
      description: 'Gestion des besoins, des dons et mise en relation en temps réel.'
    },
    {
      icon: 'payment',
      title: 'Paiement sécurisé',
      description: 'Cartes et wallet, reçus automatiques et historique liste.'
    },
    {
      icon: 'search',
      title: 'Suivi en temps réel',
      description: 'Tracking précis de la préparation au dernier kilomètre.'
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      description: 'Alerte de validation, départ livreur et arrivée prévue.'
    },
    {
      icon: 'dashboard',
      title: 'Tableau de bord',
      description: 'Indicateurs clés : délais, satisfaction, chiffre généré.'
    }
  ];

  // Données des dons

  // Détail API


  constructor(private router: Router) {
    this.selectedProfile = this.profiles[0];
  }

  ngOnInit(): void {
  }


  /** 🔹 Sélection d’un profil (Patient, Médecin, etc.) */
  selectProfile(profile: UserProfile): void {
    this.selectedProfile = profile;
  }

  /** 🔹 Vérifie si un profil est sélectionné */
  isSelected(profileId: string): boolean {
    return this.selectedProfile.id === profileId;
  }

  /** 🔹 Redirige vers la page de connexion */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  scrollToSection(sectionId: string, event?: Event): void {
    event?.preventDefault();

    if (typeof document === 'undefined') {
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    const header = document.querySelector('header');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const offset = 12;
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - offset;

    window.scrollTo({
      top: Math.max(targetPosition, 0),
      behavior: 'smooth'
    });

    if (typeof history !== 'undefined') {
      history.replaceState(null, '', `#${sectionId}`);
    }
  }



  /** 🔹 Aller vers la page Dons */
  goToDons(): void {
    this.router.navigate(['/dons']);
  }

  /** 🔹 Génère un tableau pour afficher les étoiles */
  getStars(count: number = 5): number[] {
    return Array.from({ length: count }, (_, index) => index);
  }

  /** 🔹 Défilement des témoignages vers la gauche */
  scrollTestimonialsLeft(): void {
    if (typeof document !== 'undefined') {
      const container = document.getElementById('testimonialsCarousel');
      if (container) {
        container.scrollBy({ left: -300, behavior: 'smooth' });
      }
    }
  }

  /** 🔹 Défilement des témoignages vers la droite */
  scrollTestimonialsRight(): void {
    if (typeof document !== 'undefined') {
      const container = document.getElementById('testimonialsCarousel');
      if (container) {
        container.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }
  }

}
