import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon: string;
  iconColor: string;
}

interface Medecin {
  id: string;
  initial: string;
  name: string;
  speciality: string;
  ordonnancesEmises: number;
  ordonnancesValidees: number;
  enAttente: number;
  tauxValidation: number;
}

interface TopMedecin {
  name: string;
  ordonnances: number;
  percentage: number;
  tooltip?: string;
}

@Component({
  selector: 'app-medecins-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medecins.component.html',
  styleUrls: ['./medecins.component.css']
})
export class MedecinsComponent implements OnInit, AfterViewInit {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topMedecinChart') topMedecinChartRef!: ElementRef<HTMLCanvasElement>;
  math = Math;
  searchTerm: string = '';
  selectedSpecialty: string = 'all';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  
  statsCards: StatCard[] = [
    {
      title: 'Médecins Actifs',
      value: '05',
      subtitle: 'Ce mois',
      trend: 'up',
      trendValue: '80% du total',
      icon: 'med',
      iconColor: 'bg-white-50 shadow md'
    },
    {
      title: 'Ordonnances totales',
      value: '922',
      subtitle: 'Ce mois',
      icon: 'document',
      iconColor: 'bg-white-50 shadow md'
    },
    {
      title: 'Taux de validation',
      value: '97.9%',
      subtitle: 'vs mois dernier',
      trend: 'up',
      trendValue: '+2.3%',
      icon: 'check',
      iconColor: 'bg-white-50 shadow md'
    },
    {
      title: 'En attente',
      value: '19',
      subtitle: 'Ordonnances',
      icon: 'clock',
      iconColor: 'bg-white-50 shadow md'
    }
  ];

  topMedecins: TopMedecin[] = [
    { name: 'Dr. Moussa Diop', ordonnances: 300, percentage: 100 },
    { name: 'Dr. Pape Fall', ordonnances: 230, percentage: 77 },
    { name: 'Dr. Mbaye Faye', ordonnances: 220, percentage: 73, tooltip: 'Pédiatrie - 95% de réussite - 200 ordonnances' },
    { name: 'Dr. Lamine Ly', ordonnances: 180, percentage: 60 },
    { name: 'Dr. Ousmane Fall', ordonnances: 150, percentage: 50 }
  ];

  allMedecins: Medecin[] = [
    {
      id: 'MD',
      initial: 'MD',
      name: 'Dr. Moussa Diop',
      speciality: 'Médecine générale',
      ordonnancesEmises: 285,
      ordonnancesValidees: 282,
      enAttente: 3,
      tauxValidation: 92
    },
    {
      id: 'PF',
      initial: 'PF',
      name: 'Dr. Pape Fall',
      speciality: 'Médecine générale',
      ordonnancesEmises: 241,
      ordonnancesValidees: 239,
      enAttente: 2,
      tauxValidation: 89
    },
    {
      id: 'MF',
      initial: 'MF',
      name: 'Dr. Mbaye Faye',
      speciality: 'Pédiatrie',
      ordonnancesEmises: 200,
      ordonnancesValidees: 198,
      enAttente: 2,
      tauxValidation: 99
    },
    {
      id: 'LL',
      initial: 'LL',
      name: 'Dr. Lamine Ly',
      speciality: 'Cardiologie',
      ordonnancesEmises: 170,
      ordonnancesValidees: 165,
      enAttente: 5,
      tauxValidation: 85
    },
    {
      id: 'OF',
      initial: 'OF',
      name: 'Dr. Ousmane Fall',
      speciality: 'Dermatologie',
      ordonnancesEmises: 125,
      ordonnancesValidees: 120,
      enAttente: 5,
      tauxValidation: 85
    }
  ];

  filteredMedecins: Medecin[] = [];
  paginatedMedecins: Medecin[] = [];
  totalPages: number = 1;
  showTooltip: boolean = false;
  tooltipContent: string = '';

  monthlyChart: any;
  topMedecinChart: any;

  ngOnInit() {
    this.filterMedecins();
  }

  ngAfterViewInit() {
    this.createMonthlyChart();
    this.createTopMedecinChart();
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
              label: 'Émises',
              data: [150, 170, 145, 190, 210, 235],
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Validées',
              data: [140, 165, 142, 185, 205, 230],
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true
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
                padding: 20
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#F3F4F6'
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

  createTopMedecinChart() {
    const ctx = this.topMedecinChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.topMedecinChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.topMedecins.map(m => m.name),
          datasets: [{
            label: 'Ordonnances',
            data: this.topMedecins.map(m => m.ordonnances),
            backgroundColor: '#5DADE2',
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

  filterMedecins() {
    this.filteredMedecins = this.allMedecins.filter(medecin => {
      const matchesSearch = medecin.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesSpecialty = this.selectedSpecialty === 'all' || medecin.speciality === this.selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
    
    this.totalPages = Math.ceil(this.filteredMedecins.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMedecins = this.filteredMedecins.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.filterMedecins();
  }

  onSpecialtyChange() {
    this.filterMedecins();
  }

  onItemsPerPageChange() {
    this.filterMedecins();
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

  getProgressBarWidth(tauxValidation: number): string {
    return `${tauxValidation}%`;
  }

  getProgressBarColor(tauxValidation: number): string {
    if (tauxValidation >= 90) return 'bg-green-500';
    if (tauxValidation >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  showMedecinTooltip(medecin: TopMedecin) {
    if (medecin.tooltip) {
      this.showTooltip = true;
      this.tooltipContent = medecin.tooltip;
    }
  }

  hideTooltip() {
    this.showTooltip = false;
    this.tooltipContent = '';
  }
}