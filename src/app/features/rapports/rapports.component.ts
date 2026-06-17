import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Rapport {
  period: string;   // 'YYYY-MM'
  label: string;    // 'avril 2026'
  type: string;
  usedAmount: number;
  remaining: number;
  usagePercent: number;
}

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.css']
})
export class RapportsComponent implements OnInit {
  activeTab: 'all' | 'mensuel' | 'annuel' = 'all';

  rapports: Rapport[] = [];
  filteredRapports: Rapport[] = [];

  isLoading = true;

  // KPI globaux
  totalAlloue  = 0;
  totalUtilise = 0;
  totalRestant = 0;
  beneficiaires = 0;

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadKpis();
    this.loadReports();
  }

  private loadKpis(): void {
    this.http.get<any>(`${environment.baseUrl}/organization/budgets`, { headers: this.authHeaders }).subscribe({
      next: (res) => {
        this.totalAlloue   = Number(res.totalAllocated ?? 0);
        this.totalUtilise  = Number(res.totalUsed      ?? 0);
        this.totalRestant  = this.totalAlloue - this.totalUtilise;
        this.beneficiaires = Number(res.livesImpacted  ?? 0);
      },
      error: () => {},
    });
  }

  private loadReports(): void {
    this.isLoading = true;
    this.http.get<Rapport[]>(`${environment.baseUrl}/organization/reports`, { headers: this.authHeaders }).subscribe({
      next: (res) => {
        this.rapports = res ?? [];
        this.filterRapports();
        this.isLoading = false;
      },
      error: () => {
        this.rapports = STATIC_RAPPORTS;
        this.filterRapports();
        this.isLoading = false;
      },
    });
  }

  setTab(tab: 'all' | 'mensuel' | 'annuel'): void {
    this.activeTab = tab;
    this.filterRapports();
  }

  filterRapports(): void {
    if (this.activeTab === 'all') {
      this.filteredRapports = this.rapports;
    } else {
      this.filteredRapports = this.rapports.filter(r =>
        this.activeTab === 'mensuel' ? !r.type?.toLowerCase().includes('annuel') : r.type?.toLowerCase().includes('annuel')
      );
    }
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR');
  }

  capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }
}

const STATIC_RAPPORTS: Rapport[] = [
  { period: '2026-04', label: 'avril 2026',    type: 'Rapport mensuel', usedAmount: 1500000, remaining: 3500000, usagePercent: 30 },
  { period: '2026-03', label: 'mars 2026',     type: 'Rapport mensuel', usedAmount: 2500000, remaining: 5000000, usagePercent: 20 },
  { period: '2026-02', label: 'février 2026',  type: 'Rapport mensuel', usedAmount: 500000,  remaining: 7500000, usagePercent: 5  },
  { period: '2026-01', label: 'janvier 2026',  type: 'Rapport mensuel', usedAmount: 2000000, remaining: 8000000, usagePercent: 15 },
  { period: '2025-12', label: 'décembre 2025', type: 'Rapport mensuel', usedAmount: 2000000, remaining: 8000000, usagePercent: 84 },
  { period: '2025-11', label: 'novembre 2025', type: 'Rapport mensuel', usedAmount: 2000000, remaining: 8000000, usagePercent: 84 },
];
