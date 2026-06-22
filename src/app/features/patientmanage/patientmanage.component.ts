import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PatientService } from './patient.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  trendValue?: string;
  icon: string;
  iconColor: string;
}

interface Patient {
  id: string;
  initial: string;
  name: string;
  email: string;
  commandes: number;
  achatRecent: string;
  derniereCommande: string;
  avatarColor: string;
}

interface CommandeStats {
  status: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-patients-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './patientmanage.component.html',
  styleUrls: ['./patientmanage.component.css']
})
export class PatientsComponent implements OnInit, AfterViewInit {
  @ViewChild('evolutionChart') evolutionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('commandesChart') commandesChartRef!: ElementRef<HTMLCanvasElement>;
  
  Math = Math;
  searchTerm: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  
  statsCards: StatCard[] = [
    {
      title: 'Total patients',
      value: '12 458',
      subtitle: 'vs mois',
      trend: 'up',
      trendValue: '+12%',
      icon: 'users',
      iconColor: 'bg-white-50 shadow md'
    },
    {
      title: 'Patients actifs',
      value: '08',
      subtitle: '88% du total',
      icon: 'user-check',
      iconColor: 'bg-white-50 shadow md'
    },
    {
      title: 'Commandes totales',
      value: '342',
      subtitle: 'Ce mois',
      trend: 'up',
      trendValue: '+2%',
      icon: 'document',
      iconColor: 'bg-white-50 shadow md'
    },
    {
      title: 'Aides totales',
      value: '29 962 F',
      subtitle: 'Pharmacies collectionnées',
      icon: 'dollar',
      iconColor: 'bg-white-50 shadow md'
    }
  ];

  commandesStats: CommandeStats[] = [
    { status: 'En attente', count: 15, color: '#10B981' },
    { status: 'Acceptée', count: 35, color: '#10B981' },
    { status: 'Refusée', count: 2, color: '#10B981' },
    { status: 'En préparation', count: 48, color: '#10B981' },
    { status: 'Prêt', count: 65, color: '#10B981' },
    { status: 'Livrée', count: 177, color: '#10B981' }
  ];

  allPatients: Patient[] = [
    {
      id: 'MW',
      initial: 'MW',
      name: 'Moussa Wade',
      email: 'moussawade@gmail.com',
      commandes: 12,
      achatRecent: '32 500 F',
      derniereCommande: '2025-01-15',
      avatarColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'MF',
      initial: 'MF',
      name: 'Maman Fall',
      email: 'mamanfall@gmail.com',
      commandes: 8,
      achatRecent: '12 800 F',
      derniereCommande: '2025-01-15',
      avatarColor: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'ID',
      initial: 'ID',
      name: 'Issa Diop',
      email: 'issadiop@gmail.com',
      commandes: 15,
      achatRecent: '4 000 F',
      derniereCommande: '2025-01-15',
      avatarColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'FF',
      initial: 'FF',
      name: 'Fatou Fall',
      email: 'fatoufall@gmail.com',
      commandes: 6,
      achatRecent: '2 500 F',
      derniereCommande: '2025-01-15',
      avatarColor: 'bg-pink-100 text-pink-700'
    },
    {
      id: 'IL',
      initial: 'IL',
      name: 'Ibssou Ly',
      email: 'ibssouoly@gmail.com',
      commandes: 10,
      achatRecent: '5 000 F',
      derniereCommande: '2025-01-15',
      avatarColor: 'bg-yellow-100 text-yellow-700'
    }
  ];

  filteredPatients: Patient[] = [];
  paginatedPatients: Patient[] = [];
  totalPages: number = 1;

  evolutionChart: any;
  commandesChart: any;

  constructor(private patientService: PatientService) {}

  ngOnInit() {
    this.loadPatients();
    this.loadStats();
  }

  private loadPatients() {
    this.patientService.getPatients().subscribe({
      next: (res: any) => {
        // Expect res to be an array of patients
        if (Array.isArray(res)) {
          this.allPatients = res.map((p: any) => ({
            id: p.keycloakId ?? p.id ?? '',
            initial: ((p.firstName || '').charAt(0) + (p.lastName || '').charAt(0)).toUpperCase(),
            name: [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || '—',
            email: p.email || '—',
            commandes: p.commandesCount ?? 0,
            achatRecent: p.lastPurchaseAmount ? `${p.lastPurchaseAmount} F` : '—',
            derniereCommande: p.lastPurchaseDate ?? '',
            avatarColor: 'bg-blue-100 text-blue-700',
          }));
          this.filterPatients();
        }
      },
      error: () => {
        // keep static data on error
      }
    });
  }

  private loadStats() {
    this.patientService.getPatientsStats().subscribe({
      next: (s: any) => {
        if (s) {
          this.statsCards[0].value = (s.totalPatients ?? this.statsCards[0].value).toString();
          this.statsCards[1].value = (s.activePatients ?? this.statsCards[1].value).toString();
          this.statsCards[2].value = (s.totalOrders ?? this.statsCards[2].value).toString();
          this.statsCards[3].value = (s.totalAid ? `${s.totalAid} F` : this.statsCards[3].value).toString();
        }
      },
      error: () => {}
    });
  }

  ngAfterViewInit() {
    this.createEvolutionChart();
    this.createCommandesChart();
  }

  createEvolutionChart() {
    const ctx = this.evolutionChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.evolutionChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
          datasets: [{
            label: 'Aides',
            data: [1800, 2200, 2400, 2100, 2600, 2900],
            backgroundColor: '#3B82F6',
            barThickness: 48
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
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (context) => {
                  return `${context.parsed.y} aides`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 3000,
              ticks: {
                stepSize: 1000,
                font: {
                  size: 11
                }
              },
              grid: {
                color: '#F3F4F6'
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

  createCommandesChart() {
    const ctx = this.commandesChartRef.nativeElement.getContext('2d');
    if (ctx) {
      // Calculer le max pour l'échelle
      const maxValue = Math.max(...this.commandesStats.map(s => s.count));
      const chartMax = Math.ceil(maxValue / 50) * 50 + 50; // Arrondir au 50 supérieur + marge

      this.commandesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.commandesStats.map(s => s.status),
          datasets: [{
            label: 'Commandes',
            data: this.commandesStats.map(s => s.count),
            backgroundColor: '#10B981',
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
                  return `${context.parsed.x} commandes`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: chartMax,
              ticks: {
                stepSize: 50,
                font: {
                  size: 11
                }
              },
              grid: {
                color: '#F3F4F6'
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

  filterPatients() {
    this.filteredPatients = this.allPatients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           patient.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
    
    this.totalPages = Math.ceil(this.filteredPatients.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPatients = this.filteredPatients.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.filterPatients();
  }

  onItemsPerPageChange() {
    this.filterPatients();
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
}