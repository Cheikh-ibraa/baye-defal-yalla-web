import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

interface DashboardData {
  totalPatients:   number;
  pendingRequests: number;
  urgentCases:     number;
  totalCollected:  number;
  recentActivity:  { type: string; description: string; date: string }[];
  monthlyChart:    { month: string; count: number }[];
  viewByService:   { service: string; count: number }[];
}

const SERVICE_ICONS: Record<string, string> = {
  pharmacy:   'pharmacy',
  pharmacie:  'pharmacy',
  laboratory: 'laboratory',
  laboratoire:'laboratory',
  imagerie:           'imagerie',
  'imagerie médicale':'imagerie',
  chirurgie:          'imagerie',
};

const SERVICE_COLORS: string[] = [
  'bg-blue-900','bg-blue-500','bg-blue-400','bg-teal-500','bg-indigo-500',
];

@Component({
  selector: 'app-dashboard-hospital',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-hospital.component.html',
  styleUrls: ['./dashboard-hospital.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHospitalComponent implements OnInit {

  loading   = true;
  loadError = '';

  totalPatients   = 0;
  pendingRequests = 0;
  urgentCases     = 0;
  totalCollected  = 0;

  recentActivity: { type: string; description: string; date: string }[] = [];
  viewByService:  { service: string; count: number; progress: number; barClass: string; icon: string }[] = [];

  alertes: { label: string; sub: string }[] = [];

  private readonly api = environment.baseUrl;

  evolutionChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
    datasets: [{
      data: new Array(12).fill(0),
      borderColor: '#2F7BF0',
      backgroundColor: 'rgba(219,234,254,0.7)',
      fill: true,
      tension: 0.42,
      pointRadius: 4,
      pointHoverRadius: 5,
      pointBackgroundColor: '#FFFFFF',
      pointBorderColor: '#2F7BF0',
      pointBorderWidth: 3,
      borderWidth: 3,
    }],
  };

  readonly evolutionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    layout: { padding: { top: 6, right: 12, bottom: 0, left: 0 } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#6B7280', font: { size: 12, weight: 600 }, padding: 14 },
      },
      y: {
        display: false,
        beginAtZero: true,
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.http.get<DashboardData>(`${this.api}/hospital/dashboard`)
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        if (data) this.applyData(data);
        else       this.loadError = 'Impossible de charger le tableau de bord.';
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  private applyData(d: DashboardData): void {
    this.totalPatients   = d.totalPatients;
    this.pendingRequests = d.pendingRequests;
    this.urgentCases     = d.urgentCases;
    this.totalCollected  = d.totalCollected;
    this.recentActivity  = d.recentActivity ?? [];

    // Graphique mensuel
    if (d.monthlyChart?.length) {
      this.evolutionChartData = {
        ...this.evolutionChartData,
        labels:   d.monthlyChart.map(m => m.month),
        datasets: [{
          ...this.evolutionChartData.datasets[0],
          data: d.monthlyChart.map(m => m.count),
        }],
      };
    }

    // Vue par service
    const maxCount = Math.max(1, ...d.viewByService.map(s => s.count));
    this.viewByService = d.viewByService.map((s, i) => ({
      service:  s.service,
      count:    s.count,
      progress: Math.round((s.count / maxCount) * 100),
      barClass: SERVICE_COLORS[i % SERVICE_COLORS.length],
      icon:     SERVICE_ICONS[s.service.toLowerCase()] ?? 'pharmacy',
    }));

    // Alertes dynamiques
    this.alertes = [];
    if (d.pendingRequests > 0) {
      this.alertes.push({
        label: `${d.pendingRequests} demande${d.pendingRequests > 1 ? 's' : ''} en attente de validation`,
        sub: 'À traiter pour assurer la continuité des soins',
      });
    }
    if (d.urgentCases > 0) {
      this.alertes.push({
        label: `${d.urgentCases} cas critique${d.urgentCases > 1 ? 's' : ''} actif${d.urgentCases > 1 ? 's' : ''}`,
        sub: 'Patients en statut URGENT',
      });
    }
  }

  formatCollected(amount: number): string {
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
    if (amount >= 1_000)     return (amount / 1_000).toFixed(0) + 'K';
    return amount.toFixed(0);
  }

  activityIcon(type: string): 'admission' | 'validation' | 'payment' {
    if (type === 'admission') return 'admission';
    if (type === 'payment')   return 'payment';
    return 'validation';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min  = Math.floor(diff / 60_000);
    const h    = Math.floor(diff / 3_600_000);
    const d    = Math.floor(diff / 86_400_000);
    if (min < 1)  return 'À l\'instant';
    if (min < 60) return `Il y a ${min} min`;
    if (h   < 24) return `Il y a ${h}h`;
    return `Il y a ${d}j`;
  }

  getProgressWidth(p: number): string { return `${p}%`; }
}
