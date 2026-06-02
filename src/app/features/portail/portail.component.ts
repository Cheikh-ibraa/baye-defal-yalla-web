import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ContributionService, HelpNeededItem } from '../../services/contribution.service';

interface UserProfile {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  features: string[];
  gradientFrom: string;
  gradientTo: string;
  hoverColor: string;
}

interface Donor {
  name: string;
  date: string;
  amount: string;
}

interface DonationItem {
  id: number;
  type: string;
  urgency: string;
  urgencyColor: string;
  patientName: string;
  patientAge: number;
  patientPhoto: string;
  indication: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorPhoto: string;
  description: string;
  objectif: number;
  collected: number;
  percentage: number;
  fileType: 'image' | 'pdf';
  fileName: string;
  filePath: string;
  donors: Donor[];
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
  helpNeededItems: HelpNeededItem[] = [];
  isLoadingDons = true;
  donsError: string | null = null;

  profiles: UserProfile[] = [
    {
      id: 'patient',
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

  // Données des dons
  selectedDonation: DonationItem | null = null;
  showDonationModal = false;

  // Détail API
  selectedHelpItem: HelpNeededItem | null = null;
  detailLoading = false;
  detailError: string | null = null;
  showDetailModal = false;

  donations: DonationItem[] = [
    {
      id: 1,
      type: 'Ordonnance',
      urgency: 'Urgent',
      urgencyColor: 'bg-[#E74C3C]',
      patientName: 'Mamadou Sow',
      patientAge: 65,
      patientPhoto: '',
      indication: 'Hypertension',
      doctorName: 'Dr. Awa Diop',
      doctorSpecialty: 'Généraliste',
      doctorPhoto: '',
      description: "Cette ordonnance médicale a été délivrée par un professionnel de santé afin de prescrire les médicaments et traitements nécessaires à la prise en charge du patient. Elle précise les produits à administrer, leurs dosages ainsi que la durée du traitement recommandée. Ces soins sont indispensables pour améliorer l'état de santé du patient et éviter toute complication liée à sa maladie.",
      objectif: 25000,
      collected: 17789,
      percentage: 72,
      fileType: 'image',
      fileName: 'ordonnance.jpg',
      filePath: 'assets/images/ordonnance.jpg',
      donors: [
        { name: 'Moussa Ndiaye', date: '06 février 2026', amount: '+2 000 F' },
        { name: 'Anonyme', date: '09 février 2026', amount: '+5 000 F' },
        { name: 'Fatou Diallo', date: '12 février 2026', amount: '+3 500 F' },
        { name: 'Ibrahima Ba', date: '14 février 2026', amount: '+1 000 F' }
      ]
    },
    {
      id: 2,
      type: 'Analyse médicale',
      urgency: 'Moyen',
      urgencyColor: 'bg-[#FFA500]',
      patientName: 'Seydou Diop',
      patientAge: 35,
      patientPhoto: '',
      indication: 'Analyse sanguine',
      doctorName: 'Dr. Mamadou Sarr',
      doctorSpecialty: 'Généraliste',
      doctorPhoto: '',
      description: "Cette ordonnance médicale a été délivrée par un professionnel de santé afin de prescrire les médicaments et traitements nécessaires à la prise en charge du patient. Elle précise les produits à administrer, leurs dosages ainsi que la durée du traitement recommandée. Ces soins sont indispensables pour améliorer l'état de santé du patient et éviter toute complication liée à sa maladie.",
      objectif: 50000,
      collected: 16500,
      percentage: 36,
      fileType: 'pdf',
      fileName: 'prescription Radio.pdf',
      filePath: '',
      donors: [
        { name: 'Moussa Ndiaye', date: '06 février 2026', amount: '+2 000 F' },
        { name: 'Anonyme', date: '09 février 2026', amount: '+5 000 F' },
        { name: 'Aminata Fall', date: '10 février 2026', amount: '+4 000 F' }
      ]
    },
    {
      id: 3,
      type: 'Imagerie médicale',
      urgency: 'Faible',
      urgencyColor: 'bg-[#00B894]',
      patientName: 'Awa Cisse',
      patientAge: 43,
      patientPhoto: '',
      indication: 'Radiographie pulmonaire',
      doctorName: 'Dr. Demba Thioune',
      doctorSpecialty: 'Cardiologue',
      doctorPhoto: '',
      description: "Cette ordonnance médicale a été délivrée par un professionnel de santé afin de prescrire les médicaments et traitements nécessaires à la prise en charge du patient. Elle précise les produits à administrer, leurs dosages ainsi que la durée du traitement recommandée. Ces soins sont indispensables pour améliorer l'état de santé du patient et éviter toute complication liée à sa maladie.",
      objectif: 75000,
      collected: 49890,
      percentage: 62,
      fileType: 'pdf',
      fileName: 'prescription Radio.pdf',
      filePath: '',
      donors: [
        { name: 'Moussa Ndiaye', date: '06 février 2026', amount: '+2 000 F' },
        { name: 'Anonyme', date: '09 février 2026', amount: '+5 000 F' }
      ]
    }
  ];

  constructor(private router: Router, private contributionService: ContributionService) {
    this.selectedProfile = this.profiles[0];
  }

  ngOnInit(): void {
    this.loadHelpNeeded();
  }

  loadHelpNeeded(): void {
    this.isLoadingDons = true;
    this.donsError = null;
    this.contributionService.getHelpNeeded(0, 10).subscribe({
      next: (response) => {
        this.helpNeededItems = response.content;
        this.isLoadingDons = false;
      },
      error: (err) => {
        this.donsError = 'Impossible de charger les besoins médicaux.';
        this.isLoadingDons = false;
      }
    });
  }

  getUrgencyLabel(level: string): string {
    switch (level) {
      case 'CRITICAL': return 'Prioritaire';
      case 'URGENT': return 'Urgent';
      default: return 'Normal';
    }
  }

  getUrgencyColor(level: string): string {
    switch (level) {
      case 'CRITICAL': return 'bg-[#E74C3C]';
      case 'URGENT': return 'bg-[#FFA500]';
      default: return 'bg-[#58D68D]';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'ANALYSIS': return 'Analyse médicale';
      case 'IMAGING': return 'Imagerie médicale';
      case 'PRESCRIPTION': return 'Ordonnance';
      default: return type;
    }
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

  /** 🔹 Ouvre le modal détails don (appel API) */
  openDonationDetail(donationId: number, type: string): void {
    this.detailLoading = true;
    this.detailError = null;
    this.selectedHelpItem = null;
    this.showDetailModal = true;

    this.contributionService.getHelpNeededDetail(type, donationId).subscribe({
      next: (item) => {
        this.selectedHelpItem = item;
        this.detailLoading = false;
      },
      error: () => {
        this.detailError = 'Impossible de charger les détails de cette contribution.';
        this.detailLoading = false;
      }
    });
  }

  /** 🔹 Ferme le modal détails */
  closeDetailModal(): void {
    this.showDetailModal = false;
    setTimeout(() => {
      this.selectedHelpItem = null;
      this.detailError = null;
    }, 300);
  }

  /** 🔹 Construit l'URL d'un fichier */
  getFileUrl(filename: string): string {
    return `https://wakana.online/repertoire_chantier/${filename}`;
  }

  /** 🔹 Détecte si le fichier est une image */
  isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);
  }

  /** 🔹 Détecte si le fichier est un PDF */
  isPdfFile(filename: string): boolean {
    return /\.pdf$/i.test(filename);
  }

  /** 🔹 Retourne le fichier disponible (ordonnance ou rapport) */
  getDetailFile(): string | null {
    if (!this.selectedHelpItem) return null;
    return this.selectedHelpItem.prescriptionFile || this.selectedHelpItem.reportFile || null;
  }

  /** 🔹 Formater un montant en FCFA */
  formatAmount(amount: number): string {
    return amount.toLocaleString('fr-FR');
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

  // Donate modal
  showDonateModal = false;
  donateAmount = 5000;
  selectedPreset: number | null = 5000;
  presetAmounts = [1000, 2000, 5000, 10000];
  recentAmounts = [1000, 2000, 5000, 5000];

  openDonateModal(donationId: number): void {
    this.donateAmount = 5000;
    this.selectedPreset = 5000;
    this.showDonateModal = true;
  }

  closeDonateModal(): void {
    this.showDonateModal = false;
  }

  selectPreset(amount: number): void {
    this.selectedPreset = amount;
    this.donateAmount = amount;
  }
}

