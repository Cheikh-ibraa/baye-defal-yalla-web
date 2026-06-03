import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// AuthFacade removed — use local mock user
import { User } from '../../../core/auth.types';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Inlined DashboardImagerieResponse (replacing DashboardImagerieService)
interface DashboardImagerieResponse {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  urgentRequests: number;
  youngPatients: number;

  monthlyRequests: {
    [month: string]: number;
  };

  requestsByStatus: {
    CANCELLED: number;
    COMPLETED: number;
    ACCEPTED: number;
    PENDING: number;
  };

  requestsByType: {
    [type: string]: number;
  };

  requestsByRegion: {
    [region: string]: number;
  };
}

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
  ChartConfiguration,
  Filler
} from 'chart.js';
import { FormsModule } from '@angular/forms';
import { Imagerie } from '../../../modele/imagerie.model';

// 🔥 Enregistrement Chart.js
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

@Component({
  selector: 'app-dashboard-imagerie',
  standalone: true,
  imports: [CommonModule,RouterModule,FormsModule],
  templateUrl: './dashboard-imagerie.component.html',
  styleUrl: './dashboard-imagerie.component.css'
})
export class DashboardImagerieComponent implements OnInit, OnDestroy {

  // =====================
  // USER CONNECTÉ
  // =====================
  currentUser: User | null = null;

  // =====================
  // DONNÉES API DASHBOARD
  // =====================
dashboardData: DashboardImagerieResponse | null = null;

  // =====================
  // ÉTATS DE CHARGEMENT
  // =====================
  dashboardLoading: ChartLoadingState = 'idle';
  planningLoading: ChartLoadingState = 'idle';

  monthlyChartState: ChartLoadingState = 'idle';
  statusChartState: ChartLoadingState = 'idle';
  typeChartState: ChartLoadingState = 'idle';
  regionChartState: ChartLoadingState = 'idle';

  // =====================
  // PLANNING DU JOUR
  // =====================
 examens: Imagerie[] = [];


  // =====================
  // CHARTS
  // =====================
  private monthlyChart?: Chart;
  private statusChart?: Chart;
  private typeChart?: Chart;
  private regionChart?: Chart;

  constructor(
    private router: Router,
  ) {}

  // Local mock current user (replaces AuthFacade)
  private getMockCurrentUser(): User {
    return { id: 1, nom: 'Demo', prenom: 'Lab' } as User;
  }

  // =====================
  // INIT
  // =====================
  ngOnInit(): void {
    const user = this.getMockCurrentUser();
    this.currentUser = user;
    console.log('✅ User (mock) :', user);

    if (user) {
      this.loadDashboard(user.id);
      this.loadPlanningDuJour();
    }
  }

  // =====================
  // CLEANUP
  // =====================
  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  private destroyAllCharts(): void {
    this.monthlyChart?.destroy();
    this.statusChart?.destroy();
    this.typeChart?.destroy();
    this.regionChart?.destroy();
  }

  // =====================
  // DASHBOARD API
  // =====================
  loadDashboard(userId: number): void {
    this.dashboardLoading = 'loading';
    this.monthlyChartState = 'loading';
    this.statusChartState = 'loading';
    this.typeChartState = 'loading';
    this.regionChartState = 'loading';

    // Use local mock for dashboard data
    this.localGetDashboard(userId).subscribe({
      next: (data) => {
        console.log('📊 Dashboard (mock) :', data);
        this.dashboardData = data;
        this.dashboardLoading = 'success';

        this.destroyAllCharts();

        this.createMonthlyChart(data.monthlyRequests);
        this.createStatusChart(data.requestsByStatus);
        this.createTypeChart(data.requestsByType);
        this.createRegionChart(data.requestsByRegion);
      },
      error: (err: any) => {
        console.error('❌ Dashboard error (mock)', err);
        this.dashboardLoading = 'error';
        this.monthlyChartState = 'error';
        this.statusChartState = 'error';
        this.typeChartState = 'error';
        this.regionChartState = 'error';
      }
    });
  }

  // =====================
  // DATE AU FORMAT API
  // =====================
  private getTodayDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // =====================
  // PLANNING DU JOUR
  // =====================
 loadPlanningDuJour(): void {
  this.planningLoading = 'loading';
  const today = this.getTodayDate(); // jj-mm-aaaa

    this.localGetAllImagingRequests().subscribe({
      next: (res: any) => {
        this.examens = (res.content || []).filter((item: Imagerie) =>
          item.status === 'ACCEPTED' &&
          item.appointmentDate === today
        );

        this.planningLoading = 'success';
        console.log('📅 Planning du jour (Imagerie - mock):', this.examens);
      },
      error: (err: any) => {
        console.error('❌ Erreur planning (mock)', err);
        this.planningLoading = 'error';
      }
    });
}


  // =====================
  // GRAPHIQUE MENSUEL
  // =====================

 private createMonthlyChart(data: { [key: string]: number }): void {
  try {
    const labels = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    const values = labels.map((_, i) => data[(i + 1).toString()] ?? 0);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          // Ligne arrière (effet ombre/épaisseur)
          {
            data: values,
            borderColor: 'rgba(44, 123, 229, 0.25)',
            borderWidth: 8,
            tension: 0.45,
            pointRadius: 0,
            fill: false
          },
          // Ligne principale
          {
            label: 'Examens',
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
            titleFont: { size: 12, weight: 600 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => `${context.parsed.y} examens`
            }
          }
        },
        scales: {
  y: {
    beginAtZero: true,
    ticks: {
      color: '#6B7280',
      font: { size: 11 }
    },
    grid: {
      color: 'rgba(0,0,0,0.06)'
    },
    border: { display: false }
  },
  x: {
    ticks: {
      color: '#6B7280',
      font: { size: 11 }
    },
    grid: {
      color: 'rgba(0,0,0,0.04)'
    },
    border: { display: false }
  }
}

      }
    };

    if (this.monthlyChart) this.monthlyChart.destroy();
    this.monthlyChart = new Chart('monthlyChart', config);
    this.monthlyChartState = 'success';

  } catch (error) {
    console.error('❌ Erreur graphique mensuel', error);
    this.monthlyChartState = 'error';
  }
}



private createStatusChart(data: { [key: string]: number }): void {
  try {
    const statusLabels: { [key: string]: string } = {
      PENDING: 'En attente',
      ACCEPTED: 'Accepté',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé'
    };

    const statusColors: { [key: string]: string } = {
      PENDING: '#2C7BE5',   // Bleu
      ACCEPTED: '#00B894',  // Vert
      COMPLETED: '#F59E0B', // Orange
      CANCELLED: '#8B5CF6'  // Violet
    };

    const keys = Object.keys(data);

    const labels = keys.map(key => statusLabels[key] || key);
    const values = keys.map(key => data[key]);
    const colors = keys.map(key => statusColors[key] || '#ccc');

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '0%', // cercle plein
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              boxWidth: 16,
              boxHeight: 16,
              font: { size: 13, weight: 500 },
              color: '#374151'
            }
          },
          tooltip: {
            backgroundColor: '#111827',
            padding: 10,
            titleFont: { size: 12, weight: 600 },
            bodyFont: { size: 12 },
            callbacks: {
              label: (context) => `${context.parsed} examens`
            }
          }
        }
      }
    };

    if (this.statusChart) this.statusChart.destroy();
    this.statusChart = new Chart('statusChart', config);
    this.statusChartState = 'success';

  } catch (error) {
    console.error('❌ Erreur graphique statut', error);
    this.statusChartState = 'error';
  }
}






  // =====================
  // GRAPHIQUE PAR TYPE
  // =====================
  private createTypeChart(data: { [key: string]: number }): void {
    try {
      if (!data || Object.keys(data).length === 0) {
        this.typeChartState = 'error';
        return;
      }

      const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
      const labels = entries.map(([key]) => key);
      const values = entries.map(([, value]) => value);

      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Examens',
            data: values,
            backgroundColor: 'rgba(44, 123, 229, 0.8)',
            borderColor: '#2C7BE5',
            borderWidth: 2,
            borderRadius: 8,
            maxBarThickness: 50,
            hoverBackgroundColor: '#2C7BE5'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: labels.length > 5 ? 'y' : 'x',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              borderColor: '#2C7BE5',
              borderWidth: 1,
              displayColors: false,
              callbacks: {
                label: (context) => `${context.parsed.y || context.parsed.x} examens`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                precision: 0,
                font: { size: 11 },
                color: '#6c757d'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              border: {
                display: false
              }
            },
            x: {
              ticks: {
                font: { size: 11 },
                color: '#6c757d'
              },
              grid: {
                display: false
              }
            }
          }
        }
      };

      this.typeChart = new Chart('typeChart', config);
      this.typeChartState = 'success';
    } catch (error) {
      console.error('❌ Erreur création graphique type', error);
      this.typeChartState = 'error';
    }
  }

  // =====================
  // GRAPHIQUE PAR RÉGION
  // =====================
  private createRegionChart(data: { [key: string]: number }): void {
    try {
      if (!data || Object.keys(data).length === 0) {
        this.regionChartState = 'error';
        return;
      }

      const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
      const labels = entries.map(([key]) => key);
      const values = entries.map(([, value]) => value);

      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Examens',
            data: values,
            backgroundColor: 'rgba(0, 184, 148, 0.8)',
            borderColor: '#00B894',
            borderWidth: 2,
            borderRadius: 8,
            maxBarThickness: 50,
            hoverBackgroundColor: '#00B894'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: labels.length > 5 ? 'y' : 'x',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              borderColor: '#00B894',
              borderWidth: 1,
              displayColors: false,
              callbacks: {
                label: (context) => `${context.parsed.y || context.parsed.x} examens`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                precision: 0,
                font: { size: 11 },
                color: '#6c757d'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              border: {
                display: false
              }
            },
            x: {
              ticks: {
                font: { size: 11 },
                color: '#6c757d'
              },
              grid: {
                display: false
              }
            }
          }
        }
      };

      this.regionChart = new Chart('regionChart', config);
      this.regionChartState = 'success';
    } catch (error) {
      console.error('❌ Erreur création graphique région', error);
      this.regionChartState = 'error';
    }
  }

  // =====================
  // NAVIGATION
  // =====================
  viewExamDetails(exam: Imagerie): void {
    this.router.navigate(['/examens'], {
      queryParams: { examId: exam.id }
    });
  }

  viewAllExams(): void {
    this.router.navigate(['/examens']);
  }
// =====================
// HELPERS
// =====================
getInitials(name: string): string {
  if (!name) return '';

  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

  getInitialsColor(initials: string): string {
    const colors = ['bg-blue-500','bg-purple-500','bg-pink-500','bg-indigo-500','bg-teal-500'];
    return colors[initials.charCodeAt(0) % colors.length];
  }

  // ===== Local mocks for dashboard-imagerie =====
  private localGetDashboard(userId: number) {
    const mock: DashboardImagerieResponse = {
      totalRequests: 120,
      pendingRequests: 18,
      completedRequests: 80,
      urgentRequests: 5,
      youngPatients: 22,
      monthlyRequests: {
        '1': 8, '2': 6, '3': 9, '4': 12, '5': 15, '6': 10, '7': 11, '8': 13, '9': 7, '10': 9, '11': 8, '12': 12
      },
      requestsByStatus: {
        CANCELLED: 3,
        COMPLETED: 80,
        ACCEPTED: 34,
        PENDING: 3
      },
      requestsByType: {
        'Radio': 40,
        'Scanner': 30,
        'IRM': 20
      },
      requestsByRegion: {
        'Dakar': 50,
        'Thiès': 20,
        'Saint-Louis': 10
      }
    };
    return of(mock).pipe(delay(240));
  }

  private localGetAllImagingRequests() {
    const mockItem: Imagerie = {
      id: 1,
      patientFirstName: 'Alice',
      patientLastName: 'Martin',
      status: 'ACCEPTED',
      appointmentDate: this.getTodayDate(),
      // fill other Imagerie fields with safe defaults
      images: [],
      type: 'Radio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    const response = { content: [mockItem] };
    return of(response).pipe(delay(180));
  }






















}
