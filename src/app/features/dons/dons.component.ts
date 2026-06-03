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
    indication: 'Hypertension',
    doctorName: 'Dr. Awa Diop',
    doctorSpecialty: 'Généraliste',
    description:
      'Cette ordonnance médicale a été délivrée pour financer des médicaments nécessaires à la prise en charge du patient.',
    objectif: 25000,
    collected: 17789,
    percentage: 72,
    progressColor: 'bg-[#2AB396]',
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
    urgency: 'Normal',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#58D68D]',
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
    donors: [
      { name: 'Aminata Fall', date: '10 février 2026', amount: '+4 000 F' },
      { name: 'Anonyme', date: '11 février 2026', amount: '+3 000 F' }
    ]
  },
  {
    id: 3,
    type: 'Imagerie médicale',
    urgency: 'Prioritaire',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#E74C3C]',
    patientName: 'Awa Cisse',
    patientAge: 43,
    indication: 'Radiographie pulmonaire',
    doctorName: 'Dr. Demba Thioune',
    doctorSpecialty: 'Cardiologue',
    description:
      'Un examen d’imagerie est requis en urgence pour évaluer la situation clinique du patient.',
    objectif: 75000,
    collected: 49890,
    percentage: 66,
    progressColor: 'bg-[#2AB396]',
    donors: [
      { name: 'Moussa Ndiaye', date: '06 février 2026', amount: '+2 000 F' },
      { name: 'Anonyme', date: '09 février 2026', amount: '+5 000 F' }
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
    this.showDonationModal = true;
  }

  closeDonationDetail(): void {
    this.showDonationModal = false;
    setTimeout(() => this.selectedDonation = null, 300);
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
