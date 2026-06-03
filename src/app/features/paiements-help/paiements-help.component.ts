import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  percentage: string;
  color: string;
}

interface Don {
  donateur: string;
  montant: string;
  beneficiaire: string;
  date: string;
  statut: string;
}

@Component({
  selector: 'app-paiements-aides',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paiements-help.component.html',
  styleUrls: ['./paiements-help.component.css']
})
export class PaiementsHelpComponent implements OnInit, AfterViewInit {
  @ViewChild('monthlyRevenueChart') monthlyRevenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paiementsRepartitionChart') paiementsRepartitionChartRef!: ElementRef<HTMLCanvasElement>;

  searchTerm: string = '';
  selectedStatut: string = 'all';
  itemsPerPage: number = 10;
  currentPage: number = 1;

  statsCards: StatCard[] = [
    {
      title: 'Total paiements',
      value: '53 446 720 F',
      subtitle: '+18% ce mois',
      percentage: '56%',
      color: 'text-gray-900'
    },
    {
      title: 'Paiements directs',
      value: '29 962 803 F',
      subtitle: '56.1%',
      percentage: '56.1%',
      color: 'text-blue-600'
    },
    {
      title: 'Aides financières',
      value: '15 386 127 F',
      subtitle: '28.8%',
      percentage: '28.8%',
      color: 'text-green-600'
    },
    {
      title: 'Dons reçus',
      value: '1 836 679 F',
      subtitle: '8 donateurs',
      percentage: '3.4%',
      color: 'text-orange-600'
    }
  ];

  summaryCards = [
    {
      title: 'Paiements directs',
      value: '29 962 803 FCFA'
    },
    {
      title: 'Aides',
      value: '15 386 127 FCFA'
    },
    {
      title: 'Ordonnances urgentes',
      value: '8 097 789 FCFA'
    }
  ];

  allDons: Don[] = [
    {
      donateur: 'Rama Tall',
      montant: '32 500 F',
      beneficiaire: 'Fatou Ndiaye',
      date: '05/11/2025',
      statut: 'Complété'
    },
    {
      donateur: 'Sire Ndiaye',
      montant: '7 000 F',
      beneficiaire: 'Lamine Ouayi',
      date: '05/11/2025',
      statut: 'Complété'
    },
    {
      donateur: 'Cheikh Wade',
      montant: '12 900 F',
      beneficiaire: 'Lamine Ly',
      date: '05/11/2025',
      statut: 'Complété'
    },
    {
      donateur: 'Abiaye Sy',
      montant: '15 750 F',
      beneficiaire: 'Fatou Tall',
      date: '05/11/2025',
      statut: 'Complété'
    },
    {
      donateur: 'Abiaye Sy',
      montant: '15 750 F',
      beneficiaire: 'Fatou Tall',
      date: '05/11/2025',
      statut: 'Complété'
    }
  ];

  filteredDons: Don[] = [];
  paginatedDons: Don[] = [];
  totalPages: number = 1;

  monthlyRevenueChart: any;
  paiementsRepartitionChart: any;

  ngOnInit() {
    this.filterDons();
  }

  ngAfterViewInit() {
    this.createMonthlyRevenueChart();
    this.createPaiementsRepartitionChart();
  }

  createMonthlyRevenueChart() {
    const ctx = this.monthlyRevenueChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.monthlyRevenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
          datasets: [
            {
              label: 'Direct',
              data: [3500, 4200, 3800, 4500, 4800, 5200],
              backgroundColor: '#3B82F6'
            },
            {
              label: 'Aides',
              data: [1800, 2100, 1900, 2300, 2500, 2700],
              backgroundColor: '#10B981'
            },
            {
              label: 'Urgent',
              data: [1200, 1500, 1300, 1600, 1800, 2000],
              backgroundColor: '#F59E0B'
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
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#F3F4F6'
              },
              ticks: {
                callback: function(value) {
                  return value + '00';
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

  createPaiementsRepartitionChart() {
    const ctx = this.paiementsRepartitionChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.paiementsRepartitionChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Paiements directs', 'Aides', 'Ordonnances urgentes'],
          datasets: [{
            data: [56.1, 28.8, 15.1],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
            borderWidth: 0
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
                }
              }
            }
          },
          
        }
      });
    }
  }

  filterDons() {
    this.filteredDons = this.allDons.filter(don => {
      const matchesSearch = don.donateur.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           don.beneficiaire.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatut = this.selectedStatut === 'all' || don.statut === this.selectedStatut;
      return matchesSearch && matchesStatut;
    });
    
    this.totalPages = Math.ceil(this.filteredDons.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDons = this.filteredDons.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.filterDons();
  }

  onStatutChange() {
    this.filterDons();
  }

  onItemsPerPageChange() {
    this.filterDons();
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

  get totalDonsCount(): number {
    return this.filteredDons.length;
  }

  get currentRangeStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get currentRangeEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredDons.length);
  }
}