import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ContributionService, HelpNeededItem } from '../../services/contribution.service';

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

  constructor(
    private router: Router,
    private contributionService: ContributionService
  ) { }

  ngOnInit(): void {
    this.loadAllDons();
  }

  private loadAllDons(): void {
    this.isLoadingDons = true;
    this.donsError = null;

    this.contributionService.getHelpNeeded(0, 10).subscribe({
      next: (firstPage) => {
        const totalPages = firstPage.totalPages ?? 1;

        if (totalPages <= 1) {
          this.donations = this.mapHelpItemsToDonations(firstPage.content ?? []);
          this.applyCurrentFilter();
          this.isLoadingDons = false;
          return;
        }

        const pageRequests = Array.from({ length: totalPages }, (_, page) =>
          this.contributionService.getHelpNeeded(page, 10)
        );

        forkJoin(pageRequests).subscribe({
          next: (responses) => {
            const allItems = responses.flatMap(response => response.content ?? []);
            this.donations = this.mapHelpItemsToDonations(allItems);
            this.applyCurrentFilter();
            this.isLoadingDons = false;
          },
          error: () => {
            this.donsError = 'Impossible de charger les besoins médicaux.';
            this.donations = [];
            this.applyCurrentFilter();
            this.isLoadingDons = false;
          }
        });
      },
      error: () => {
        this.donsError = 'Impossible de charger les besoins médicaux.';
        this.donations = [];
        this.applyCurrentFilter();
        this.isLoadingDons = false;
      }
    });
  }

  private mapHelpItemsToDonations(items: HelpNeededItem[]): DonationItem[] {
    return items.map(item => {
      const type = this.getTypeLabel(item.type);
      const urgency = this.getUrgencyLabel(item.urgencyLevel);
      const urgencyBg = this.getUrgencyBg(item.urgencyLevel);
      const percentage = Math.min(Math.max(Math.round(item.contributionPercentage ?? 0), 0), 100);

      return {
        id: item.id,
        type,
        urgency,
        urgencyColor: 'text-white',
        urgencyBg,
        patientName: item.patientName || 'Patient inconnu',
        patientAge: item.youngPatient ? 12 : 35,
        indication: item.itemType || item.facilityName || 'Besoin médical',
        doctorName: item.doctorName || 'Médecin non renseigné',
        doctorSpecialty: item.doctorspeciality || 'Spécialité non renseignée',
        description: item.description || 'Aucune description disponible.',
        objectif: item.amount || 0,
        collected: item.amountContributed || 0,
        percentage,
        progressColor: 'bg-[#2AB396]',
        donors: []
      };
    });
  }

  private getUrgencyLabel(level: string | null): string {
    switch (level) {
      case 'CRITICAL':
        return 'Prioritaire';
      case 'URGENT':
        return 'Urgent';
      default:
        return 'Normal';
    }
  }

  private getUrgencyBg(level: string | null): string {
    switch (level) {
      case 'CRITICAL':
        return 'bg-[#E74C3C]';
      case 'URGENT':
        return 'bg-[#FFA500]';
      default:
        return 'bg-[#58D68D]';
    }
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'ANALYSIS':
        return 'Analyse médicale';
      case 'IMAGING':
        return 'Imagerie médicale';
      case 'PRESCRIPTION':
        return 'Ordonnance';
      default:
        return type;
    }
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
    this.router.navigate(['/login']);
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
