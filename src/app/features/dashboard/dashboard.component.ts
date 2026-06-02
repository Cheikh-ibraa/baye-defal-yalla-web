import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DashboardService, PharmacyCounter, DeliveryEvolution, PaymentStats, PeriodType } from '../../services/dashboard.service';
import { AuthService, User } from '../../services/auth.service';
import { PharmacieService, PharmacyByPharmacistInfo } from '../../services/pharmacie.service';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieChart', { static: false }) pieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart', { static: false }) lineChart!: ElementRef<HTMLCanvasElement>;

  isBrowser: boolean = false;
  isOpen = false;
  selectedRegion = '';
  selectedPeriod: PeriodType = 'WEEKLY';

  // ID de la pharmacie récupéré dynamiquement
  pharmacyId: number = 0;
  currentUser: User | null = null;

  // Données de la pharmacie (header)
  pharmacyInfo: PharmacyByPharmacistInfo | null = null;
  isLoadingPharmacyInfo = true;
  pharmacyInfoError = false;
  readonly filesBaseUrl = environment.filesUrl;

  // Données dynamiques
  pharmacyCounter: PharmacyCounter | null = null;
  paymentStats: PaymentStats | null = null;
  deliveryEvolution: DeliveryEvolution[] = [];

  // Variables pour les graphiques
  pieChartInstance: Chart | null = null;
  lineChartInstance: Chart | null = null;

  // Loading states
  isLoadingCounter = true;
  isLoadingPayments = true;
  isLoadingEvolution = true;
  isLoadingUser = true;
  isExporting = false;

  // États d'erreur
  error: boolean = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private pharmacieService: PharmacieService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('❌ Aucun utilisateur connecté');
      this.error = true;
      this.errorMessage = 'Vous devez être connecté pour accéder à cette page';
      this.router.navigate(['/login']);
      return;
    }


    // Si l'utilisateur n'a pas de pharmacyId OU si les données semblent incomplètes, recharger depuis l'API
    if ((!currentUser.pharmacyId || currentUser.pharmacyId === null) && currentUser.id) {
      this.loadCompleteUserData(currentUser.id);
    } else if (currentUser.pharmacyId) {
      // L'utilisateur a déjà le pharmacyId
      this.initializeWithUser(currentUser);
    } else {
      console.error('❌ ID utilisateur manquant');
      this.error = true;
      this.errorMessage = 'Erreur lors de la récupération de vos informations';
      this.isLoadingUser = false;
      return;
    }
  }

  /**
   * Charge les données complètes de l'utilisateur depuis l'API
   */
  private loadCompleteUserData(userId: number): void {
    this.isLoadingUser = true;

    this.authService.getCurrentUserById(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {

          // Mettre à jour le localStorage avec les données complètes
          localStorage.setItem('user_data', JSON.stringify(user));

          // Mettre à jour le BehaviorSubject dans AuthService
          this.authService['currentUserSubject'].next(user);

          this.isLoadingUser = false;
          this.initializeWithUser(user);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données utilisateur:', error);
          this.error = true;
          this.errorMessage = 'Impossible de charger vos informations utilisateur';
          this.isLoadingUser = false;
        }
      });
  }

  /**
   * Initialise le dashboard avec les données utilisateur
   */
  private initializeWithUser(user: User): void {
    this.currentUser = user;



    // Vérifier que l'utilisateur appartient à une pharmacie
    if (!user.pharmacyId || user.pharmacyId === null) {
      console.error('❌ Aucune pharmacie associée à cet utilisateur');
      console.error('💡 Données utilisateur reçues:', JSON.stringify(user, null, 2));
      this.error = true;
      this.errorMessage = `Aucune pharmacie associée à votre compte. Veuillez contacter l'administrateur pour vous assigner une pharmacie.`;
      this.isLoadingCounter = false;
      this.isLoadingPayments = false;
      this.isLoadingEvolution = false;
      return;
    }

    this.pharmacyId = user.pharmacyId;

    this.loadPharmacyInfo(user.id);
    this.loadDashboardData();
  }

  /**
   * Charge les informations de la pharmacie depuis l'endpoint by-pharmacist
   */
  private loadPharmacyInfo(pharmacistId: number): void {
    this.isLoadingPharmacyInfo = true;
    this.pharmacyInfoError = false;

    this.pharmacieService.getPharmacyByPharmacist(pharmacistId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pharmacyInfo = data;
          this.isLoadingPharmacyInfo = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des infos pharmacie:', error);
          this.pharmacyInfoError = true;
          this.isLoadingPharmacyInfo = false;
        }
      });
  }

  /**
   * Retourne l'URL complète du logo de la pharmacie
   */
  getLogoUrl(): string | null {
    if (!this.pharmacyInfo?.logo) return null;
    return `${this.filesBaseUrl}/${this.pharmacyInfo.logo}`;
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.createCharts();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Détruire les graphiques pour éviter les fuites mémoire
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }
    if (this.lineChartInstance) {
      this.lineChartInstance.destroy();
    }
  }

  loadDashboardData(): void {
    this.loadPharmatieCounter();
    this.loadPaymentStats();
    this.loadDeliveryEvolution();
  }

  loadPharmatieCounter(): void {
    this.isLoadingCounter = true;

    this.dashboardService.getPharmatieCounter(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pharmacyCounter = data;
          this.isLoadingCounter = false;

          // Mettre à jour le graphique en camembert si disponible
          if (this.pieChartInstance) {
            this.updatePieChart();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des compteurs:', error);
          this.isLoadingCounter = false;
          this.handleError('Erreur lors du chargement des compteurs', error);
        }
      });
  }

  loadPaymentStats(): void {
    this.isLoadingPayments = true;

    this.dashboardService.getPaymentState(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.paymentStats = data;
          this.isLoadingPayments = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des stats de paiement:', error);
          this.isLoadingPayments = false;
          this.handleError('Erreur lors du chargement des statistiques de paiement', error);
        }
      });
  }

  loadDeliveryEvolution(): void {
    this.isLoadingEvolution = true;

    this.dashboardService.getEvolution(this.pharmacyId, this.selectedPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.deliveryEvolution = data;
          this.isLoadingEvolution = false;

          // Mettre à jour le graphique linéaire si disponible
          if (this.lineChartInstance) {
            this.updateLineChart();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement de l\'évolution:', error);
          this.isLoadingEvolution = false;
          this.handleError('Erreur lors du chargement de l\'évolution des livraisons', error);
        }
      });
  }

  onPeriodChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPeriod = target.value as PeriodType;
    this.loadDeliveryEvolution();
  }

  onCardClick(cardTitle: string): void {
    // Ajoutez ici votre logique de navigation
    // Exemple: this.router.navigate(['/orders'], { queryParams: { status: cardTitle } });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  exportToPDF(): void {
    this.closeDropdown();
    // TODO: Implémenter l'export PDF
  }

  exportToExcel(): void {
    this.closeDropdown();
    this.isExporting = true;

    try {
      const wb = XLSX.utils.book_new();
      const timestamp = new Date().toISOString().split('T')[0];

      // ── Feuille 1 : Vue d'ensemble ──────────────────────────────────────
      const overviewData: any[][] = [];

      // Section : Informations générales
      overviewData.push(['TABLEAU DE BORD PHARMACIE']);
      overviewData.push([`Généré le : ${new Date().toLocaleString('fr-FR')}`]);
      overviewData.push([`Pharmacie : ${this.pharmacyInfo?.name ?? '—'}  •  Pharmacien : ${this.pharmacyInfo?.pharmacist?.prenom ?? ''} ${this.pharmacyInfo?.pharmacist?.nom ?? ''}`]);
      overviewData.push([]);

      // Section : Compteurs de commandes
      overviewData.push(['--- STATISTIQUES DES COMMANDES ---']);
      overviewData.push(['Statut', 'Nombre', 'Pourcentage (%)']);
      overviewData.push(['En attente', this.pharmacyCounter?.pendingCount ?? 0, this.pharmacyCounter?.pendingPercentage ?? 0]);
      overviewData.push(['En préparation', this.pharmacyCounter?.inPreparationCount ?? 0, this.pharmacyCounter?.inPreparationPercentage ?? 0]);
      overviewData.push(['Prêtes', this.pharmacyCounter?.readyCount ?? 0, this.pharmacyCounter?.readyPercentage ?? 0]);
      overviewData.push(['Livrées', this.pharmacyCounter?.deliveredCount ?? 0, this.pharmacyCounter?.deliveredPercentage ?? 0]);
      overviewData.push(['Temps moyen de préparation', this.pharmacyCounter?.averagePrepTime ?? '—', '']);
      overviewData.push([]);

      // Section : Revenus
      overviewData.push(['--- VUE D\'ENSEMBLE DES REVENUS ---']);
      overviewData.push(['Période', 'Montant (Fcfa)']);
      overviewData.push(["Aujourd'hui", this.paymentStats?.todayTotal ?? 0]);
      overviewData.push(['Hier', this.paymentStats?.yesterdayTotal ?? 0]);
      overviewData.push(['7 derniers jours', this.paymentStats?.last7DaysTotal ?? 0]);
      overviewData.push(['30 derniers jours', this.paymentStats?.last30DaysTotal ?? 0]);

      const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
      ws1['!cols'] = [
        { wch: 35 },
        { wch: 18 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Vue d\'ensemble');

      // ── Feuille 2 : Évolution des livraisons ─────────────────────────────
      const evolutionData: any[][] = [];
      evolutionData.push(['ÉVOLUTION DES LIVRAISONS']);
      evolutionData.push([`Période : ${this.selectedPeriod === 'DAILY' ? 'Quotidienne' : this.selectedPeriod === 'WEEKLY' ? 'Hebdomadaire' : 'Mensuelle'}`]);
      evolutionData.push([]);
      evolutionData.push(['Période', 'Nombre de livraisons']);

      if (this.deliveryEvolution.length > 0) {
        this.deliveryEvolution.forEach(item => {
          evolutionData.push([item.label, item.count]);
        });
        // Ligne totale
        const totalDeliveries = this.deliveryEvolution.reduce((sum, item) => sum + item.count, 0);
        evolutionData.push([]);
        evolutionData.push(['TOTAL', totalDeliveries]);
      } else {
        evolutionData.push(['Aucune donnée disponible', '']);
      }

      const ws2 = XLSX.utils.aoa_to_sheet(evolutionData);
      ws2['!cols'] = [
        { wch: 25 },
        { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Évolution des livraisons');

      // ── Génération et téléchargement ────────────────────────────────────
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `dashboard-medecin-${timestamp}.xlsx`);

    } catch (err) {
      console.error('❌ Erreur lors de l\'export Excel :', err);
    } finally {
      this.isExporting = false;
    }
  }

  createCharts(): void {
    if (!this.isBrowser) return;

    this.createPieChart();
    this.createLineChart();
  }

  createPieChart(): void {
    const ctx = this.pieChart?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Contexte du graphique camembert non disponible');
      return;
    }

    this.pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['En attente', 'Préparation', 'Prêtes', 'Livrées'],
        datasets: [{
          data: this.getPieChartData(),
          backgroundColor: [
            '#FDE047', // Jaune - En attente
            '#60A5FA', // Bleu clair - Préparation  
            '#2563EB', // Bleu - Prêtes
            '#14B8A6', // Teal - Livrées
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  createLineChart(): void {
    const ctx = this.lineChart?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Contexte du graphique linéaire non disponible');
      return;
    }

    this.lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.getLineChartLabels(),
        datasets: [{
          label: 'Commandes livrées',
          data: this.getLineChartData(),
          borderColor: '#14B8A6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointBackgroundColor: '#14B8A6',
          pointBorderColor: '#14B8A6',
          pointRadius: 4,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F3F4F6' },
            border: { display: false },
            ticks: { stepSize: 2 }
          }
        },
        plugins: {
          legend: { display: false }
        },
        elements: {
          point: { hoverRadius: 6 }
        }
      }
    });
  }

  updatePieChart(): void {
    if (this.pieChartInstance && this.pharmacyCounter) {
      this.pieChartInstance.data.datasets[0].data = this.getPieChartData();
      this.pieChartInstance.update();
    }
  }

  updateLineChart(): void {
    if (this.lineChartInstance) {
      this.lineChartInstance.data.labels = this.getLineChartLabels();
      this.lineChartInstance.data.datasets[0].data = this.getLineChartData();
      this.lineChartInstance.update();
    }
  }

  getPieChartData(): number[] {
    if (!this.pharmacyCounter) {
      return [0, 0, 0, 0];
    }
    return [
      this.pharmacyCounter.pendingPercentage,
      this.pharmacyCounter.inPreparationPercentage,
      this.pharmacyCounter.readyPercentage,
      this.pharmacyCounter.deliveredPercentage
    ];
  }

  getLineChartLabels(): string[] {
    return this.deliveryEvolution.map(item => item.label);
  }

  getLineChartData(): number[] {
    return this.deliveryEvolution.map(item => item.count);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' Fcfa';
  }

  /**
   * Gère les erreurs de manière centralisée
   */
  private handleError(context: string, error: any): void {
    console.error(`❌ ${context}:`, error);
    this.error = true;
    this.errorMessage = `${context}. Veuillez réessayer.`;
  }

  /**
   * Réessaye de charger toutes les données
   */
  retry(): void {
    this.error = false;
    this.errorMessage = '';

    // Recharger les données utilisateur si nécessaire
    if (!this.pharmacyId && this.currentUser?.id) {
      this.loadCompleteUserData(this.currentUser.id);
    } else if (this.pharmacyId) {
      this.loadDashboardData();
    }
  }

  /**
   * Rafraîchit le dashboard
   */
  refreshDashboard(): void {
    this.loadDashboardData();
  }
}