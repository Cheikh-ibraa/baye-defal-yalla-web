import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subject, of } from 'rxjs';
import { takeUntil, finalize, delay } from 'rxjs/operators';

// Inlined dashboard types (replacing DashboardMedService dependency)
interface PrescriptionsKPI {
  totalPrescriptions: number;
  todayPrescriptions: number;
  todayVsYesterdayPercent: number;
  pendingPrescriptions: number;
  validatedLast7Days: number;
  validationRate: number;
}

interface PrescriptionsStats {
  [status: string]: number;
}
// Inlined Ordonnance types and local mock service replacements
interface Medication {
  id?: number;
  name: string;
  quantity: number;
  dosage: string;
  price: number;
}

interface Person {
  id: number;
  nom: string;
  prenom: string;
}

interface Pharmacist {
  id: number;
  nom: string;
  prenom: string;
}

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  logo: string;
  hourly: string | null;
  pharmacist: Pharmacist;
}

interface Ordonnance {
  id: number;
  reference: string;
  doctor: Person;
  patient: Person;
  createdAt: string;
  status: string;
  qrCodeUrl: string;
  fullyPaidByDonor: boolean;
  partiallyPaidByDonor: boolean;
  pharmacy: Pharmacy;
  amount: number;
  needsHelp: boolean;
  address: string;
  latitude: number;
  longitude: number;
  prescriptionFile: string | null;
  medications: Medication[];
}

interface PageableSort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageableSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

interface OrdonnanceResponse {
  content: Ordonnance[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: PageableSort;
  first: boolean;
  empty: boolean;
}
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

interface AppointmentType {
  id: number;
  name: string;
  description: string;
}

interface AppointmentAPI {
  id: number;
  doctorName: string;
  specialty: string | null;
  patientName: string;
  date: string; // Format: DD-MM-YYYY
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  reason: string;
  type: AppointmentType | null;
  status: 'EN_ATTENTE' | 'TERMINE' | 'ANNULE';
  createdAt: string;
  updatedAt: string;
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

  // ID du docteur connecté
  currentDoctorId: number = 0;
  private readonly mockCurrentDoctor = {
    id: 10,
    nom: 'Mbaye',
    prenom: 'Awa'
  };

  // Données des cartes statistiques
  statsCards: StatCard[] = [
    {
      title: 'Ordonnances',
      value: 0,
      subtitle: 'Total',
      icon: 'document',
      iconColor: 'text-white',
      loading: true
    },
    {
      title: 'Ordonnances du jour',
      value: 0,
      subtitle: 'vs hier',
      icon: 'calendar',
      iconColor: 'text-white',
      trend: 'up',
      trendValue: '0%',
      loading: true
    },
    {
      title: 'En attente de validation',
      value: 0,
      subtitle: 'Pharmacies sélectionnées',
      icon: 'hourglass',
      iconColor: 'text-white',
      loading: true
    },
    {
      title: 'Validées (7j)',
      value: 0,
      subtitle: 'Taux de validation 0%',
      icon: 'check',
      iconColor: 'text-green-500',
      loading: true
    }
  ];

  dernieresOrdonnances: OrdonnanceDisplay[] = [];
  prochainsRendezVous: RendezVous[] = [];

  loadingOrdonnances: boolean = true;
  loadingStats: boolean = true;
  loadingDashboard: boolean = true;
  loadingWeeklyChart: boolean = true;
  loadingAppointments: boolean = true;

  error: boolean = false;
  errorMessage: string = '';

  // Données pour le graphique des statuts
  statsData: PrescriptionsStats = {};

  private destroy$ = new Subject<void>();

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('🏥 DashboardMedecinComponent - Initialisation');

    // Utilisateur local mocké pour un mode UI-only
    this.currentDoctorId = this.mockCurrentDoctor.id;
    console.log('👨‍⚕️ ID Docteur (mock):', this.currentDoctorId);

    // Charger les données du dashboard
    this.loadDashboardData();

    // Charger les rendez-vous simulés (mocks)
    this.loadAppointments();
  }

  ngAfterViewInit(): void {
    // Les graphiques seront créés après le chargement des données
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.chart) {
      this.chart.destroy();
    }

    if (this.weeklyChartInstance) {
      this.weeklyChartInstance.destroy();
    }
  }

  /**
   * Charge toutes les données du dashboard
   */
  loadDashboardData(): void {
    this.loadingDashboard = true;
    this.error = false;

    console.log('📊 Chargement du dashboard pour le docteur:', this.currentDoctorId);

    this.loadPrescriptionsKPI();
    this.loadPrescriptionsStats();
    this.loadRecentOrdonnances();
    this.loadWeeklyEvolution();
  }

  /**
   * Charge les KPI des ordonnances
   */
  loadPrescriptionsKPI(): void {
    console.log('📊 Chargement des KPI pour le docteur:', this.currentDoctorId);

    this.localGetPrescriptionsKpi(this.currentDoctorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.statsCards.forEach(card => card.loading = false);
          this.loadingDashboard = false;
        })
      )
      .subscribe({
        next: (kpi: PrescriptionsKPI) => {
          console.log('✅ KPI récupérés:', kpi);

          // Mise à jour des cartes
          this.statsCards[0].value = kpi.totalPrescriptions;
          this.statsCards[1].value = kpi.todayPrescriptions;
          this.statsCards[1].trendValue = `${kpi.todayVsYesterdayPercent > 0 ? '+' : ''}${kpi.todayVsYesterdayPercent}%`;
          this.statsCards[1].trend = kpi.todayVsYesterdayPercent >= 0 ? 'up' : 'down';
          this.statsCards[2].value = kpi.pendingPrescriptions;
          this.statsCards[3].value = kpi.validatedLast7Days;
          this.statsCards[3].subtitle = `Taux de validation ${kpi.validationRate}%`;
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des KPI:', error);
          this.error = true;
          this.errorMessage = 'Erreur lors du chargement des statistiques';
        }
      });
  }

  /**
   * Charge les statistiques des ordonnances par statut
   */
  loadPrescriptionsStats(): void {
    console.log('📈 Chargement des statistiques pour le docteur:', this.currentDoctorId);

    this.loadingStats = true;
    this.localGetStat(this.currentDoctorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingStats = false)
      )
      .subscribe({
        next: (stats: PrescriptionsStats) => {
          console.log('✅ Statistiques récupérées:', stats);
          this.statsData = stats;

          // Créer le graphique après avoir reçu les données
          setTimeout(() => this.createStatsChart(), 100);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des statistiques:', error);
        }
      });
  }

  /**
   * Charge les 4 dernières ordonnances
   */
  loadRecentOrdonnances(): void {
    console.log('📋 Chargement des dernières ordonnances pour le docteur:', this.currentDoctorId);

    this.loadingOrdonnances = true;
    this.localGetOrdonnances(this.currentDoctorId, 0, 4)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingOrdonnances = false)
      )
      .subscribe({
        next: (response: OrdonnanceResponse) => {
          console.log('✅ Ordonnances récupérées:', response.content.length);

          this.dernieresOrdonnances = response.content.map(ord => ({
            reference: ord.reference,
            patient: `${ord.patient.prenom} ${ord.patient.nom}`,
            date: this.formatDate(ord.createdAt),
            statut: this.getStatusLabel(ord.status),
            statutClass: this.getStatusClass(ord.status)
          }));
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des ordonnances:', error);
          this.dernieresOrdonnances = [];
        }
      });
  }

  // Local mock for ordonnances (simulates OrdonnanceService.getOrdonnances)
  private mockOrdonnances: Ordonnance[] = [
    {
      id: 1,
      reference: 'ORD-0001',
      doctor: { id: 10, nom: 'Dupont', prenom: 'Jean' },
      patient: { id: 100, nom: 'Martin', prenom: 'Alice' },
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      qrCodeUrl: null as any,
      fullyPaidByDonor: false,
      partiallyPaidByDonor: false,
      pharmacy: {
        id: 1,
        name: 'Pharmacie Centrale',
        address: '1 Rue Principale',
        phone: '000000000',
        email: 'pharmacie@example.com',
        latitude: 0,
        longitude: 0,
        logo: '',
        hourly: null,
        pharmacist: { id: 1, nom: 'Pharm', prenom: 'Admin' }
      },
      amount: 0,
      needsHelp: false,
      address: '1 Rue Principale',
      latitude: 0,
      longitude: 0,
      prescriptionFile: null,
      medications: [
        { id: 1, name: 'Paracétamol', quantity: 2, dosage: '500mg', price: 2.5 }
      ]
    }
  ];

  private localGetOrdonnances(doctorId: number, page: number = 0, size: number = 4) {
    const start = page * size;
    const content = this.mockOrdonnances.slice(start, start + size);
    const response: OrdonnanceResponse = {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { unsorted: true, sorted: false, empty: true },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalPages: Math.ceil(this.mockOrdonnances.length / size),
      totalElements: this.mockOrdonnances.length,
      last: start + content.length >= this.mockOrdonnances.length,
      numberOfElements: content.length,
      size,
      number: page,
      sort: { unsorted: true, sorted: false, empty: true },
      first: page === 0,
      empty: content.length === 0
    };

    return of(response).pipe(delay(250));
  }

  // Local mock to fetch appointments for doctor
  private localGetDoctorAppointments(doctorId: number, page: number = 0, size: number = 3) {
    const mock: AppointmentAPI[] = [
      { id: 1, doctorName: 'Dr Mock', specialty: 'Généraliste', patientName: 'Alice', date: this.formatDateToDDMMYYYY(new Date()), startTime: '09:00', endTime: '09:30', reason: 'Consultation', type: null, status: 'EN_ATTENTE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    const response = { content: mock, totalElements: mock.length, totalPages: 1, number: page, size: mock.length, first: true, last: true } as any;
    return of(response).pipe(delay(180));
  }

  // Local mock for prescriptions KPI
  private localGetPrescriptionsKpi(doctorId: number) {
    const kpi: PrescriptionsKPI = {
      totalPrescriptions: 42,
      todayPrescriptions: 3,
      todayVsYesterdayPercent: 0,
      pendingPrescriptions: 5,
      validatedLast7Days: 10,
      validationRate: 75
    };
    return of(kpi).pipe(delay(220));
  }

  // Local mock for prescriptions stats
  private localGetStat(doctorId: number) {
    const stats: PrescriptionsStats = {
      PENDING: 5,
      ACCEPTED: 12,
      REFUSED: 1,
      IN_PREPARATION: 8,
      READY: 6,
      DELIVERED: 10
    };
    return of(stats).pipe(delay(200));
  }

  /**
   * Charge l'évolution hebdomadaire (simulé pour l'instant)
   */
  loadWeeklyEvolution(): void {
    this.loadingWeeklyChart = true;

    // Simulation de données - À remplacer par un vrai service
    setTimeout(() => {
      this.loadingWeeklyChart = false;
      setTimeout(() => this.createWeeklyChart(), 100);
    }, 500);
  }

  /**
   * Charge les 3 prochains rendez-vous du médecin
   */
  loadAppointments(): void {
    if (!this.currentDoctorId) return;

    this.loadingAppointments = true;

    // Charger avec mock local
    this.localGetDoctorAppointments(this.currentDoctorId, 0, 3).subscribe({
      next: (response: any) => {
        const appointments: AppointmentAPI[] = response.content || [];

        const futureAppointments = appointments
          .filter(apt => this.isAppointmentFuture(apt.date))
          .slice(0, 3);

        this.prochainsRendezVous = futureAppointments.map(apt => this.mapAppointmentToRendezVous(apt));
        this.loadingAppointments = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des rendez-vous (mock):', error);
        this.prochainsRendezVous = [];
        this.loadingAppointments = false;
      }
    });
  }

  /**
   * Vérifie si un rendez-vous est futur
   */
  private isAppointmentFuture(dateStr: string): boolean {
    const [day, month, year] = dateStr.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today;
  }

  /**
   * Mappe un rendez-vous API vers l'interface RendezVous pour l'affichage
   */
  private mapAppointmentToRendezVous(apt: AppointmentAPI): RendezVous {
    const { day, month } = this.formatDateToDayMonth(apt.date);

    return {
      day: day,
      month: month,
      patient: apt.patientName,
      type: apt.reason || apt.type?.name || 'Consultation',
      status: this.mapStatusToDisplay(apt.status),
      statusLabel: this.getAppointmentStatusLabel(apt.status)
    };
  }

  /**
   * Formate une date DD-MM-YYYY en { day: 'DD', month: 'Mois' }
   */
  private formatDateToDayMonth(dateStr: string): { day: string; month: string } {
    const [dayStr, monthStr] = dateStr.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1;

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

    return {
      day: dayStr,
      month: months[monthIndex] || monthStr
    };
  }

  /**
   * Mappe le statut API vers le statut d'affichage
   */
  private mapStatusToDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EN_ATTENTE': 'pending',
      'TERMINE': 'confirmed',
      'ANNULE': 'cancelled'
    };
    return statusMap[status] || 'view';
  }

  /**
   * Obtient le label du statut d'un rendez-vous
   */
  private getAppointmentStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'TERMINE': 'Terminé',
      'ANNULE': 'Annulé'
    };
    return labelMap[status] || 'À venir';
  }

  /**
   * Crée le graphique d'évolution hebdomadaire
   */
  createWeeklyChart(): void {
    if (!this.weeklyChart || !this.weeklyChart.nativeElement) {
      console.warn('⚠️ Canvas weekly chart non disponible');
      return;
    }

    if (this.weeklyChartInstance) {
      this.weeklyChartInstance.destroy();
    }

    const ctx = this.weeklyChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ Impossible d\'obtenir le contexte du canvas weekly');
      return;
    }

    // Données simulées pour l'évolution hebdomadaire (centrées sur aujourd'hui)
    const data = {
      labels: ['Ven', 'Sam', 'Dim', 'Auj', 'Mar', 'Mer', 'Jeu'],
      datasets: [
        {
          label: 'Consultations',
          data: [30, 22, 15, 20, 28, 32, 38],
          borderColor: '#4A90E2',
          backgroundColor: 'transparent',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#4A90E2',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#FFFFFF',
          pointHoverBorderColor: '#4A90E2',
          pointHoverBorderWidth: 2
        }
      ]
    };

    // Plugin pour la ligne verticale en pointillé (aujourd'hui au centre = index 3)
    const verticalLinePlugin = {
      id: 'verticalLine',
      afterDatasetsDraw: (chart: any) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        // Position d'aujourd'hui (index 3 - centre)
        const x = xAxis.getPixelForValue(3);

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#10B981';
        ctx.stroke();
        ctx.restore();
      }
    };

    this.weeklyChartInstance = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#1f2937',
            bodyColor: '#1f2937',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (context) => {
                return context[0].label;
              },
              label: (context) => {
                return `${context.parsed.y} consultations`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 12
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 50,
            ticks: {
              stepSize: 10,
              color: '#6b7280',
              font: {
                size: 11
              }
            },
            grid: {
              color: '#e5e7eb',
              drawTicks: false
            }
          }
        }
      },
      plugins: [verticalLinePlugin]
    });
  }

  /**
   * Crée le graphique des statistiques par statut
   */
  createStatsChart(): void {
    if (!this.medicamentChart || !this.medicamentChart.nativeElement) {
      console.warn('⚠️ Canvas non disponible pour le graphique');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.medicamentChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ Impossible d\'obtenir le contexte du canvas');
      return;
    }

    const statusMapping: { [key: string]: string } = {
      'PENDING': 'En attente',
      'ACCEPTED': 'Acceptée',
      'REFUSED': 'Refusée',
      'IN_PREPARATION': 'En préparation',
      'READY': 'Prête',
      'DELIVERED': 'Livrée'
    };

    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    const statusOrder = ['PENDING', 'ACCEPTED', 'REFUSED', 'IN_PREPARATION', 'READY', 'DELIVERED'];

    statusOrder.forEach(status => {
      if (this.statsData[status] !== undefined) {
        labels.push(statusMapping[status] || status);
        values.push(this.statsData[status]);
        colors.push('#10b981'); // Couleur verte uniforme
      }
    });

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nombre',
          data: values,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 0,
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 20,
          maxBarThickness: 25
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
            backgroundColor: '#ffffff',
            titleColor: '#1f2937',
            bodyColor: '#1f2937',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: (context) => {
                return context[0].label;
              },
              label: (context) => {
                return `${context.parsed.x} prescriptions`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 10,
              color: '#6b7280',
              font: {
                size: 11
              }
            },
            grid: {
              color: '#f3f4f6'
            }
          },
          y: {
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'IN_PREPARATION': 'En préparation',
      'READY': 'Prête',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
      'ACCEPTED': 'Acceptée',
      'REFUSED': 'Refusée'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'IN_PREPARATION': 'bg-blue-100 text-blue-700',
      'READY': 'bg-green-100 text-green-700',
      'DELIVERED': 'bg-purple-100 text-purple-700',
      'CANCELLED': 'bg-red-100 text-red-700',
      'ACCEPTED': 'bg-green-100 text-green-700',
      'REFUSED': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period;
    // TODO: Implémenter le filtrage par période
  }

  exportData(): void {
    console.log('📤 Export des données...');
    // TODO: Implémenter l'export des données
  }

  refreshDashboard(): void {
    console.log('🔄 Rafraîchissement du dashboard...');
    this.loadDashboardData();
  }

  retry(): void {
    console.log('🔄 Nouvelle tentative de chargement');
    this.error = false;
    this.errorMessage = '';
    this.loadDashboardData();
  }
}