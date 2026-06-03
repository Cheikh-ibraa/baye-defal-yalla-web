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
  status?: string;
}

interface Pharmacie {
  id: number;
  name: string;
  address: string;
  logo?: string;
  ordonnancesTraitees: number;
  disponibilite: number;
  delaiMoyen: string;
  statut: 'Normal' | 'Retard';
}

interface TopPharmacie {
  name: string;
  ordonnances: number;
  percentage: number;
  tooltip?: string;
}

interface AlertePharmacie {
  id: number;
  name: string;
  address: string;
  time: string;
  avatar?: string;
}

@Component({
  selector: 'app-pharmacies-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacies.component.html',
  styleUrls: ['./pharmacies.component.css']
})
export class PharmaciesComponent implements OnInit, AfterViewInit {
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topPharmaciesChart') topPharmaciesChartRef!: ElementRef<HTMLCanvasElement>;

  // Exposer Math pour le template
  Math = Math;

  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  
  statsCards: StatCard[] = [
    {
      title: 'Pharmacies actives',
      value: '5',
      subtitle: 'Ce mois',
      icon: 'pharmacy',
      iconColor: 'bg-white-50 shadow md'
    },
    {
      title: 'Ordonnances traitées',
      value: '1508',
      subtitle: 'Ce mois',
      icon: 'document',
      iconColor: 'bg-white-50 shadow md',
      status: 'Excellent'
    },
    {
      title: 'Disponibilité moyenne',
      value: '95.6%',
      subtitle: '',
      icon: 'check',
      iconColor: 'bg-white-50 shadow md',
      status: 'Excellent'
    },
    {
      title: 'Délai moyen',
      value: '36 min',
      subtitle: 'Temps de traitement',
      icon: 'clock',
      iconColor: 'bg-white-50 shadow md'
    }
  ];

  topPharmacies: TopPharmacie[] = [
    { name: 'Pharmacie Centrale', ordonnances: 300, percentage: 100 },
    { name: 'Pharmacie de la Gare', ordonnances: 260, percentage: 87 },
    { name: 'Pharmacie GUIGON', ordonnances: 240, percentage: 80, tooltip: 'Pharmacie GUIGON - 95% de réussite - 200 ordonnances - Dakar, 5...' },
    { name: 'Pharmacie 5 Etoiles', ordonnances: 220, percentage: 73 },
    { name: 'Pharmacie Principal', ordonnances: 180, percentage: 60 }
  ];

  allPharmacies: Pharmacie[] = [
    {
      id: 1,
      name: 'Pharmacie Centrale',
      address: 'Dakar, 89 Avenue du Principal',
      ordonnancesTraitees: 285,
      disponibilite: 92,
      delaiMoyen: '25 min',
      statut: 'Normal'
    },
    {
      id: 2,
      name: 'Pharmacie de la Gare',
      address: 'Dakar, 67 Avenue du Nord',
      ordonnancesTraitees: 241,
      disponibilite: 93,
      delaiMoyen: '45 min',
      statut: 'Retard'
    },
    {
      id: 3,
      name: 'Pharmacie Centrale',
      address: 'Dakar, 78 Boulevard Saint-Marc',
      ordonnancesTraitees: 200,
      disponibilite: 99,
      delaiMoyen: '28 min',
      statut: 'Normal'
    },
    {
      id: 4,
      name: 'Pharmacie de la Gare',
      address: 'Dakar, 12 Place de la Gare',
      ordonnancesTraitees: 170,
      disponibilite: 85,
      delaiMoyen: '32 min',
      statut: 'Retard'
    },
    {
      id: 5,
      name: 'Pharmacie du marché',
      address: 'Dakar, 56 Avenue Victor Hugo',
      ordonnancesTraitees: 125,
      disponibilite: 84,
      delaiMoyen: '52 min',
      statut: 'Normal'
    }
  ];

  alertesRetard: AlertePharmacie[] = [
    {
      id: 1,
      name: 'Pharmacie du Nord',
      address: 'Adresse Colobane 234',
      time: 'il y a 45 min'
    },
    {
      id: 2,
      name: 'Pharmacie GUIGON',
      address: 'Dakar, 5...',
      time: 'il y a 52 min'
    }
  ];

  filteredPharmacies: Pharmacie[] = [];
  paginatedPharmacies: Pharmacie[] = [];
  totalPages: number = 1;
  showTooltip: boolean = false;
  tooltipContent: string = '';

  performanceChart: any;
  topPharmaciesChart: any;

  ngOnInit() {
    this.filterPharmacies();
  }

  ngAfterViewInit() {
    this.createPerformanceChart();
    this.createTopPharmaciesChart();
  }

  createPerformanceChart() {
    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
          datasets: [
            {
              label: 'Ordonnances',
              data: [1200, 1300, 1250, 1400, 1450, 1500],
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
              yAxisID: 'y'
            },
            {
              label: 'Délai moyen (min)',
              data: [35, 38, 36, 40, 37, 36],
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              grid: {
                color: '#F3F4F6'
              },
              ticks: {
                callback: function(value) {
                  return value;
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              grid: {
                drawOnChartArea: false,
              },
              ticks: {
                callback: function(value) {
                  return value + ' min';
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

  createTopPharmaciesChart() {
    const ctx = this.topPharmaciesChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.topPharmaciesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.topPharmacies.map(p => p.name),
          datasets: [{
            label: 'Ordonnances',
            data: this.topPharmacies.map(p => p.ordonnances),
            backgroundColor: '#104382',
            borderRadius: 4
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
                label: function(context) {
                  return context.parsed.x + ' ordonnances';
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                color: '#F3F4F6'
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

  filterPharmacies() {
    this.filteredPharmacies = this.allPharmacies.filter(pharmacie => {
      return pharmacie.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
             pharmacie.address.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
    
    this.totalPages = Math.ceil(this.filteredPharmacies.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPharmacies = this.filteredPharmacies.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.filterPharmacies();
  }

  onItemsPerPageChange() {
    this.filterPharmacies();
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

  getProgressBarWidth(disponibilite: number): string {
    return `${disponibilite}%`;
  }

  getProgressBarColor(disponibilite: number): string {
    if (disponibilite >= 90) return 'bg-green-500';
    if (disponibilite >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getStatutClass(statut: string): string {
    return statut === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  showPharmacieTooltip(pharmacie: TopPharmacie) {
    if (pharmacie.tooltip) {
      this.showTooltip = true;
      this.tooltipContent = pharmacie.tooltip;
    }
  }

  hideTooltip() {
    this.showTooltip = false;
    this.tooltipContent = '';
  }

  getPharmacieInitials(name: string): string {
    const words = name.split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return name.substring(0, 2);
  }

  getInitialsColor(index: number): string {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700'
    ];
    return colors[index % colors.length];
  }
}