import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';


interface UserProfile {
  id: string;
  /** Chemin vers l'icône SVG (assets/icones/…). null = affiche un badge texte (ex: "IA") */
  iconPath: string | null;
  /** Texte de remplacement affiché quand iconPath est null */
  iconLabel?: string;
  name: string;
  description: string;
  imagePath: string;
  features: string[];
  hoverColor: string;
}



interface FeatureCard {
  icon: 'prescription' | 'tracking' | 'payment' | 'donations' | 'notifications' | 'dashboard';
  title: string;
  description: string;
}

interface Partner {
  id: string;
  name: string;
  logo: string;
  initialsClass: string;
}

interface ProcessCard {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  animationClass: string;
}

interface Testimonial {
  id: string;
  message: string;
  name: string;
  role: string;
  avatarPath: string;
  avatarAlt: string;
  rating: number;
}


@Component({
  selector: 'app-portail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portail.component.html',
  styleUrls: ['./portail.component.css']
})
export class PortailComponent implements OnInit, AfterViewInit {
  @ViewChild('testimonialsCarousel') testimonialsCarousel?: ElementRef<HTMLDivElement>;
  @ViewChild('processSection') processSection?: ElementRef<HTMLElement>;
  
  selectedProfile: UserProfile;
  readonly partnerMarqueeCopies = [0, 1];
  readonly fullRating = 5;
  isProcessSectionVisible = false;

  readonly partners: Partner[] = [
    {
      id: 'ordre-pharmacie',
      name: 'Ordre des Pharmacie',
      logo: 'assets/images/ops.png',
      initialsClass: 'text-[#16a34a]'
    },
    {
      id: 'wave',
      name: 'Wave',
      logo: 'assets/images/wave.png',
      initialsClass: 'text-black'
    },
    {
      id: 'sonatel',
      name: 'Sonatel',
      logo: 'assets/images/sonatel.png',
      initialsClass: 'text-[#0ea5e9]'
    },
    {
      id: 'intouch',
      name: 'InTouch',
      logo: 'assets/images/intouch.png',
      initialsClass: 'text-white'
    },
    {
      id: 'sunu-bank',
      name: 'Sunu Bank',
      logo: 'assets/images/sunu-bank.png',
      initialsClass: 'text-[#be123c]'
    },
    {
      id: 'ordre-medecins',
      name: 'Ordre des Médecins',
      logo: 'assets/images/onms.png',
      initialsClass: 'text-[#1d4ed8]'
    },
    {
      id: 'rts',
      name: 'RTS',
      logo: 'assets/images/rts.png',
      initialsClass: 'text-[#1d4ed8]'
    }
  ];

  readonly processCardColumns: ProcessCard[][] = [
    [
      {
        id: 'dossier-patient',
        title: 'Dossier patient',
        description: 'Centralisez et sécurisez les informations médicales du patient pour un meilleur suivi et une prise en charge rapide.',
        imagePath: 'assets/images/invoice.png',
        imageAlt: 'Dossier patient',
        animationClass: 'animate-slide-in-left'
      },
      {
        id: 'dons',
        title: 'Dons',
        description: 'Contribuez financièrement ou matériellement pour aider les patients à accéder aux soins et traitements.',
        imagePath: 'assets/images/donation.png',
        imageAlt: 'Dons',
        animationClass: 'animate-slide-in-left-delay'
      }
    ],
    [
      {
        id: 'leer',
        title: 'Leer',
        description: 'LEER détecte les comportements suspects, surveille les fraudes potentielles liées aux dons et aux ordonnances.',
        imagePath: 'assets/images/IA.png',
        imageAlt: 'Livraison de médicament',
        animationClass: 'animate-slide-in-right'
      },
      {
        id: 'medecin',
        title: 'Médecin',
        description: 'Les médecins suivent les patients, consultent les dossiers médicaux et valident les prescriptions.',
        imagePath: 'assets/images/doctor.png',
        imageAlt: 'Médecin',
        animationClass: 'animate-slide-in-right-delay'
      }
    ]
  ];

  readonly donationBenefits: string[] = [
    'Aidez un patient à payer son analyse ou son imagerie dès maintenant.',
    'Financez une ordonnance ou une analyse pour ceux qui en ont besoin.',
    "Chaque clic offre un accès aux soins : soyez le héros d'un patient."
  ];

  readonly testimonials: Testimonial[] = [
    {
      id: 'awa',
      message: "Service rapide et fiable, j'ai reçu mes médicaments sans bouger de chez moi !",
      name: 'Awa',
      role: 'Patient',
      avatarPath: 'assets/images/persona.jpg',
      avatarAlt: 'Awa',
      rating: 5
    },
    {
      id: 'diouf',
      message: 'La gestion de stock est un vrai plus pour ma pharmacie.',
      name: 'M. Diouf',
      role: 'Pharmacien',
      avatarPath: 'assets/images/patient.jpg',
      avatarAlt: 'M. Diouf',
      rating: 5
    },
    {
      id: 'fatou',
      message: 'Je choisis ma pharmacie en ligne et je paie à la livraison. Très pratique !',
      name: 'Fatou',
      role: 'Livreuse',
      avatarPath: 'assets/images/patient.png',
      avatarAlt: 'Fatou',
      rating: 5
    }
  ];

  // API data

  readonly profiles: UserProfile[] = [
    {
      id: 'patient',
      iconPath: 'assets/icones/patient.svg',
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
      hoverColor: 'text-cyan-600'
    },
    {
      id: 'medecin',
      iconPath: 'assets/icones/medecin.svg',
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
      hoverColor: 'text-blue-600'
    },
    {
      id: 'pharmacien',
      iconPath: 'assets/icones/pharmacien.svg',
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
      hoverColor: 'text-teal-600'
    },
    {
      id: 'leer',
      iconPath: null,        // Pas de SVG — affiche un badge texte "IA"
      iconLabel: 'IA',
      name: 'Leer',
      description:
        'Analysez et sécurisez les opérations de la plateforme grâce à une intelligence artificielle avancée.',
      imagePath: 'assets/images/Leer.png',
      features: [
        'Détection des fraudes sur les dons',
        'Analyse des ordonnances suspectes',
        'Surveillance des comportements anormaux',
        'Sécurisation des transactions et bénéficiaires'
      ],
      hoverColor: 'text-violet-600'
    },
    {
      id: 'donateur',
      iconPath: 'assets/icones/heart.svg',
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
      icon: 'donations',
      title: 'Espace de dons',
      description: 'Gestion des besoins, des dons et mise en relation en temps réel.'
    },
    {
      icon: 'payment',
      title: 'Paiement sécurisé',
      description: 'Cartes et wallet, reçus automatiques et historique liste.'
    },
     {
      icon: 'tracking',
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

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !this.processSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isProcessSectionVisible) {
            this.isProcessSectionVisible = true;
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(this.processSection.nativeElement);
  }

  trackByProfileId(_index: number, profile: UserProfile): string {
    return profile.id;
  }

  trackByPartnerId(_index: number, partner: Partner): string {
    return partner.id;
  }

  trackByProcessCardId(_index: number, card: ProcessCard): string {
    return card.id;
  }

  trackByTestimonialId(_index: number, testimonial: Testimonial): string {
    return testimonial.id;
  }

  trackByFeatureCardIcon(_index: number, card: FeatureCard): string {
    return card.icon;
  }

  trackByIndex(index: number): number {
    return index;
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
    if (this.testimonialsCarousel) {
      this.testimonialsCarousel.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }

  /** 🔹 Défilement des témoignages vers la droite */
  scrollTestimonialsRight(): void {
    if (this.testimonialsCarousel) {
      this.testimonialsCarousel.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }

}
