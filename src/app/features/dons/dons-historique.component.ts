import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PastDonation {
  id: string;
  date: Date;
  dateString: string;
  type: 'ORDONNANCE' | 'ANALYSE' | 'IMAGERIE' | string;
  patientName: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  treatment: string;
}

@Component({
  selector: 'app-dons-historique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dons-historique.component.html'
})
export class DonsHistoriqueComponent implements OnInit {

  allDonations: PastDonation[] = [];   // raw from API
  filteredDonations: PastDonation[] = [];

  activeFilter: 'TOUS' | 'MOIS' | 'SEMAINE' = 'TOUS';

  totalDonated   = 0;
  viesImpactees  = 0;

  isLoading = true;

  currentPage = 1;
  readonly pageSize = 6;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDonations.length / this.pageSize));
  }

  get pagedDonations(): PastDonation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDonations.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  prevPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  private loadHistory(): void {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`${environment.baseUrl}/contributions/me/history?period=all`, { headers })
      .subscribe({
        next: (res) => {
          this.totalDonated  = res.totalDonated  ?? 0;
          this.viesImpactees = res.livesImpacted ?? 0;

          const raw: any[] = res.contributions ?? [];
          this.allDonations = raw.map(c => this.mapContribution(c));
          this.applyFilter('TOUS');
          this.isLoading = false;
        },
        error: () => {
          this.allDonations = STATIC_DONATIONS;
          this.totalDonated  = STATIC_DONATIONS.reduce((s, d) => s + d.amount, 0);
          this.viesImpactees = new Set(STATIC_DONATIONS.map(d => d.patientName)).size;
          this.applyFilter('TOUS');
          this.isLoading = false;
        },
      });
  }

  private mapContribution(c: any): PastDonation {
    const STATUS_MAP: Record<string, 'SUCCESS' | 'PENDING' | 'FAILED'> = {
      VALIDATED: 'SUCCESS',
      PENDING:   'PENDING',
      REJECTED:  'FAILED',
    };
    const date = new Date(c.createdAt);
    // API returns campaignSummary (summary object) AND campaign (full relation) — use whichever has the data
    const info = c.campaignSummary ?? c.campaign ?? {};
    return {
      id:            c.id,
      date,
      dateString:    date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      type:          info.type        ?? 'ORDONNANCE',
      patientName:   info.patientName ?? 'Patient',
      amount:        Number(c.amount),
      paymentMethod: c.paymentMethod  ?? 'Wave',
      status:        STATUS_MAP[c.status] ?? 'PENDING',
      treatment:     info.treatment   ?? '',
    };
  }

  applyFilter(filterType: 'TOUS' | 'MOIS' | 'SEMAINE'): void {
    this.activeFilter = filterType;
    this.currentPage  = 1;
    const now = new Date();

    if (filterType === 'TOUS') {
      this.filteredDonations = [...this.allDonations];
    } else if (filterType === 'MOIS') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      this.filteredDonations = this.allDonations.filter(d => d.date >= cutoff);
    } else {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.filteredDonations = this.allDonations.filter(d => d.date >= cutoff);
    }
  }

  formatAmount(amount: number): string {
    return (amount ?? 0).toLocaleString('fr-FR');
  }

  getFirstName(name: string): string {
    return name.split(' ')[0] || '';
  }

  getLastName(name: string): string {
    return name.split(' ').slice(1).join(' ') || '';
  }
}

const STATIC_DONATIONS: PastDonation[] = [
  {
    id: 'DON-2025-001',
    date: new Date(Date.now() - 3 * 86400_000),
    dateString: '10 juin 2026',
    type: 'ORDONNANCE',
    patientName: 'Seydou Diop',
    amount: 400000,
    paymentMethod: 'Wave',
    status: 'SUCCESS',
    treatment: 'Hypertension'
  },
  {
    id: 'DON-2025-002',
    date: new Date(Date.now() - 5 * 86400_000),
    dateString: '8 juin 2026',
    type: 'ANALYSE',
    patientName: 'Mamadou Sow',
    amount: 300000,
    paymentMethod: 'Orange Money',
    status: 'PENDING',
    treatment: 'Paludisme'
  },
  {
    id: 'DON-2025-003',
    date: new Date(Date.now() - 12 * 86400_000),
    dateString: '1 juin 2026',
    type: 'IMAGERIE',
    patientName: 'Maimouna Fall',
    amount: 800000,
    paymentMethod: 'Wave',
    status: 'SUCCESS',
    treatment: 'Infection'
  },
];
