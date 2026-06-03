import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  ChartConfiguration
} from 'chart.js';

import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Inline response type for dashboard (replace DashboardLaboratoireService dependency)
interface DashboardLaboratoireResponse {
  monthlyRequests: { [key: string]: number };
  requestsByStatus: { [key: string]: number };
  requestsByType: { [key: string]: number };
  requestsByUrgency: { [key: string]: number };
  // Additional counts used in template
  totalRequests?: number;
  pendingRequests?: number;
  urgentRequests?: number;
  completedRequests?: number;
  youngPatients?: number;
}

import { Laboratoire } from '../../modele/laboratoir';

// =====================
// Chart.js register
// =====================
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

type ChartLoadingState = 'idle' | 'loading' | 'success' | 'error';

interface UserLocal { id: number; [key: string]: any }

@Component({
  selector: 'app-dashboard-lab',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard-lab.component.html',
  styleUrl: './dashboard-lab.component.css'
})
export class DashboardLabComponent implements OnInit, OnDestroy {

  // =====================
  // USER
  // =====================
  currentUser: UserLocal | null = null;

  // =====================
  // DASHBOARD DATA
  // =====================
  dashboardData: DashboardLaboratoireResponse | null = null;

  // =====================
  // STATES
  // =====================
  dashboardLoading: ChartLoadingState = 'idle';
  planningLoading: ChartLoadingState = 'idle';

  monthlyChartState: ChartLoadingState = 'idle';
  statusChartState: ChartLoadingState = 'idle';
  typeChartState: ChartLoadingState = 'idle';
  urgencyChartState: ChartLoadingState = 'idle';

  // =====================
  // PLANNING
  // =====================
  examens: Laboratoire[] = [];

  // =====================
  // CHARTS
  // =====================
  private monthlyChart?: Chart;
  private statusChart?: Chart;
  private typeChart?: Chart;
  private urgencyChart?: Chart;

  constructor(
    private router: Router,
    
  ) {}

  // =====================
  // INIT
  // =====================
  ngOnInit(): void {
    console.log('🧪 [LAB] Dashboard init');
    const user = this.getMockCurrentUser();
    console.log('👤 [AUTH MOCK] currentUser =', user);

    this.currentUser = user;

    if (user) {
      console.log('✅ [AUTH MOCK] User détecté → chargement dashboard');
      this.loadDashboard(user.id);
      this.loadPlanningDuJour();
    } else {
      console.warn('⚠️ [AUTH MOCK] Aucun utilisateur connecté');
    }
  }

  // =====================
  // DESTROY
  // =====================
  ngOnDestroy(): void {
    console.log('🧹 [LAB] Destroy dashboard');
    this.destroyCharts();
  }

  private destroyCharts(): void {
    console.log('🧹 Destruction des graphiques');
    this.monthlyChart?.destroy();
    this.statusChart?.destroy();
    this.typeChart?.destroy();
    this.urgencyChart?.destroy();
  }

  // =====================
  // DASHBOARD API
  // =====================
  loadDashboard(laboratoryId: number): void {
    console.log('📡 [API] loadDashboard → laboratoryId =', laboratoryId);

    this.dashboardLoading = 'loading';
    this.monthlyChartState = 'loading';
    this.statusChartState = 'loading';
    this.typeChartState = 'loading';
    this.urgencyChartState = 'loading';

    this.localGetDashboard(laboratoryId).subscribe({
      next: (data) => {
        console.log('📊 [API MOCK] Dashboard response =', data);

        this.dashboardData = data;
        this.dashboardLoading = 'success';

        this.destroyCharts();

        console.log('📈 Création graphiques (mock)...');
        this.createMonthlyChart(data.monthlyRequests);
        this.createStatusChart(data.requestsByStatus);
        this.createTypeChart(data.requestsByType);
        this.createUrgencyChart(data.requestsByUrgency);
      },
      error: (err: any) => {
        console.error('❌ [API MOCK] Dashboard error', err);
        this.dashboardLoading = 'error';
      }
    });
  }

  // =====================
  // DATE FORMAT
  // =====================
  private getTodayDate(): string {
    const d = new Date();
    const date = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    console.log('📅 Date du jour =', date);
    return date;
  }

  // =====================
  // PLANNING DU JOUR
  // =====================
  loadPlanningDuJour(): void {
    console.log('📡 [API] loadPlanningDuJour');

    this.planningLoading = 'loading';
    const today = this.getTodayDate();

    this.localGetAllAnalysisRequests().subscribe({
      next: (res: any) => {
        console.log('📋 [API MOCK] Planning brut =', res);

        this.examens = (res.content || res).filter((e: Laboratoire) =>
          e.status === 'ACCEPTED' &&
          e.appointmentDate === today
        );

        console.log('📅 Planning filtré (mock) =', this.examens);
        this.planningLoading = 'success';
      },
      error: (err: any) => {
        console.error('❌ [API MOCK] Planning error', err);
        this.planningLoading = 'error';
      }
    });
  }

  // ===== Local mocks =====
  private localGetDashboard(_laboratoryId: number) {
    const mock: DashboardLaboratoireResponse = {
      monthlyRequests: { '1': 5, '2': 8, '3': 12 },
      requestsByStatus: { PENDING: 3, ACCEPTED: 10, COMPLETED: 12 },
      requestsByType: { 'Blood Test': 10, 'X-Ray': 8 },
      requestsByUrgency: { NORMAL: 18, URGENT: 7 }
    };
    return of(mock).pipe(delay(200));
  }

  // Local mock for current user
  private getMockCurrentUser(): UserLocal {
    return { id: 1, prenom: 'Lab', nom: 'Demo' } as UserLocal;
  }

  private localGetAllAnalysisRequests() {
    const mock = {
      content: [
        { id: 1, patientName: 'Alice', status: 'ACCEPTED', appointmentDate: this.getTodayDate() },
        { id: 2, patientName: 'Bob', status: 'PENDING', appointmentDate: this.getTodayDate() }
      ]
    };
    return of(mock).pipe(delay(150));
  }

  // =====================
  // CHARTS
  // =====================

  private createMonthlyChart(data: { [key: string]: number }): void {
    console.log('📈 [LABO] Monthly chart raw data:', data);
    this.monthlyChartState = 'loading';

    try {
      const labels = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
      const values = labels.map((_, i) => data?.[(i + 1).toString()] ?? 0);

      console.log('📈 [LABO] Monthly values:', values);

      const config: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              data: values,
              borderColor: 'rgba(44, 123, 229, 0.25)',
              borderWidth: 8,
              tension: 0.45,
              pointRadius: 0,
              fill: false
            },
            {
              label: 'Analyses',
              data: values,
              borderColor: '#2C7BE5',
              borderWidth: 3,
              tension: 0.45,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#2C7BE5',
              pointBorderWidth: 2,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111827',
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (ctx) => `${ctx.parsed.y} analyses`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#6B7280', font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,0.06)' },
              border: { display: false }
            },
            x: {
              ticks: { color: '#6B7280', font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,0.04)' },
              border: { display: false }
            }
          }
        }
      };

      this.monthlyChart?.destroy();
      this.monthlyChart = new Chart('monthlyChart', config);
      this.monthlyChartState = 'success';

      console.log('✅ [LABO] Monthly chart created');
    } catch (e) {
      console.error('❌ [LABO] Monthly chart error', e);
      this.monthlyChartState = 'error';
    }
  }




  private createStatusChart(data: { [key: string]: number }): void {
    console.log('🥧 [LABO] Status chart raw data:', data);
    this.statusChartState = 'loading';

    try {
      const statusLabels: any = {
        PENDING: 'En attente',
        ACCEPTED: 'Accepté',
        COMPLETED: 'Terminé',
        CANCELLED: 'Annulé'
      };

      const statusColors: any = {
        PENDING: '#2C7BE5',
        ACCEPTED: '#00B894',
        COMPLETED: '#F59E0B',
        CANCELLED: '#8B5CF6'
      };

      const keys = Object.keys(data || {});
      console.log('🥧 [LABO] Status keys:', keys);

      const labels = keys.map(k => statusLabels[k] || k);
      const values = keys.map(k => data[k]);
      const colors = keys.map(k => statusColors[k] || '#ccc');

      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '0%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 16, padding: 20 }
            },
            tooltip: {
              backgroundColor: '#111827',
              callbacks: {
                label: (ctx) => `${ctx.parsed} analyses`
              }
            }
          }
        }
      };

      this.statusChart?.destroy();
      this.statusChart = new Chart('statusChart', config);
      this.statusChartState = 'success';

      console.log('✅ [LABO] Status chart created');
    } catch (e) {
      console.error('❌ [LABO] Status chart error', e);
      this.statusChartState = 'error';
    }
  }







    // =====================
    // GRAPHIQUE PAR TYPE
    // =====================
    private createTypeChart(data: { [key: string]: number }): void {
    console.log('📊 [LABO] Type chart raw data:', data);
    this.typeChartState = 'loading';

    try {
      if (!data || Object.keys(data).length === 0) {
        console.warn('⚠️ [LABO] No type data');
        this.typeChartState = 'error';
        return;
      }

      const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
      const labels = entries.map(e => e[0]);
      const values = entries.map(e => e[1]);

      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Analyses',
            data: values,
            backgroundColor: 'rgba(44,123,229,0.8)',
            borderColor: '#2C7BE5',
            borderWidth: 2,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: labels.length > 5 ? 'y' : 'x',
          plugins: { legend: { display: false } }
        }
      };

      this.typeChart?.destroy();
      this.typeChart = new Chart('typeChart', config);
      this.typeChartState = 'success';

      console.log('✅ [LABO] Type chart created');
    } catch (e) {
      console.error('❌ [LABO] Type chart error', e);
      this.typeChartState = 'error';
    }
  }


    // =====================
    // GRAPHIQUE PAR RÉGION
    // =====================
   private createUrgencyChart(data: { [key: string]: number }): void {
    console.log('🚨 [LABO] Urgency chart raw data:', data);
    this.urgencyChartState = 'loading';

    try {
      if (!data || Object.keys(data).length === 0) {
        console.warn('⚠️ [LABO] No urgency data');
        this.urgencyChartState = 'error';
        return;
      }

      const labels = Object.keys(data);
      const values = Object.values(data);

      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Analyses',
            data: values,
            backgroundColor: 'rgba(239,68,68,0.8)',
            borderColor: '#EF4444',
            borderWidth: 2,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      };

      this.urgencyChart?.destroy();
      this.urgencyChart = new Chart('urgencyChart', config);
      this.urgencyChartState = 'success';

      console.log('✅ [LABO] Urgency chart created');
    } catch (e) {
      console.error('❌ [LABO] Urgency chart error', e);
      this.urgencyChartState = 'error';
    }
  }


  // =====================
  // NAVIGATION
  // =====================
  viewExamDetails(exam: Laboratoire): void {
    console.log('➡️ Navigation détail examen =', exam);
    this.router.navigate(['/examens'], {
      queryParams: { examId: exam.id }
    });
  }

  viewAllExams(): void {
    console.log('➡️ Navigation tous les examens');
    this.router.navigate(['/examens']);
  }

  // =====================
  // HELPERS
  // =====================
  getInitials(name: string): string {
    const initials = name
      ?.split(' ')
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    console.log('🔤 Initiales =', initials);
    return initials;
  }

  getInitialsColor(initials: string): string {
    const colors = ['bg-blue-500','bg-purple-500','bg-pink-500','bg-indigo-500','bg-teal-500'];
    const color = colors[initials.charCodeAt(0) % colors.length];
    return color;
  }
}
