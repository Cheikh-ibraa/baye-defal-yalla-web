import {
  Component, OnInit, ViewChild, ElementRef,
  AfterViewInit, OnDestroy, inject, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface DashboardData {
  todayOrders: number;
  pending: number;
  inPreparation: number;
  ready: number;
  delivered: number;
  pendingPercentage: number;
  inPreparationPercentage: number;
  readyPercentage: number;
  deliveredPercentage: number;
  pharmacy: {
    id: string;
    name: string;
    address: string;
    phone: string;
    logoUrl: string | null;
    openingHours: string | null;
    isOpen: boolean;
  } | null;
}

interface EvolutionPoint { label: string; count: number; }

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, UpperCasePipe],
  standalone: true,
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieChart',  { static: false }) pieChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart', { static: false }) lineChartRef!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  isBrowser = isPlatformBrowser(this.platformId);
  selectedPeriod: PeriodType = 'WEEKLY';

  pharmacistName = '';
  avgPreparationTime = '—';

  dashboard: DashboardData | null = null;
  evolution: EvolutionPoint[] = [];

  loadingDashboard = true;
  loadingEvolution = true;
  errorDashboard = '';
  errorEvolution = '';

  isExporting = false;
  isOpen = false;

  pieChartInstance:  Chart | null = null;
  lineChartInstance: Chart | null = null;

  readonly filesBaseUrl = environment.filesUrl;

  ngOnInit(): void {
    this.extractPharmacistName();
    this.loadDashboard();
    this.loadEvolution();
  }

  private extractPharmacistName(): void {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const first = payload.given_name ?? payload.firstName ?? '';
      const last  = payload.family_name ?? payload.lastName ?? '';
      const full  = `${first} ${last}`.trim();
      this.pharmacistName = full || payload.preferred_username || payload.name || '';
    } catch { /* token absent ou invalide */ }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) setTimeout(() => this.buildCharts(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pieChartInstance?.destroy();
    this.lineChartInstance?.destroy();
  }

  loadDashboard(): void {
    this.loadingDashboard = true;
    this.errorDashboard = '';
    this.http.get<DashboardData>(`${environment.baseUrl}/pharmacy/pharmacy/dashboard`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboard = data;
          this.loadingDashboard = false;
          this.updatePieChart();
        },
        error: () => {
          this.errorDashboard = 'Impossible de charger le tableau de bord.';
          this.loadingDashboard = false;
        },
      });
  }

  loadEvolution(): void {
    this.loadingEvolution = true;
    this.errorEvolution = '';
    this.http.get<EvolutionPoint[]>(`${environment.baseUrl}/pharmacy/orders/evolution?period=${this.selectedPeriod}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.evolution = data;
          this.loadingEvolution = false;
          this.updateLineChart();
        },
        error: () => {
          this.errorEvolution = 'Impossible de charger l\'évolution.';
          this.loadingEvolution = false;
        },
      });
  }

  onPeriodChange(event: Event): void {
    this.selectedPeriod = (event.target as HTMLSelectElement).value as PeriodType;
    this.loadEvolution();
  }

  refresh(): void {
    this.loadDashboard();
    this.loadEvolution();
  }

  // ─── Graphiques ──────────────────────────────────────────────────────────────

  buildCharts(): void {
    this.buildPieChart();
    this.buildLineChart();
  }

  buildPieChart(): void {
    const ctx = this.pieChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    this.pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['En attente', 'Préparation', 'Prêtes', 'Livrées'],
        datasets: [{ data: this.pieData(), backgroundColor: ['#FDE047', '#60A5FA', '#2563EB', '#14B8A6'], borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }

  buildLineChart(): void {
    const ctx = this.lineChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    this.lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.evolution.map(e => e.label),
        datasets: [{
          label: 'Commandes',
          data: this.evolution.map(e => e.count),
          borderColor: '#14B8A6', backgroundColor: 'transparent',
          borderWidth: 2, pointBackgroundColor: '#14B8A6',
          pointRadius: 4, tension: 0.4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { beginAtZero: true, grid: { color: '#F3F4F6' }, border: { display: false }, ticks: { stepSize: 1 } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  updatePieChart(): void {
    if (!this.pieChartInstance) return;
    this.pieChartInstance.data.datasets[0].data = this.pieData();
    this.pieChartInstance.update();
  }

  updateLineChart(): void {
    if (!this.lineChartInstance) return;
    this.lineChartInstance.data.labels = this.evolution.map(e => e.label);
    this.lineChartInstance.data.datasets[0].data = this.evolution.map(e => e.count);
    this.lineChartInstance.update();
  }

  get evolutionIsEmpty(): boolean {
    return this.evolution.length > 0 && this.evolution.every(e => e.count === 0);
  }

  pieData(): number[] {
    if (!this.dashboard) return [0, 0, 0, 0];
    return [
      this.dashboard.pendingPercentage ?? 0,
      this.dashboard.inPreparationPercentage ?? 0,
      this.dashboard.readyPercentage ?? 0,
      this.dashboard.deliveredPercentage ?? 0,
    ];
  }

  // ─── Export Excel ─────────────────────────────────────────────────────────────

  toggleDropdown(): void { this.isOpen = !this.isOpen; }
  closeDropdown(): void  { this.isOpen = false; }
  exportToPDF(): void    { this.closeDropdown(); }

  exportToExcel(): void {
    this.closeDropdown();
    this.isExporting = true;
    try {
      const wb   = XLSX.utils.book_new();
      const ts   = new Date().toISOString().split('T')[0];
      const d    = this.dashboard;
      const name = d?.pharmacy?.name ?? '—';

      const overview: any[][] = [
        ['TABLEAU DE BORD PHARMACIE'],
        [`Généré le : ${new Date().toLocaleString('fr-FR')}`],
        [`Pharmacie : ${name}`],
        [],
        ['--- STATISTIQUES ---'],
        ['Statut', 'Nombre', '%'],
        ['En attente',    d?.pending       ?? 0, d?.pendingPercentage       ?? 0],
        ['En préparation',d?.inPreparation ?? 0, d?.inPreparationPercentage ?? 0],
        ['Prêtes',        d?.ready         ?? 0, d?.readyPercentage         ?? 0],
        ['Livrées',       d?.delivered     ?? 0, d?.deliveredPercentage     ?? 0],
        ['Auj. total',    d?.todayOrders   ?? 0, ''],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(overview);
      ws1['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Vue d\'ensemble');

      const evo: any[][] = [
        ['ÉVOLUTION DES COMMANDES'],
        [`Période : ${this.selectedPeriod}`],
        [],
        ['Tranche', 'Commandes'],
        ...this.evolution.map(e => [e.label, e.count]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(evo);
      ws2['!cols'] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Évolution');

      const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' });
      saveAs(blob, `dashboard-pharmacie-${ts}.xlsx`);
    } finally {
      this.isExporting = false;
    }
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n) + ' Fcfa';
  }
}
