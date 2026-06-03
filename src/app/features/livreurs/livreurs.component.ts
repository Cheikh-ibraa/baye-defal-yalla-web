import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconColor: string;
}

interface Livreur {
  id: string;
  initial: string;
  name: string;
  zone: string;
  livraisons: number;
  tauxReussite: number;
  tempsMoyen: string;
  commission: string;
  rating: number;
}

interface TopLivreur {
  name: string;
  livraisons: number;
  percentage: number;
}

@Component({
  selector: 'app-livreurs-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './livreurs.component.html',
  styleUrls: ['./livreurs.component.css']
})
export class LivreursComponent implements OnInit, AfterViewInit {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topLivreurChart') topLivreurChartRef!: ElementRef<HTMLCanvasElement>;
  
  Math = Math;
  searchTerm: string = '';
  selectedStatus: string = 'all';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  
  statsCards: StatCard[] = [
    {
      title: 'Livreurs actifs',
      value: '06',
      subtitle: 'Total',
      icon: 'user',
      iconColor: ''
    },
    {
      title: 'Livraisons totales',
      value: '960',
      subtitle: 'Ce mois',
      icon: 'package',
      iconColor: 'bg-blue-50'
    },
    {
      title: 'Taux de réussite',
      value: '97.0%',
      subtitle: 'Excellent',
      icon: 'check',
      iconColor: 'bg-green-50'
    },
    {
      title: 'Commissions totales',
      value: '3 441 806 F',
      subtitle: 'Ce mois',
      icon: 'dollar',
      iconColor: ''
    }
  ];

  topLivreurs: TopLivreur[] = [
    { name: 'Moussa Diop', livraisons: 285, percentage: 100 },
    { name: 'Papa Fall', livraisons: 241, percentage: 85 },
    { name: 'Mbaye Faye', livraisons: 200, percentage: 70 },
    { name: 'Lamine Ly', livraisons: 170, percentage: 60 },
    { name: 'Ousmane Fall', livraisons: 125, percentage: 44 }
  ];

  allLivreurs: Livreur[] = [
    {
      id: 'MD',
      initial: 'MD',
      name: 'Moussa Diop',
      zone: 'Dakar',
      livraisons: 285,
      tauxReussite: 92.5,
      tempsMoyen: '25 min',
      commission: '2 500 F',
      rating: 4
    },
    {
      id: 'PF',
      initial: 'PF',
      name: 'Papa Fall',
      zone: 'Plateau',
      livraisons: 241,
      tauxReussite: 89.0,
      tempsMoyen: '28 min',
      commission: '1 750 F',
      rating: 4
    },
    {
      id: 'MF',
      initial: 'MF',
      name: 'Mbaye Faye',
      zone: 'Medine',
      livraisons: 200,
      tauxReussite: 90.0,
      tempsMoyen: '22 min',
      commission: '3 500 F',
      rating: 2
    },
    {
      id: 'LL',
      initial: 'LL',
      name: 'Lamine Ly',
      zone: 'Dakar',
      livraisons: 170,
      tauxReussite: 85.0,
      tempsMoyen: '30 min',
      commission: '3 800 F',
      rating: 5
    },
    {
      id: 'OF',
      initial: 'OF',
      name: 'Ousmane Fall',
      zone: 'Point E',
      livraisons: 125,
      tauxReussite: 85.0,
      tempsMoyen: '26 min',
      commission: '3 800 F',
      rating: 3
    }
  ];

  filteredLivreurs: Livreur[] = [];
  paginatedLivreurs: Livreur[] = [];
  totalPages: number = 1;

  monthlyChart: any;
  topLivreurChart: any;

  ngOnInit() {
    this.filterLivreurs();
  }

  ngAfterViewInit() {
    this.createMonthlyChart();
    this.createTopLivreurChart();
  }

  createMonthlyChart() {
    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
          datasets: [
            {
              label: 'Livraisons',
              data: [650, 700, 680, 750, 820, 960],
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: '#10B981'
            },
            {
              label: 'Réussies',
              data: [630, 680, 665, 730, 800, 932],
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: '#3B82F6'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#F3F4F6'
              },
              ticks: {
                font: {
                  size: 11
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 11
                }
              }
            }
          }
        }
      });
    }
  }

  createTopLivreurChart() {
    const ctx = this.topLivreurChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.topLivreurChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.topLivreurs.map(l => l.name),
          datasets: [{
            label: 'Livraisons',
            data: this.topLivreurs.map(l => l.livraisons),
            backgroundColor: '#5DADE2',
            borderRadius: 6,
            barThickness: 24
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
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (context) => {
                  return `${context.parsed.x} livraisons`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 300,
              grid: {
                color: '#F3F4F6'
              },
              ticks: {
                stepSize: 75,
                font: {
                  size: 11
                }
              }
            },
            y: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 11
                }
              }
            }
          }
        }
      });
    }
  }

  filterLivreurs() {
    this.filteredLivreurs = this.allLivreurs.filter(livreur => {
      const matchesSearch = livreur.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           livreur.zone.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
    
    this.totalPages = Math.ceil(this.filteredLivreurs.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLivreurs = this.filteredLivreurs.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.filterLivreurs();
  }

  onItemsPerPageChange() {
    this.filterLivreurs();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getProgressBarWidth(tauxReussite: number): string {
    return `${tauxReussite}%`;
  }

  getProgressBarColor(tauxReussite: number): string {
    if (tauxReussite >= 90) return 'bg-green-500';
    if (tauxReussite >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }
}