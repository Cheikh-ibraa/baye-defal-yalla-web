import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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
  urgencyBg: string;
  patientName: string;
  patientAge: number;
  indication: string;
  doctorName: string;
  doctorSpecialty: string;
  description: string;
  objectif: number;
  collected: number;
  percentage: number;
  progressColor: string;
  donors: Donor[];
  patientPhoto?: string;
  doctorPhoto?: string;
  docType?: 'photo' | 'pdf';
  docName?: string;
  docUrl?: string;
  choicesOption?: '100' | '100_50';
}

const STATIC_DONATIONS: DonationItem[] = [
  {
    id: 1,
    type: 'Ordonnance',
    urgency: 'Urgent',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#E74C3C]',
    patientName: 'Mamadou Sow',
    patientAge: 65,
    indication: 'Traitement hypertension',
    doctorName: 'Dr. Awa Cisse',
    doctorSpecialty: 'Généraliste',
    description:
      'Ordonnance pour hypertension nécessitant traitement continu.',
    objectif: 300000,
    collected: 0,
    percentage: 0,
    progressColor: 'bg-[#2AB396]',
    patientPhoto: 'assets/images/patient.png',
    doctorPhoto: 'assets/images/medecin.png',
    docType: 'photo',
    docUrl: 'assets/images/img-ordinance.png',
    choicesOption: '100',
    donors: []
  },
  {
    id: 2,
    type: 'Analyse médicale',
    urgency: 'Moyen',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#F29900]',
    patientName: 'Seydou Diop',
    patientAge: 35,
    indication: 'Analyse sanguine',
    doctorName: 'Dr. Mamadou Sarr',
    doctorSpecialty: 'Généraliste',
    description:
      'Le patient nécessite un bilan sanguin complet pour confirmer le diagnostic et orienter le traitement.',
    objectif: 50000,
    collected: 16500,
    percentage: 33,
    progressColor: 'bg-[#2AB396]',
    patientPhoto: 'assets/images/persona.jpg',
    doctorPhoto: 'assets/images/med-pro.jpg',
    docType: 'pdf',
    docName: 'bilan_sanguin.pdf',
    choicesOption: '100_50',
    donors: [
      { name: 'Aminata Fall', date: '10 février 2026', amount: '+4 000 F' },
      { name: 'Anonyme', date: '11 février 2026', amount: '+3 000 F' }
    ]
  },
  {
    id: 3,
    type: 'Ordonnance',
    urgency: 'Urgent',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#E74C3C]',
    patientName: 'Awa Cisse',
    patientAge: 43,
    indication: 'Radiographie pulmonaire',
    doctorName: 'Dr. Mamadou Sarr',
    doctorSpecialty: 'Généraliste',
    description:
      'Analyse sanguine pour diagnostic chez une enfant présentant une forte fièvre.',
    objectif: 800000,
    collected: 200000,
    percentage: 20,
    progressColor: 'bg-[#2AB396]',
    patientPhoto: 'assets/images/medecin.png',
    doctorPhoto: 'assets/images/patient.png',
    docType: 'pdf',
    docName: 'prescription Radio.pdf',
    choicesOption: '100_50',
    donors: [
      { name: 'Moussa Ndiaye', date: '06 février 2026', amount: '+200 000 F' }
    ]
  },
  {
    id: 4,
    type: 'Ordonnance',
    urgency: 'Urgent',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#E74C3C]',
    patientName: 'Maimouna Fall',
    patientAge: 28,
    indication: 'Paludisme grave',
    doctorName: 'Dr. Awa Diop',
    doctorSpecialty: 'Généraliste',
    description:
      'Traitement d’urgence requis contre le paludisme grave.',
    objectif: 150000,
    collected: 100000,
    percentage: 67,
    progressColor: 'bg-[#2AB396]',
    patientPhoto: 'assets/images/medecin.png',
    doctorPhoto: 'assets/images/patient.png',
    docType: 'photo',
    docUrl: 'assets/images/img-ordinance.png',
    choicesOption: '100',
    donors: [
      { name: 'Ousmane Sow', date: '15 février 2026', amount: '+50 000 F' },
      { name: 'Anonyme', date: '16 février 2026', amount: '+50 000 F' }
    ]
  },
  {
    id: 5,
    type: 'Analyse médicale',
    urgency: 'Moyen',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#F29900]',
    patientName: 'Abdoulaye Ndiaye',
    patientAge: 45,
    indication: 'Bilan lipidique',
    doctorName: 'Dr. Mamadou Sarr',
    doctorSpecialty: 'Généraliste',
    description:
      'Bilan lipidique complet recommandé pour le suivi cardiovasculaire.',
    objectif: 30000,
    collected: 15000,
    percentage: 50,
    progressColor: 'bg-[#2AB396]',
    patientPhoto: 'assets/images/persona.jpg',
    doctorPhoto: 'assets/images/med-pro.jpg',
    docType: 'pdf',
    docName: 'bilan_lipidique.pdf',
    choicesOption: '100_50',
    donors: [
      { name: 'Mariama Ba', date: '18 février 2026', amount: '+10 000 F' },
      { name: 'Anonyme', date: '19 février 2026', amount: '+5 000 F' }
    ]
  },
  {
    id: 6,
    type: 'Imagerie médicale',
    urgency: 'Faible',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#58D68D]',
    patientName: 'Khady Diagne',
    patientAge: 52,
    indication: 'Échographie abdominale',
    doctorName: 'Dr. Demba Thioune',
    doctorSpecialty: 'Cardiologue',
    description:
      'Échographie abdominale pour explorer des douleurs récurrentes.',
    objectif: 45000,
    collected: 15000,
    percentage: 33,
    progressColor: 'bg-[#2AB396]',
    patientPhoto: 'assets/images/medecin.png',
    doctorPhoto: 'assets/images/patient.png',
    docType: 'pdf',
    docName: 'echographie.pdf',
    choicesOption: '100_50',
    donors: [
      { name: 'Cheikh Diallo', date: '20 février 2026', amount: '+15 000 F' }
    ]
  }
];

@Component({
  selector: 'app-dons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dons.component.html'
})
export class DonsComponent implements OnInit, OnDestroy, AfterViewInit {

  filters = [
    { label: 'Tous', icon: 'grid', value: 'all' },
    { label: 'Ordonnance', icon: 'file', value: 'Ordonnance' },
    { label: 'Analyse', icon: 'flask', value: 'Analyse médicale' },
    { label: 'Imagerie', icon: 'scan', value: 'Imagerie médicale' }
  ];

  activeFilter = 'all';

  donations: DonationItem[] = [];

  filteredDonations: DonationItem[] = [];
  selectedDonation: DonationItem | null = null;
  showDonationModal = false;
  isLoadingDons = true;
  donsError: string | null = null;

  // Selected contribution logic
  selectedContribution: '100' | '50' = '100';
  showDonorsList = true;

  // Donate modal
  showDonateModal = false;
  mobileMenuOpen = false;
  donateAmount = 5000;
  selectedPreset: number | null = 5000;
  presetAmounts = [1000, 2000, 5000, 10000];
  recentAmounts = [1000, 2000, 5000, 5000];
  donateDonationId: number | null = null;

  private autoScrollInterval: ReturnType<typeof setInterval> | null = null;
  private isHovered = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadAllDons();
  }

  private loadAllDons(): void {
    this.isLoadingDons = false;
    this.donsError = null;
    this.donations = [...STATIC_DONATIONS];
    this.applyCurrentFilter();
  }

  private applyCurrentFilter(): void {
    if (this.activeFilter === 'all') {
      this.filteredDonations = [...this.donations];
      return;
    }

    this.filteredDonations = this.donations.filter(don => don.type === this.activeFilter);
  }

  ngAfterViewInit(): void {
    if (typeof document !== 'undefined') {
      this.startAutoScroll();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }


  setFilter(value: string): void {
    this.activeFilter = value;
    this.applyCurrentFilter();
    // Reset scroll position on filter change
    if (typeof document !== 'undefined') {
      const container = document.getElementById('donsCarousel');
      if (container) {
        container.scrollLeft = 0;
      }
    }
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('fr-FR');
  }

  goToLogin(): void {
    this.router.navigate(['/portail']);
  }

  goToPortail(): void {
    this.router.navigate(['/portail']);
  }

  onCarouselEnter(): void {
    this.isHovered = true;
  }

  onCarouselLeave(): void {
    this.isHovered = false;
  }

  trackByDon(index: number, don: DonationItem): number {
    return don.id;
  }

  openDonationDetail(donationId: number): void {
    this.selectedDonation = this.donations.find(d => d.id === donationId) || null;
    this.selectedContribution = '100';
    this.showDonorsList = true;
    this.showDonationModal = true;
  }

  closeDonationDetail(): void {
    this.showDonationModal = false;
    setTimeout(() => {
      this.selectedDonation = null;
    }, 300);
  }

  selectContributionOption(option: '100' | '50'): void {
    this.selectedContribution = option;
  }

  toggleDonorsList(): void {
    this.showDonorsList = !this.showDonorsList;
  }

  confirmDonation(): void {
    if (!this.selectedDonation) return;

    const amount = this.selectedContribution === '100'
      ? this.selectedDonation.objectif
      : this.selectedDonation.objectif / 2;

    this.selectedDonation.collected += amount;
    if (this.selectedDonation.collected > this.selectedDonation.objectif) {
      this.selectedDonation.collected = this.selectedDonation.objectif;
    }
    this.selectedDonation.percentage = Math.round((this.selectedDonation.collected / this.selectedDonation.objectif) * 100);

    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    this.selectedDonation.donors.unshift({
      name: 'Vous (Donateur)',
      date: currentDate,
      amount: `+${this.formatAmount(amount)} F`
    });

    this.closeDonationDetail();
  }

  openDonateModal(donationId: number): void {
    this.donateDonationId = donationId;
    this.donateAmount = 5000;
    this.selectedPreset = 5000;
    this.showDonateModal = true;
  }

  closeDonateModal(): void {
    this.showDonateModal = false;
    this.donateDonationId = null;
  }

  selectPreset(amount: number): void {
    this.selectedPreset = amount;
    this.donateAmount = amount;
  }

  private startAutoScroll(): void {
    this.autoScrollInterval = setInterval(() => {
      if (this.isHovered) return;
      const container = document.getElementById('donsCarousel');
      if (!container) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 2) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 1, behavior: 'auto' });
      }
    }, 25);
  }

  private stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }
}
