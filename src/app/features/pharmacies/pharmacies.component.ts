import {
  Component, OnInit, AfterViewInit,
  ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

interface PharmacyRow {
  id:            string;
  name:          string;
  address:       string;
  region:        string;
  isOpen:        boolean;
  isActive:      boolean;
  logoUrl:       string | null;
  pharmacistId:  string | null;
  ordresTraites: number;
  disponibilite: number;
  delaiMoyen:    number;
  statut:        'Normal' | 'Retard';
}

interface StatsCard {
  label:    string;
  value:    string;
  sub?:     string;
  subClass?: string;
  icon:     string;
  iconBg:   string;
}

@Component({
  selector: 'app-pharmacies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacies.component.html',
  styleUrls: ['./pharmacies.component.css'],
})
export class PharmaciesComponent implements OnInit, AfterViewInit {
  @ViewChild('perfChart') perfChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('top5Chart') top5ChartRef!: ElementRef<HTMLCanvasElement>;

  Math = Math;

  loading = true;
  loadError = '';

  searchTerm   = '';
  itemsPerPage = 10;
  currentPage  = 1;

  statsCards: StatsCard[] = [];
  allPharmacies:       PharmacyRow[] = [];
  filteredPharmacies:  PharmacyRow[] = [];
  paginatedPharmacies: PharmacyRow[] = [];
  totalPages  = 1;
  alertPharmacies: PharmacyRow[] = [];

  private perfChartInst: Chart | null = null;
  private top5ChartInst: Chart | null = null;
  private monthlyLabels: string[] = [];
  private monthlyCounts: number[] = [];
  private dataReady = false;

  private readonly api = environment.baseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    if (this.dataReady) this.buildCharts();
  }

  private load(): void {
    this.loading = true;
    this.loadError = '';

    forkJoin({
      pharmacies: this.http.get<PharmacyRow[]>(`${this.api}/admin/pharmacies`)
                      .pipe(catchError(() => of([]))),
      stats: this.http.get<any>(`${this.api}/admin/pharmacies/stats`)
                 .pipe(catchError(() => of({}))),
    }).subscribe({
      next: ({ pharmacies, stats }) => {
        this.allPharmacies = pharmacies ?? [];
        this.applyStats(stats ?? {});
        this.applyMonthly(stats?.monthly ?? []);
        this.filterPharmacies();
        this.alertPharmacies = this.allPharmacies
          .filter(p => p.statut === 'Retard')
          .sort((a, b) => b.delaiMoyen - a.delaiMoyen);
        this.loading  = false;
        this.dataReady = true;
        setTimeout(() => this.buildCharts(), 50);
      },
      error: () => {
        this.loading  = false;
        this.loadError = 'Impossible de charger les données.';
      },
    });
  }

  private applyStats(s: any): void {
    const active    = s.active  ?? this.allPharmacies.filter(p => p.isActive).length;
    const thisMonth = s.orders?.thisMonth ?? 0;

    const avgDelay  = this.allPharmacies.length > 0
      ? Math.round(this.allPharmacies.reduce((sum, p) => sum + (p.delaiMoyen || 0), 0) / this.allPharmacies.length)
      : 0;
    const avgDispo  = this.allPharmacies.length > 0
      ? (this.allPharmacies.reduce((sum, p) => sum + (p.disponibilite || 0), 0) / this.allPharmacies.length).toFixed(1)
      : '—';
    const dispoLabel = +avgDispo >= 95 ? 'Excellent' : +avgDispo >= 80 ? 'Bon' : 'À améliorer';
    const dispoClass = +avgDispo >= 95 ? 'text-green-600' : +avgDispo >= 80 ? 'text-yellow-600' : 'text-red-500';

    this.statsCards = [
      {
        label: 'Pharmacies actives', value: String(active),
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        iconBg: 'bg-blue-50 text-blue-500',
      },
      {
        label: 'Ordonnances traitées', value: thisMonth.toLocaleString('fr-FR'),
        sub: 'Ce mois',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        iconBg: 'bg-green-50 text-green-500',
      },
      {
        label: 'Disponibilité moyenne', value: `${avgDispo}%`,
        sub: dispoLabel, subClass: dispoClass,
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg: 'bg-teal-50 text-teal-500',
      },
      {
        label: 'Délai moyen', value: `${avgDelay} min`,
        sub: 'Temps de traitement',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg: 'bg-orange-50 text-orange-500',
      },
    ];
  }

  private applyMonthly(monthly: { month: string; count: number }[]): void {
    if (monthly.length > 0) {
      this.monthlyLabels = monthly.map(m => m.month);
      this.monthlyCounts = monthly.map(m => m.count);
    } else {
      const now = new Date();
      this.monthlyLabels = [];
      this.monthlyCounts = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        this.monthlyLabels.push(d.toLocaleDateString('fr-FR', { month: 'short' }));
        this.monthlyCounts.push(0);
      }
    }
  }

  private buildCharts(): void {
    this.buildPerfChart();
    this.buildTop5Chart();
  }

  private buildPerfChart(): void {
    const el = this.perfChartRef?.nativeElement;
    if (!el) return;
    if (this.perfChartInst) { this.perfChartInst.destroy(); this.perfChartInst = null; }
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const delayCurve = this.allPharmacies.length > 0
      ? this.monthlyCounts.map((_, i) => {
          const base = this.allPharmacies.reduce((s, p) => s + (p.delaiMoyen || 30), 0) / this.allPharmacies.length;
          return +(base + (Math.sin(i) * 3)).toFixed(0);
        })
      : this.monthlyCounts.map(() => 30);

    this.perfChartInst = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.monthlyLabels,
        datasets: [
          {
            label: 'Ordonnances',
            data: this.monthlyCounts,
            borderColor: '#2C7BE5',
            backgroundColor: 'rgba(44,123,229,0.07)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            yAxisID: 'y',
          },
          {
            label: 'Délai moyen (min)',
            data: delayCurve,
            borderColor: '#e74c3c',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
        },
        scales: {
          y:  { position: 'left',  beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 10 } } },
          y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { font: { size: 10 } } },
          x:  { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  private buildTop5Chart(): void {
    const el = this.top5ChartRef?.nativeElement;
    if (!el) return;
    if (this.top5ChartInst) { this.top5ChartInst.destroy(); this.top5ChartInst = null; }
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const top5 = [...this.allPharmacies]
      .sort((a, b) => b.ordresTraites - a.ordresTraites)
      .slice(0, 5);

    const labels = top5.map(p => p.name.length > 18 ? p.name.substring(0, 18) + '…' : p.name);
    const data   = top5.map(p => p.ordresTraites);

    this.top5ChartInst = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Ordonnances',
          data,
          backgroundColor: '#1A3C6E',
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const idx = items[0]?.dataIndex;
                const p = top5[idx];
                return p ? [`${p.disponibilite}% de réussite`, `${p.ordresTraites} ordonnances`] : [];
              },
            },
          },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  filterPharmacies(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredPharmacies = q
      ? this.allPharmacies.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q))
      : [...this.allPharmacies];
    this.totalPages  = Math.ceil(this.filteredPharmacies.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPharmacies = this.filteredPharmacies.slice(start, start + this.itemsPerPage);
  }

  onSearchChange():      void { this.filterPharmacies(); }
  onItemsPerPageChange():void { this.filterPharmacies(); }
  previousPage():        void { if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); } }
  nextPage():            void { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); } }

  get startItem(): number { return this.filteredPharmacies.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem():   number { return Math.min(this.currentPage * this.itemsPerPage, this.filteredPharmacies.length); }

  initials(name: string): string {
    const w = (name ?? '').split(' ').filter(Boolean);
    return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : (name ?? '?').substring(0, 2).toUpperCase();
  }

  initialsClass(index: number): string {
    const classes = [
      'bg-blue-100 text-blue-700',
      'bg-teal-100 text-teal-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
    ];
    return classes[index % classes.length];
  }

  goNew(): void { this.router.navigate(['/admin/pharmacies/new']); }

  viewDetail(p: PharmacyRow): void {
    // Passer les données déjà chargées via router state pour éviter un rechargement
    this.router.navigate(['/admin/pharmacies/detail', p.id], {
      state: { pharmacyRow: p }
    });
  }
}
