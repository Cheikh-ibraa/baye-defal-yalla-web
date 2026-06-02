import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

// Enregistrement global de Chart.js
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

interface Ordonnance {
  reference: string;
  patient: string;
  date: string;
  statut: string;
  statutClass: string;
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
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html', 
  styleUrls: ['./dashboard-admin.component.css']    
})
export class DashboardAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statisticsChart') statisticsChartRef!: ElementRef<HTMLCanvasElement>;

  selectedPeriod = 'Ce-mois';
  loadingOrdonnances = true;
  loadingStats = true;

  statsCards: StatsCard[] = [
    {
      title: 'Utilisateurs totaux',
      value: '12,458',
      subtitle: 'vs mois dernier',
      trend: 'up',
      trendValue: '+12.5%',
      icon: 'users',
      iconColor: 'bg-white-50 text-black-500 shadow sm',
      loading: false
    },
    {
      title: 'Ordonnances totales',
      value: '8,234',
      subtitle: 'vs mois dernier',
      trend: 'up',
      trendValue: '+8%',
      icon: 'document',
      iconColor: 'bg-white-50 text-blue-500 shadow sm',
      loading: false
    },
    {
      title: 'Livraisons réussies',
      value: '7,891',
      subtitle: 'vs mois dernier',
      trend: 'up',
      trendValue: '+15%',
      icon: 'check',
      iconColor: 'bg-white-50 text-green-500 shadow sm',
      loading: false
    },
    {
      title: 'Médecins actifs',
      value: '41',
      subtitle: 'vs mois dernier',
      trend: 'up',
      trendValue: '+5%',
      icon: 'med',
      iconColor: 'bg-white-50 text-blue-500 shadow sm',
      loading: false
    },
    {
      title: 'Dons reçus',
      value: '29,962 F CFA',
      subtitle: 'vs mois dernier',
      trend: 'up',
      trendValue: '+22%',
      icon: 'heart',
      iconColor: 'bg-white-50 text-red-500 shadow sm',
      loading: false
    },
    {
      title: 'Pharmacies actives',
      value: '156',
      subtitle: 'vs mois dernier',
      trend: 'up',
      trendValue: '+3%',
      icon: 'pharmacie',
      iconColor: 'bg-white-50 text-blue-500 shadow sm',
      loading: false
    }
  ];

  dernieresOrdonnances: Ordonnance[] = [];

  activities: Activity[] = [
    {
      type: 'warning',
      title: 'Retard signalé',
      subtitle: 'Pharmacie du Nord',
      time: 'Il y a 1 heure'
    },
    {
      type: 'success',
      title: 'Ordonnance validée',
      subtitle: '#ORD8234',
      time: 'Il y a 1 heure'
    },
    {
      type: 'info',
      title: 'Nouveau médecin inscrit',
      subtitle: 'Dr. Sophie Diop',
      time: 'Il y a 5 jours'
    },
    {
      type: 'success',
      title: 'Don reçu',
      subtitle: 'De 5000 F à Lamine Fall',
      time: 'Il y a 5 jours'
    }
  ];

  private statisticsChart: Chart | null = null;

  // === Lifecycle Hooks ===
  ngOnInit(): void {
    setTimeout(() => {
      this.dernieresOrdonnances = [
        { reference: '#ORD8234', patient: 'Amadou Seck', date: '13 Nov 2025', statut: 'En cours', statutClass: 'bg-yellow-100 text-yellow-800' },
        { reference: '#ORD8233', patient: 'Fatou Diallo', date: '13 Nov 2025', statut: 'Validée', statutClass: 'bg-green-100 text-green-800' },
        { reference: '#ORD8232', patient: 'Moussa Ba', date: '12 Nov 2025', statut: 'Livrée', statutClass: 'bg-blue-100 text-blue-800' },
        { reference: '#ORD8231', patient: 'Awa Ndiaye', date: '12 Nov 2025', statut: 'En cours', statutClass: 'bg-yellow-100 text-yellow-800' },
        { reference: '#ORD8230', patient: 'Cheikh Fall', date: '11 Nov 2025', statut: 'Validée', statutClass: 'bg-green-100 text-green-800' }
      ];
      this.loadingOrdonnances = false;
    }, 1500);

    setTimeout(() => {
      this.loadingStats = false;
    }, 1000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initStatisticsChart();
    }, 1100);
  }

  ngOnDestroy(): void {
    if (this.statisticsChart) {
      this.statisticsChart.destroy();
      this.statisticsChart = null;
    }
  }

  // === Méthodes ===
  private initStatisticsChart(): void {
    if (!this.statisticsChartRef?.nativeElement) return;

    const ctx = this.statisticsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Détruire l'ancien graphique
    if (this.statisticsChart) {
      this.statisticsChart.destroy();
    }

    this.statisticsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Web',
            data: [120, 150, 130, 180, 160, 190, 140],
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
            borderWidth: 1,
            borderRadius: 0, // Barres rectangulaires
            barPercentage: 0.8,
            categoryPercentage: 0.8
          },
          {
            label: 'Mobile',
            data: [220, 280, 240, 320, 300, 350, 270],
            backgroundColor: '#10B981',
            borderColor: '#10B981',
            borderWidth: 1,
            borderRadius: 0, // Barres rectangulaires
            barPercentage: 0.8,
            categoryPercentage: 0.8
          }
        ]
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
                const datasets = chart.data.datasets;
                return datasets.map((dataset: any, i: number) => ({
                  text: dataset.label ?? '',
                  fillStyle: dataset.backgroundColor,
                  strokeStyle: dataset.borderColor,
                  lineWidth: 1,
                  hidden: !chart.isDatasetVisible(i),
                  datasetIndex: i
                }));
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 4,
            padding: 10,
            displayColors: true,
            titleFont: { size: 13 },
            bodyFont: { size: 12 }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#6B7280', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            max: 360,
            grid: { color: '#E5E7EB', drawTicks: false },
            border: { display: false },
            ticks: {
              stepSize: 90,
              color: '#6B7280',
              font: { size: 11 },
              padding: 8
            }
          }
        }
      }
    });
  }

  refreshDashboard(): void {
    this.loadingOrdonnances = true;
    this.loadingStats = true;

    setTimeout(() => {
      this.loadingOrdonnances = false;
      this.loadingStats = false;
    }, 1500);
  }

  exportData(): void {
    console.log('Export des données...');
    alert('Fonction d\'export en cours de développement');
  }
}