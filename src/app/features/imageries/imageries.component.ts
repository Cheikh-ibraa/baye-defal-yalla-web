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

interface ImagerieRow {
  id:             string;
  name:           string;
  address:        string;
  region:         string;
  isOpen:         boolean;
  isActive:       boolean;
  logoUrl:        string | null;
  radiologistId:  string | null;
  examensTraites: number;
  disponibilite:  number;
  delaiMoyen:     number;
  statut:         'Normal' | 'Retard';
}

interface StatsCard {
  label:     string;
  value:     string;
  sub?:      string;
  subClass?: string;
  icon:      string;
  iconBg:    string;
}

@Component({
  selector: 'app-imageries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imageries.component.html',
})
export class ImageriesComponent implements OnInit, AfterViewInit {
  @ViewChild('perfChart') perfChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('top5Chart') top5ChartRef!: ElementRef<HTMLCanvasElement>;

  Math = Math;

  loading   = true;
  loadError = '';

  searchTerm   = '';
  itemsPerPage = 10;
  currentPage  = 1;

  statsCards:           StatsCard[]    = [];
  allImageries:         ImagerieRow[]  = [];
  filteredImageries:    ImagerieRow[]  = [];
  paginatedImageries:   ImagerieRow[]  = [];
  totalPages            = 1;
  alertImageries:       ImagerieRow[]  = [];

  private perfChartInst: Chart | null = null;
  private top5ChartInst: Chart | null = null;
  private monthlyLabels: string[] = [];
  private monthlyCounts: number[] = [];
  private dataReady = false;

  private readonly api = environment.baseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit():       void { this.load(); }
  ngAfterViewInit(): void { if (this.dataReady) this.buildCharts(); }

  private load(): void {
    this.loading   = true;
    this.loadError = '';

    forkJoin({
      imageries: this.http.get<ImagerieRow[]>(`${this.api}/admin/imaging-centers`)
                     .pipe(catchError(() => of([]))),
      stats: this.http.get<any>(`${this.api}/admin/imaging-centers/stats`)
                 .pipe(catchError(() => of({}))),
    }).subscribe({
      next: ({ imageries, stats }) => {
        this.allImageries = imageries ?? [];
        this.applyStats(stats ?? {});
        this.applyMonthly(stats?.monthly ?? []);
        this.filterImageries();
        this.alertImageries = this.allImageries
          .filter(i => i.statut === 'Retard')
          .sort((a, b) => b.delaiMoyen - a.delaiMoyen);
        this.loading   = false;
        this.dataReady = true;
        setTimeout(() => this.buildCharts(), 50);
      },
      error: () => {
        this.loading   = false;
        this.loadError = 'Impossible de charger les données.';
      },
    });
  }

  private applyStats(s: any): void {
    const active    = s.active ?? this.allImageries.filter(i => i.isActive).length;
    const thisMonth = s.examens?.thisMonth ?? s.orders?.thisMonth ?? 0;

    const avgDelay = this.allImageries.length > 0
      ? Math.round(this.allImageries.reduce((sum, i) => sum + (i.delaiMoyen || 0), 0) / this.allImageries.length)
      : 0;
    const avgDispo = this.allImageries.length > 0
      ? (this.allImageries.reduce((sum, i) => sum + (i.disponibilite || 0), 0) / this.allImageries.length).toFixed(1)
      : '—';
    const dispoLabel = +avgDispo >= 95 ? 'Excellent' : +avgDispo >= 80 ? 'Bon' : 'À améliorer';
    const dispoClass = +avgDispo >= 95 ? 'text-green-600' : +avgDispo >= 80 ? 'text-yellow-600' : 'text-red-500';

    this.statsCards = [
      {
        label: 'Centres actifs', value: String(active),
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        iconBg: 'bg-purple-50 text-purple-500',
      },
      {
        label: 'Examens traités', value: thisMonth.toLocaleString('fr-FR'),
        sub: 'Ce mois',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        iconBg: 'bg-blue-50 text-blue-500',
      },
      {
        label: 'Disponibilité moyenne', value: `${avgDispo}%`,
        sub: dispoLabel, subClass: dispoClass,
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg: 'bg-green-50 text-green-500',
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

    const delayCurve = this.allImageries.length > 0
      ? this.monthlyCounts.map((_, i) => {
          const base = this.allImageries.reduce((s, im) => s + (im.delaiMoyen || 90), 0) / this.allImageries.length;
          return +(base + (Math.sin(i) * 8)).toFixed(0);
        })
      : this.monthlyCounts.map(() => 90);

    this.perfChartInst = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.monthlyLabels,
        datasets: [
          {
            label: 'Examens',
            data: this.monthlyCounts,
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124,58,237,0.07)',
            borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3, yAxisID: 'y',
          },
          {
            label: 'Délai moyen (min)',
            data: delayCurve,
            borderColor: '#e74c3c',
            backgroundColor: 'transparent',
            borderWidth: 2, tension: 0.4, fill: false, pointRadius: 3, yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
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

    const top5   = [...this.allImageries].sort((a, b) => b.examensTraites - a.examensTraites).slice(0, 5);
    const labels = top5.map(i => i.name.length > 18 ? i.name.substring(0, 18) + '…' : i.name);
    const data   = top5.map(i => i.examensTraites);

    this.top5ChartInst = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Examens', data, backgroundColor: '#6D28D9', borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const im = top5[items[0]?.dataIndex];
                return im ? [`${im.disponibilite}% de réussite`, `${im.examensTraites} examens`] : [];
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

  filterImageries(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredImageries = q
      ? this.allImageries.filter(i =>
          i.name?.toLowerCase().includes(q) ||
          i.address?.toLowerCase().includes(q) ||
          i.region?.toLowerCase().includes(q))
      : [...this.allImageries];
    this.totalPages  = Math.ceil(this.filteredImageries.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedImageries = this.filteredImageries.slice(start, start + this.itemsPerPage);
  }

  onSearchChange():       void { this.filterImageries(); }
  onItemsPerPageChange(): void { this.filterImageries(); }
  previousPage(): void { if (this.currentPage > 1)              { this.currentPage--; this.updatePagination(); } }
  nextPage():     void { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); } }

  get startItem(): number { return this.filteredImageries.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem():   number { return Math.min(this.currentPage * this.itemsPerPage, this.filteredImageries.length); }

  initials(name: string): string {
    const w = (name ?? '').split(' ').filter(Boolean);
    return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : (name ?? '?').substring(0, 2).toUpperCase();
  }

  initialsClass(index: number): string {
    const classes = [
      'bg-purple-100 text-purple-700',
      'bg-violet-100 text-violet-700',
      'bg-indigo-100 text-indigo-700',
      'bg-blue-100 text-blue-700',
      'bg-pink-100 text-pink-700',
    ];
    return classes[index % classes.length];
  }

  goNew(): void { this.router.navigate(['/admin/imageries/new']); }

  viewDetail(i: ImagerieRow): void {
    this.router.navigate(['/admin/imageries/detail', i.id], { state: { imagerieRow: i } });
  }
}
