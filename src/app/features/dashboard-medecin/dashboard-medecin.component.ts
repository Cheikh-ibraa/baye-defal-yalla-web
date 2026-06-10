import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  MedicalService,
  DoctorDashboard,
  Appointment,
  Prescription,
  StatusCount,
  WeeklyChartPoint,
} from '../../core/services/medical.service';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  iconColor: string;
  trend?: string;
  trendValue?: string;
  loading?: boolean;
}

interface OrdonnanceDisplay {
  reference: string;
  patient: string;
  date: string;
  statut: string;
  statutClass: string;
}

interface RendezVous {
  day: string;
  month: string;
  patient: string;
  type: string;
  status: string;
  statusLabel: string;
}

@Component({
  selector: 'app-dashboard-medecin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-medecin.component.html'
})
export class DashboardMedecinComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('medicamentChart') medicamentChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyChart') weeklyChart!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  weeklyChartInstance: Chart | null = null;
  selectedPeriod: string = 'Cette semaine';

  statsCards: StatCard[] = [
    { title: 'Ordonnances', value: 0, subtitle: 'Total', icon: 'document', iconColor: 'text-white', loading: true },
    { title: "Ordonnances du jour", value: 0, subtitle: 'vs hier', icon: 'calendar', iconColor: 'text-white', trend: 'up', trendValue: '0%', loading: true },
    { title: 'En attente de validation', value: 0, subtitle: 'Soumises au don', icon: 'hourglass', iconColor: 'text-white', loading: true },
    { title: 'Validées (7j)', value: 0, subtitle: 'Taux de validation 0%', icon: 'check', iconColor: 'text-green-500', loading: true },
  ];

  dernieresOrdonnances: OrdonnanceDisplay[] = [];
  prochainsRendezVous: RendezVous[] = [];
  statusDistribution: StatusCount[] = [];
  weeklyData: WeeklyChartPoint[] = [];

  isLoading = true;
  loadingOrdonnances = true;
  loadingStats = true;
  loadingWeeklyChart = true;
  loadingAppointments = true;
  error = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(private medicalService: MedicalService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chart?.destroy();
    this.weeklyChartInstance?.destroy();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.error = false;

    this.medicalService.getDoctorDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DoctorDashboard) => {
          this.applyStats(data.stats);
          this.applyRecentPrescriptions(data.recentPrescriptions);
          this.applyAppointments(data.upcomingAppointments);
          this.statusDistribution = data.statusDistribution;
          this.weeklyData = data.weeklyChart;
          this.isLoading = false;

          // Construire les graphiques après rendu Angular
          setTimeout(() => {
            this.createWeeklyChart(data.weeklyChart);
            this.createStatsChart(data.statusDistribution);
          }, 150);
        },
        error: (err) => {
          console.error('[DASHBOARD] Erreur:', err);
          this.error = true;
          this.errorMessage = 'Impossible de charger le tableau de bord.';
          this.isLoading = false;
          this.statsCards.forEach(c => c.loading = false);
        }
      });
  }

  private applyStats(stats: DoctorDashboard['stats']): void {
    this.statsCards[0].value = stats.totalPrescriptions;
    this.statsCards[0].loading = false;
    this.statsCards[1].value = stats.todayPrescriptions;
    this.statsCards[1].loading = false;
    this.statsCards[2].value = stats.pendingValidation;
    this.statsCards[2].loading = false;
    this.statsCards[3].value = stats.validatedLast7;
    this.statsCards[3].subtitle = `Taux de validation ${stats.validationRate}%`;
    this.statsCards[3].loading = false;
    this.loadingStats = false;
    this.loadingWeeklyChart = false;
  }

  exportData(): void {
    console.log('[DASHBOARD] Export — à implémenter');
  }

  private applyRecentPrescriptions(prescriptions: Prescription[]): void {
    this.loadingOrdonnances = false;
    this.dernieresOrdonnances = prescriptions.map(p => ({
      reference: p.reference || `ORD-${p.id.substring(0, 4).toUpperCase()}`,
      patient: `Patient #${p.patientId.substring(0, 6).toUpperCase()}`,
      date: this.formatDate(p.createdAt),
      statut: this.getStatusLabel(p.status),
      statutClass: this.getStatusClass(p.status),
    }));
  }

  private applyAppointments(appointments: Appointment[]): void {
    this.loadingAppointments = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.prochainsRendezVous = appointments
      .filter(a => new Date(a.appointmentDate) >= today)
      .slice(0, 3)
      .map(a => {
        const d = new Date(a.appointmentDate);
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
        return {
          day: d.getDate().toString().padStart(2, '0'),
          month: months[d.getMonth()],
          patient: `Patient #${a.patientId.substring(0, 6).toUpperCase()}`,
          type: a.reason,
          status: this.mapAppointmentStatus(a.status),
          statusLabel: this.getAppointmentStatusLabel(a.status),
        };
      });
  }

  // === Graphiques ===

  createWeeklyChart(weeklyData: WeeklyChartPoint[]): void {
    if (!this.weeklyChart?.nativeElement) return;
    this.weeklyChartInstance?.destroy();

    const ctx = this.weeklyChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Construire les 7 derniers jours
    const labels: string[] = [];
    const values: number[] = [];
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const label = i === 0 ? 'Auj' : days[d.getDay()];
      labels.push(label);

      // Chercher dans weeklyData si ce jour a des consultations
      const isoDay = d.toISOString().split('T')[0];
      const match = weeklyData.find(w => w.day?.startsWith(isoDay));
      values.push(match ? parseInt(match.count) : 0);
    }

    const verticalLinePlugin = {
      id: 'verticalLine',
      afterDatasetsDraw: (chart: any) => {
        const { ctx, scales: { x, y } } = chart;
        const xPos = x.getPixelForValue(6);
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(xPos, y.top);
        ctx.lineTo(xPos, y.bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#10B981';
        ctx.stroke();
        ctx.restore();
      }
    };

    this.weeklyChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Consultations',
          data: values,
          borderColor: '#4A90E2',
          backgroundColor: 'transparent',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#4A90E2',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#1f2937',
            bodyColor: '#1f2937',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: { label: (c) => `${c.parsed.y} consultations` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 12 } } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 5, color: '#6b7280', font: { size: 11 } },
            grid: { color: '#e5e7eb' }
          }
        }
      },
      plugins: [verticalLinePlugin]
    });
  }

  createStatsChart(statusData: StatusCount[]): void {
    if (!this.medicamentChart?.nativeElement) return;
    this.chart?.destroy();

    const ctx = this.medicamentChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const statusLabels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT_TO_PATIENT: 'Envoyée',
      SUBMITTED_FOR_DONATION: 'En don',
      FULLY_FUNDED: 'Financée',
      QR_GENERATED: 'QR Généré',
      IN_PROGRESS: 'En cours',
      DELIVERED: 'Livrée',
    };

    const order = ['DRAFT', 'SENT_TO_PATIENT', 'SUBMITTED_FOR_DONATION', 'FULLY_FUNDED', 'QR_GENERATED', 'IN_PROGRESS', 'DELIVERED'];
    const sorted = order
      .map(s => statusData.find(d => d.status === s))
      .filter(Boolean) as StatusCount[];

    const labels = sorted.map(d => statusLabels[d.status] || d.status);
    const values = sorted.map(d => parseInt(d.count));

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Nombre',
          data: values,
          backgroundColor: '#10b981',
          borderRadius: 4,
          barThickness: 20,
          maxBarThickness: 25,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#1f2937',
            bodyColor: '#1f2937',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            callbacks: { label: (c) => `${c.parsed.x} ordonnances` }
          }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, color: '#6b7280', font: { size: 11 } }, grid: { color: '#f3f4f6' } },
          y: { ticks: { color: '#374151', font: { size: 12, weight: 'bold' } }, grid: { display: false } }
        }
      }
    });
  }

  // === Utilitaires ===

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT_TO_PATIENT: 'Envoyée',
      SUBMITTED_FOR_DONATION: 'En don',
      FULLY_FUNDED: 'Financée',
      QR_GENERATED: 'QR Généré',
      IN_PROGRESS: 'En préparation',
      DELIVERED: 'Livrée',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SENT_TO_PATIENT: 'bg-blue-100 text-blue-700',
      SUBMITTED_FOR_DONATION: 'bg-yellow-100 text-yellow-700',
      FULLY_FUNDED: 'bg-green-100 text-green-700',
      QR_GENERATED: 'bg-purple-100 text-purple-700',
      IN_PROGRESS: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-teal-100 text-teal-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  private mapAppointmentStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed',
    };
    return map[status] || 'pending';
  }

  getAppointmentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmé',
      CANCELLED: 'Annulé',
      COMPLETED: 'Terminé',
    };
    return map[status] || 'À venir';
  }

  formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period;
  }

  retry(): void {
    this.error = false;
    this.errorMessage = '';
    this.loadDashboard();
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }
}
