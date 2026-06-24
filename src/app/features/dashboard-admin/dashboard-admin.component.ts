import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

interface StatsCard {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon: string;
  iconColor: string;
  loading?: boolean;
}

interface Activity {
  type: 'warning' | 'success' | 'info';
  title: string;
  subtitle: string;
  time: string;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statisticsChart') statisticsChartRef!: ElementRef<HTMLCanvasElement>;

  selectedPeriod = 'Ce mois';
  loadingStats = true;

  statsCards: StatsCard[] = [
    { title: 'Utilisateurs totaux', value: '—', subtitle: 'Chargement...', icon: 'users',     iconColor: 'bg-white-50 text-black-500 shadow sm', loading: true },
    { title: 'Ordonnances totales', value: '—', subtitle: 'Chargement...', icon: 'document',  iconColor: 'bg-white-50 text-blue-500 shadow sm',  loading: true },
    { title: 'Livraisons réussies', value: '—', subtitle: 'Chargement...', icon: 'check',     iconColor: 'bg-white-50 text-green-500 shadow sm', loading: true },
    { title: 'Médecins actifs',     value: '—', subtitle: 'Chargement...', icon: 'med',       iconColor: 'bg-white-50 text-blue-500 shadow sm',  loading: true },
    { title: 'Dons reçus',          value: '—', subtitle: 'Chargement...', icon: 'heart',     iconColor: 'bg-white-50 text-red-500 shadow sm',   loading: true },
    { title: 'Pharmacies actives',  value: '—', subtitle: 'Chargement...', icon: 'pharmacie', iconColor: 'bg-white-50 text-blue-500 shadow sm',  loading: true },
  ];

  activities: Activity[] = [];

  readonly regionLabels = ['Dakar', 'Thiès', 'Saint-Louis', 'Diourbel'];
  readonly regionTicks  = [0, 15, 30, 45];

  hopitalChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.regionLabels,
    datasets: [{
      data: [42, 28, 14, 27],
      backgroundColor: '#4FC3F7',
      borderRadius: 20,
      borderSkipped: false,
      barThickness: 22,
    }],
  };

  pharmacieChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.regionLabels,
    datasets: [{
      data: [45, 22, 29, 18],
      backgroundColor: '#11458B',
      borderRadius: 20,
      borderSkipped: false,
      barThickness: 22,
    }],
  };

  readonly regionChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.75)',
        padding: 8,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 45,
        ticks: {
          stepSize: 15,
          color: '#9CA3AF',
          font: { size: 11 },
        },
        grid: {
          color: '#E5E7EB',
          lineWidth: 1,
        },
        border: { display: false, dash: [4, 4] },
      },
      y: {
        ticks: { color: '#4B5563', font: { size: 12 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  private statisticsChart: Chart | null = null;
  private chartLabels: string[] = [];
  private chartData: number[] = [];

  private readonly api = environment.baseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.statisticsChart) {
      this.statisticsChart.destroy();
      this.statisticsChart = null;
    }
  }

  private loadDashboard(): void {
    forkJoin({
      main:     this.http.get<any>(`${this.api}/admin/dashboard`),
      payments: this.http.get<any>(`${this.api}/admin/payments/dashboard`),
    }).subscribe({
      next: ({ main, payments }) => {
        this.applyStats(main, payments);
        this.applyActivities(main.recentActivity ?? []);
        this.chartLabels = (main.monthlyEvolution ?? []).map((m: any) => m.month);
        this.chartData   = (main.monthlyEvolution ?? []).map((m: any) => m.count);
        this.loadingStats = false;
        setTimeout(() => this.initStatisticsChart(), 50);
      },
      error: () => {
        this.loadingStats = false;
        this.statsCards.forEach(c => { c.loading = false; c.value = '—'; c.subtitle = 'Erreur de chargement'; });
      },
    });
  }

  private applyStats(main: any, payments: any): void {
    const u  = main.users         ?? {};
    const p  = main.prescriptions ?? {};
    const ph = main.pharmacies    ?? {};

    const fmt = (n: number | undefined) => (n != null ? n.toLocaleString('fr-FR') : '—');

    const dons = payments?.donationsReceived ?? 0;
    const donsFmt = dons >= 1_000_000
      ? `${(dons / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`
      : dons >= 1_000
      ? `${Math.round(dons / 1_000)} k FCFA`
      : `${fmt(dons)} FCFA`;

    this.statsCards = [
      {
        title: 'Utilisateurs totaux',
        value: fmt(u.total),
        subtitle: u.newThisMonth != null ? `+ ${fmt(u.newThisMonth)} ce mois` : 'Total inscriptions',
        icon: 'users',
        iconColor: 'bg-white-50 text-black-500 shadow sm',
        loading: false,
      },
      {
        title: 'Ordonnances totales',
        value: fmt(p.total),
        subtitle: p.thisMonth != null ? `+ ${fmt(p.thisMonth)} ce mois` : 'Total ordonnances',
        icon: 'document',
        iconColor: 'bg-white-50 text-blue-500 shadow sm',
        loading: false,
      },
      {
        title: 'Livraisons réussies',
        value: fmt(p.delivered),
        subtitle: 'Total livraisons',
        icon: 'check',
        iconColor: 'bg-white-50 text-green-500 shadow sm',
        loading: false,
      },
      {
        title: 'Médecins actifs',
        value: fmt(u.activeDoctors),
        subtitle: u.doctors != null ? `${fmt(u.doctors)} inscrits` : 'Total médecins',
        icon: 'med',
        iconColor: 'bg-white-50 text-blue-500 shadow sm',
        loading: false,
      },
      {
        title: 'Dons reçus',
        value: donsFmt,
        subtitle: payments?.donorCount != null ? `${payments.donorCount} donateurs` : 'Total dons',
        icon: 'heart',
        iconColor: 'bg-white-50 text-red-500 shadow sm',
        loading: false,
      },
      {
        title: 'Pharmacies actives',
        value: fmt(ph.active ?? u.activePharmacies),
        subtitle: (ph.total ?? u.pharmacists) != null ? `${fmt(ph.total ?? u.pharmacists)} enregistrées` : 'Total pharmacies',
        icon: 'pharmacie',
        iconColor: 'bg-white-50 text-blue-500 shadow sm',
        loading: false,
      },
    ];
  }

  private applyActivities(recentActivity: any[]): void {
    const roleType: Record<string, 'warning' | 'success' | 'info'> = {
      doctor:               'success',
      pharmacist:           'success',
      hospital:             'info',
      'lab-technician':     'info',
      radiologist:          'info',
      'donor-individual':   'success',
      'donor-organization': 'success',
      patient:              'info',
    };

    this.activities = recentActivity.slice(0, 6).map(a => ({
      type:     roleType[a.type] ?? 'info',
      title:    a.label ?? a.type ?? 'Activité',
      subtitle: a.name  ?? a.email ?? '',
      time:     this.timeAgo(a.time),
    }));
  }

  private timeAgo(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const min  = Math.floor(diff / 60_000);
    if (min < 1)   return 'À l\'instant';
    if (min < 60)  return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)    return `Il y a ${h} heure${h > 1 ? 's' : ''}`;
    const d = Math.floor(h / 24);
    if (d < 7)     return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  private initStatisticsChart(): void {
    if (!this.statisticsChartRef?.nativeElement) return;
    const ctx = this.statisticsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.statisticsChart) { this.statisticsChart.destroy(); }

    this.statisticsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Nouveaux inscrits',
            data: this.chartData,
            backgroundColor: '#104382',
            borderColor: '#104382',
            borderWidth: 1,
            borderRadius: 0,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 20,
              usePointStyle: false,
              boxWidth: 12,
              boxHeight: 12,
              font: { size: 13, weight: 500, family: 'Inter, system-ui, sans-serif' },
              color: '#000',
              generateLabels: (chart: any) => {
                return chart.data.datasets.map((dataset: any, i: number) => ({
                  text:         dataset.label ?? '',
                  fillStyle:    dataset.backgroundColor,
                  strokeStyle:  dataset.borderColor,
                  lineWidth:    1,
                  hidden:       !chart.isDatasetVisible(i),
                  datasetIndex: i,
                }));
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 4,
            padding: 10,
            displayColors: true,
            titleFont: { size: 13 },
            bodyFont:  { size: 12 },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#6B7280', font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#E5E7EB', drawTicks: false },
            border: { display: false },
            ticks: {
              color: '#6B7280',
              font: { size: 11 },
              padding: 8,
              stepSize: 1,
            },
          },
        },
      },
    });
  }

  refreshDashboard(): void {
    this.loadingStats = true;
    this.statsCards.forEach(c => { c.loading = true; });
    this.loadDashboard();
  }

  exportData(): void {
    console.log('Export des données...');
    alert('Fonction d\'export en cours de développement');
  }
}
