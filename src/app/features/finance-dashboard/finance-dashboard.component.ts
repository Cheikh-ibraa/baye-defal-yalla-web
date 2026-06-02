import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  color?: string;
}

interface Pharmacie {
  name: string;
  revenue: number;
}

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.css']
})
export class FinanceDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('caChart') caChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paiementChart') paiementChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topPharmaciesChart') topPharmaciesChartRef!: ElementRef<HTMLCanvasElement>;

  selectedPeriod: string = 'Ce mois';

 statsCards: StatCard[] = [
  {
    title: 'Fonds en circulation',
    value: '53 446 720 F',
    subtitle: 'Total',
    color: '#000001ff'
  },
  {
    title: 'Montants versés aux pharmacies',
    value: '29 962 803 F',
    subtitle: 'Total',
    color: '#0D6EFD'
  },
  {
    title: 'Nombre de transactions',
    value: '12 458',
    subtitle: 'Total',
    color: '#056801ff'
  },
  {
    title: 'Versements en attente',
    value: '23',
    subtitle: 'Total',
    color: '#ff0000ff'
  }
];


  pharmacies: Pharmacie[] = [
    { name: 'Pharmacie Centrale', revenue: 5200000 },
    { name: 'Pharmacie de la Paix', revenue: 4800000 },
    { name: 'Pharmacie OUEDION', revenue: 3900000 },
    { name: 'Pharmacie S Fatou', revenue: 2800000 },
    { name: 'Pharmacie Diamal', revenue: 2100000 },
    { name: 'Pharmacie Point E', revenue: 1800000 },
    { name: 'Pharmacie Almadies', revenue: 1600000 },
    { name: 'Pharmacie Mermoz', revenue: 1400000 },
    { name: 'Pharmacie Liberté', revenue: 1200000 },
    { name: 'Pharmacie Plateau', revenue: 1000000 }
  ];

  caChart: any;
  paiementChart: any;
  topPharmaciesChart: any;

  ngOnInit() {
    // Initialisation si nécessaire
  }

  ngAfterViewInit() {
    this.createCAChart();
    this.createPaiementChart();
    this.createTopPharmaciesChart();
  }

  createCAChart() {
    const ctx = this.caChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.caChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'],
          datasets: [{
            label: 'Chiffre d\'affaires',
            data: [5000000, 5500000, 6000000, 6500000, 7000000, 7200000, 7500000, 7800000, 8000000, 8200000, 8500000, 9000000],
            backgroundColor: '#3B82F6',
            borderRadius: 0,
            barPercentage: 0.8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#E5E7EB'
              },
              ticks: {
                callback: function (value) {
                  return (value as number / 1000000) + 'M';
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }

  createPaiementChart() {
    const ctx = this.paiementChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.paiementChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Carte bancaire', 'Espèces', 'Chèque', 'Mobile'],
          datasets: [{
            data: [45, 25, 15, 15],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#A855F7'
            ],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 12
                },
                generateLabels: function (chart) {
                  const data = chart.data;
                  if (data.labels && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const dataset = data.datasets[0] as any;
                      const value = dataset.data[i];
                      // Safely resolve background color whether it's an array or a single value
                      const bg = dataset.backgroundColor as any;
                      const fill = Array.isArray(bg) ? bg[i] : bg;
                      return {
                        text: label as string,
                        fillStyle: fill as string,
                        hidden: false,
                        index: i,
                        pointStyle: 'circle'
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed !== null) {
                    label += context.parsed + '%';
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }
  }

  createTopPharmaciesChart() {
    const ctx = this.topPharmaciesChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.topPharmaciesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.pharmacies.map(p => p.name),
          datasets: [{
            label: 'Revenus (F CFA)',
            data: this.pharmacies.map(p => p.revenue),
            backgroundColor: '#10B981',
            borderRadius: 0,
            barPercentage: 0.6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.x !== null) {
                    label += new Intl.NumberFormat('fr-FR').format(context.parsed.x) + ' F CFA';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                color: '#E5E7EB'
              },
              ticks: {
                callback: function (value) {
                  return (value as number / 100000) + '00 000';
                }
              }
            },
            y: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }

  onPeriodChange() {
    // Logique pour changer la période
    console.log('Période changée:', this.selectedPeriod);
    // Vous pouvez recharger les données ici
  }

  exportData() {
    // Logique pour exporter les données
    console.log('Export des données...');
    // Implémenter l'export en CSV ou Excel
  }
}