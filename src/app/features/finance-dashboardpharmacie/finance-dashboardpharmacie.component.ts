import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VersementsEtablissementComponent } from '../finance-versements/versements-etablissement.component';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// Local RevenueLast7Days type (inlined from pharmacie.service)
interface RevenueLast7Days {
  date: string;
  total: number;
}
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  iconColor: string;
}

interface Transaction {
  date: string;
  id: string;
  amount: string;
  patient: string;
  paymentMethod: string;
  status: string;
  statusColor: string;
}

interface User {
  id: number;
  pharmacyId?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  profil?: string;
}

@Component({
  selector: 'app-finance-dashboardpharmacie',
  standalone: true,
  imports: [CommonModule, FormsModule, VersementsEtablissementComponent],
  templateUrl: './finance-dashboardpharmacie.component.html',
  styleUrls: ['./finance-dashboardpharmacie.component.css']
})
export class FinanceDashboardpharmacieComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;

  // Gestion du cycle de vie
  private destroy$ = new Subject<void>();

  // Données utilisateur et pharmacie
  selectedPeriod: string = 'Ce mois';
  pharmacyId: number | null = null;
  userId: number | null = null;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;

  // Cartes statistiques - Initialisées vides
  statsCards: StatCard[] = [];

  // Transactions et graphique
  recentTransactions: Transaction[] = [];
  revenueChart: Chart<'line'> | null = null;
  isLoading: boolean = false;
  isExporting: boolean = false;
  Math: any = Math;

  // Messages d'erreur
  errorMessage: string = '';
  showError: boolean = false;

  constructor() {
    console.log('💊 FinanceDashboardpharmacieComponent initialisé');
    this.initializeStatsCards();
  }

  // Local mock current user + fetcher (replaces AuthFacade)
  private getMockCurrentUser(): User {
    return {
      id: 5,
      pharmacyId: 1,
      nom: 'Pharmacie Centrale',
      prenom: 'Admin',
      telephone: '+221770000000'
    };
  }

  private localGetCurrentUserById(userId: number): Observable<User> {
    const mock: User = {
      id: userId,
      pharmacyId: 1,
      nom: 'Pharmacie Centrale',
      prenom: 'Admin',
      telephone: '+221770000000'
    };
    return of(mock).pipe(delay(120));
  }

  // Local mock/state for sandbox mode
  private mockSolde: number = 125420;
  private mockTotalYear: number = 4523000;
  private mockTotalMonth: number = 352400;
  private mockPendingCount: number = 7;
  private mockPayments: any[] = [];

  private initMockPayments(): void {
    if (this.mockPayments.length) return;
    for (let i = 1; i <= 23; i++) {
      const amount = Math.floor(Math.random() * 15000) + 500;
      const status = i % 5 === 0 ? 'FAILED' : (i % 3 === 0 ? 'PENDING' : 'COMPLETED');
      this.mockPayments.push({
        id: i,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        paidAt: new Date(Date.now() - i * 86400000).toISOString(),
        amount,
        method: i % 2 === 0 ? 'CARD' : 'CASH',
        status,
        prescription: {
          patient: { prenom: `Patient${i}`, nom: `Demo` }
        }
      });
    }
  }

  private localGetSoldeDashboard(pharmacyId: number): Observable<any> {
    return of({ solde: this.mockSolde }).pipe(delay(200));
  }

  private localGetStatsSlate(pharmacyId: number): Observable<any> {
    return of({ totalYearAmount: this.mockTotalYear, totalMonthAmount: this.mockTotalMonth }).pipe(delay(220));
  }

  private localGetPendingPayment(pharmacyId: number): Observable<any> {
    return of({ count: this.mockPendingCount }).pipe(delay(160));
  }

  private localGetPaymentHistoric(pharmacyId: number, page: number, size: number): Observable<any> {
    this.initMockPayments();
    const start = page * size;
    const content = this.mockPayments.slice(start, start + size);
    const response = {
      content,
      totalPages: Math.max(1, Math.ceil(this.mockPayments.length / size)),
      totalElements: this.mockPayments.length,
      number: page
    };
    return of(response).pipe(delay(250));
  }

  private localGetRevenuLast7days(pharmacyId: number): Observable<RevenueLast7Days[]> {
    const days: RevenueLast7Days[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({ date: date.toISOString(), total: Math.floor(Math.random() * 50000) });
    }
    return of(days).pipe(delay(220));
  }

  ngOnInit() {
    console.log('%c[INIT] Finance Dashboard chargé', 'color: blue; font-weight: bold');
    this.initializeDashboard();
  }

  ngAfterViewInit() {
    console.log('✅ View initialisée, canvas prêt');
  }

  ngOnDestroy() {
    console.log('🔴 Destruction du composant');
    this.destroy$.next();
    this.destroy$.complete();

    if (this.revenueChart) {
      this.revenueChart.destroy();
      this.revenueChart = null;
    }
  }

  /**
   * Initialise les cartes statistiques avec les valeurs par défaut
   */
  private initializeStatsCards(): void {
    this.statsCards = [
      {
        title: 'Solde Disponible',
        value: '0 F',
        subtitle: 'Disponible pour retrait',
        iconColor: '#10B981'
      },
      {
        title: 'Total des Ventes',
        value: '0 F',
        subtitle: 'Depuis le début de l\'année',
        iconColor: '#3B82F6'
      },
      {
        title: 'Revenus du Mois',
        value: '0 F',
        subtitle: 'Mois en cours',
        iconColor: '#F59E0B'
      },
      {
        title: 'Ventes en Attente',
        value: '0',
        subtitle: 'En attente de validation',
        iconColor: '#10B981'
      }
    ];
  }

  /**
   * Initialise le dashboard en récupérant d'abord le pharmacyId
   */
  private initializeDashboard(): void {
    console.log('[INIT] 🚀 Démarrage initialisation dashboard');

    this.isLoading = true;

    const currentUser = this.getMockCurrentUser();

    if (!currentUser || !currentUser.id) {
      console.error('❌ Aucun utilisateur connecté trouvé');
      this.showErrorMessage('Impossible de récupérer les informations utilisateur');
      this.isLoading = false;
      return;
    }

    this.userId = currentUser.id;
    console.log('✅ User ID récupéré:', this.userId);

    this.localGetCurrentUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          console.log('✅ Utilisateur complet récupéré:', user);

          if (!user.pharmacyId) {
            console.error('❌ Aucun pharmacyId trouvé pour l\'utilisateur');
            this.showErrorMessage('Aucune pharmacie associée à votre compte');
            this.isLoading = false;
            return;
          }

          this.pharmacyId = user.pharmacyId;
          console.log('✅ Pharmacy ID récupéré:', this.pharmacyId);

          this.loadDashboardData();
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données utilisateur:', error);
          this.showErrorMessage('Erreur lors du chargement de vos informations');
          this.isLoading = false;
        }
      });
  }

  /**
   * Charge toutes les données du dashboard
   */
  private loadDashboardData(): void {
    if (!this.pharmacyId) {
      console.error('❌ ID de pharmacie non disponible');
      return;
    }

    console.log('📊 Chargement des données du dashboard pour pharmacie:', this.pharmacyId);

    this.loadSoldeDisponible();
    this.loadStats();
    this.loadPendingPayments();
    this.loadPaymentHistory(this.currentPage, this.pageSize);
    this.loadRevenuLast7Days();
  }

  /**
   * Charge le solde disponible
   */
  private loadSoldeDisponible(): void {
    if (!this.pharmacyId) return;

    console.log('💰 Chargement du solde pour pharmacie:', this.pharmacyId);

    this.localGetSoldeDashboard(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('📥 Réponse solde brute:', response);
          const solde = response?.solde !== undefined ? response.solde : (typeof response === 'number' ? response : 0);
          this.statsCards[0].value = this.formatAmount(solde);
          console.log('✅ Solde mis à jour:', this.statsCards[0].value);
        },
        error: (error) => {
          console.error('❌ Erreur chargement solde:', error);
          this.statsCards[0].value = '0 F';
        }
      });
  }

  /**
   * Charge les statistiques (Total ventes et Revenus du mois)
   */
  private loadStats(): void {
    if (!this.pharmacyId) return;

    console.log('📈 Chargement des stats pour pharmacie:', this.pharmacyId);

    this.localGetStatsSlate(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('📥 Réponse stats brute:', response);

          const totalYear = response.totalYearAmount || 0;
          const totalMonth = response.totalMonthAmount || 0;

          this.statsCards[1].value = this.formatAmount(totalYear);
          this.statsCards[2].value = this.formatAmount(totalMonth);

          console.log('✅ Stats mises à jour - Année:', totalYear, 'Mois:', totalMonth);
        },
        error: (error) => {
          console.error('❌ Erreur chargement statistiques:', error);
          this.statsCards[1].value = '0 F';
          this.statsCards[2].value = '0 F';
        }
      });
  }

  /**
   * Charge le nombre de ventes en attente
   */
  private loadPendingPayments(): void {
    if (!this.pharmacyId) return;

    console.log('⏳ Chargement des paiements en attente pour pharmacie:', this.pharmacyId);

    this.localGetPendingPayment(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('📥 Réponse paiements en attente:', response);
          const count = response.count || 0;
          this.statsCards[3].value = count.toString().padStart(2, '0');
          console.log('✅ Paiements en attente mis à jour:', count);
        },
        error: (error) => {
          console.error('❌ Erreur chargement paiements en attente:', error);
          this.statsCards[3].value = '00';
        }
      });
  }

  /**
   * Charge l'historique des paiements avec pagination
   */
  private loadPaymentHistory(page: number, size: number): void {
    if (!this.pharmacyId) return;

    console.log('📜 Chargement historique page:', page, 'size:', size);

    this.localGetPaymentHistoric(this.pharmacyId, page, size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('📥 Réponse historique:', response);

          this.recentTransactions = response.content.map((payment: any) => {
            const patientName = payment.prescription?.patient
              ? `${payment.prescription.patient.prenom || ''} ${payment.prescription.patient.nom || ''}`.trim()
              : 'N/A';

            return {
              date: this.formatDate(payment.createdAt || payment.paidAt),
              id: `TXN-${payment.id}`,
              amount: this.formatAmount(payment.amount),
              patient: patientName,
              paymentMethod: this.getPaymentMethodLabel(payment.method || payment.paymentMethod),
              status: this.getStatusLabel(payment.status || 'COMPLETED'),
              statusColor: this.getStatusColor(payment.status || 'COMPLETED')
            };
          });

          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.currentPage = response.number;
          this.isLoading = false;

          console.log('✅ Historique chargé:', response.content.length, 'transactions');
        },
        error: (error) => {
          console.error('❌ Erreur chargement historique:', error);
          this.recentTransactions = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * Charge les revenus des 7 derniers jours et crée le graphique
   */
  private loadRevenuLast7Days(): void {
    if (!this.pharmacyId) {
      console.error('❌ Impossible de charger les revenus sans pharmacyId');
      return;
    }

    console.log('📈 [REVENU] Chargement revenus 7 derniers jours pour pharmacie:', this.pharmacyId);

    this.localGetRevenuLast7days(this.pharmacyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RevenueLast7Days[]) => {
          console.log('📥 [REVENU] Réponse API brute:', JSON.stringify(response, null, 2));

          if (!response || !Array.isArray(response)) {
            console.warn('⚠️ [REVENU] Réponse invalide ou non-array:', response);
            this.createRevenueChart([], []);
            return;
          }

          if (response.length === 0) {
            console.warn('⚠️ [REVENU] Tableau vide reçu');
            this.createRevenueChart([], []);
            return;
          }

          console.log('✅ [REVENU] Nombre d\'éléments reçus:', response.length);

          const labels = response.map(item => {
            const label = this.formatDateForChart(item.date);
            console.log('📅 [REVENU] Date:', item.date, '→ Label:', label);
            return label;
          });

          const data = response.map(item => {
            const value = item.total || 0;
            console.log('💰 [REVENU] Total:', value);
            return value;
          });

          console.log('📊 [REVENU] Labels finaux:', labels);
          console.log('📊 [REVENU] Data finales:', data);
          console.log('💵 [REVENU] Somme totale:', data.reduce((sum, val) => sum + val, 0));

          setTimeout(() => {
            console.log('🎨 [REVENU] Création du graphique...');
            this.createRevenueChart(labels, data);
          }, 150);
        },
        error: (error) => {
          console.error('❌ [REVENU] Erreur chargement revenus:', error);
          setTimeout(() => {
            this.createRevenueChart([], []);
          }, 150);
        }
      });
  }

  /**
   * Crée le graphique d'évolution des revenus
   */
  private createRevenueChart(labels: string[], data: number[]): void {
    console.log('🎨 [CHART] Création du graphique');
    console.log('🎨 [CHART] Labels:', labels);
    console.log('🎨 [CHART] Data:', data);

    if (!this.revenueChartRef || !this.revenueChartRef.nativeElement) {
      console.error('❌ [CHART] Canvas non disponible');
      return;
    }

    const ctx = this.revenueChartRef.nativeElement.getContext('2d');

    if (!ctx) {
      console.error('❌ [CHART] Impossible d\'obtenir le contexte 2D');
      return;
    }

    if (this.revenueChart) {
      console.log('🗑️ [CHART] Destruction du graphique existant');
      this.revenueChart.destroy();
      this.revenueChart = null;
    }

    // Utiliser les données réelles ou des données par défaut
    const hasData = data.length > 0;
    const chartLabels = hasData ? labels : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const chartData = hasData ? data : [0, 0, 0, 0, 0, 0, 0];

    const maxValue = Math.max(...chartData, 100);
    const minValue = Math.min(...chartData, 0);

    console.log('📊 [CHART] Échelle - Min:', minValue, 'Max:', maxValue);
    console.log('📊 [CHART] Utilisation données réelles:', hasData);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Revenus (F CFA)',
          data: chartData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#2563EB',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                console.log('🖱️ [CHART] Tooltip hover valeur:', value);
                return 'Revenus: ' + this.formatAmount(value);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            suggestedMax: maxValue > 0 ? Math.ceil(maxValue * 1.2) : 1000,
            grid: {
              color: '#F3F4F6',
              // drawBorder: false
            },
            ticks: {
              font: {
                size: 11
              },
              callback: (value) => {
                return this.formatAmount(Number(value));
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
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    try {
      this.revenueChart = new Chart(ctx, config);
      console.log('✅ [CHART] Graphique créé avec succès');
      console.log('✅ [CHART] Instance:', this.revenueChart);
    } catch (error) {
      console.error('❌ [CHART] Erreur lors de la création du graphique:', error);
    }
  }

  /**
   * Gestion du changement de période
   */
  onPeriodChange(): void {
    console.log('📅 Période changée:', this.selectedPeriod);
    this.loadDashboardData();
  }

  /**
   * Export des données en Excel
   */
  exportData(): void {
    console.log('Export des données demandé');
    this.isExporting = true;

    try {
      const wb = XLSX.utils.book_new();
      const timestamp = new Date().toISOString().split('T')[0];

      // Sheet 1: Statistiques Financières
      const statsData: any[][] = [];
      statsData.push(['TABLEAU DE BORD FINANCIER']);
      statsData.push([`Généré le : ${new Date().toLocaleString('fr-FR')}`]);
      statsData.push([]);

      const soldeValue = this.statsCards[0]?.value?.replace(' F', '') ?? 'N/A';
      const ventesAnneeValue = this.statsCards[1]?.value?.replace(' F', '') ?? 'N/A';
      const revenusMoisValue = this.statsCards[2]?.value?.replace(' F', '') ?? 'N/A';
      const ventesAttenteValue = this.statsCards[3]?.value ?? 'N/A';

      statsData.push(['Métrique', 'Valeur']);
      statsData.push(['Solde Disponible', soldeValue]);
      statsData.push(['Total des Ventes (année)', ventesAnneeValue]);
      statsData.push(['Revenus du Mois', revenusMoisValue]);
      statsData.push(['Ventes en Attente', ventesAttenteValue]);
      statsData.push(['Période sélectionnée', this.selectedPeriod]);

      const ws1 = XLSX.utils.aoa_to_sheet(statsData);
      ws1['!cols'] = [
        { wch: 30 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Statistiques');

      // Sheet 2: Historique des Transactions
      const transactionsData: any[][] = [];
      transactionsData.push(['HISTORIQUE DES TRANSACTIONS']);
      transactionsData.push([]);
      transactionsData.push([
        'Date',
        'ID Transaction',
        'Patient',
        'Montant (F)',
        'Méthode de Paiement',
        'Statut'
      ]);

      if (this.recentTransactions.length > 0) {
        this.recentTransactions.forEach(tx => {
          const amount = tx.amount?.replace(' F', '') ?? 'N/A';
          transactionsData.push([
            tx.date,
            tx.id,
            tx.patient,
            amount,
            tx.paymentMethod,
            tx.status
          ]);
        });

        const totalAmount = this.recentTransactions.reduce((sum, tx) => {
          const amount = parseInt(tx.amount?.replace(' F', '') ?? '0', 10);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        transactionsData.push([]);
        transactionsData.push(['TOTAL', '', '', totalAmount, '', '']);
      } else {
        transactionsData.push(['Aucune transaction disponible', '', '', '', '', '']);
      }

      const ws2 = XLSX.utils.aoa_to_sheet(transactionsData);
      ws2['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Transactions');

      // Sheet 3: Revenus avec appel API
      this.localGetRevenuLast7days(this.pharmacyId!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (revenueData: RevenueLast7Days[]) => {
            const revenueSheet: any[][] = [];
            revenueSheet.push(['REVENUS - 7 DERNIERS JOURS']);
            revenueSheet.push([]);
            revenueSheet.push(['Date', 'Montant (F)']);

            let totalRevenue = 0;
            if (revenueData && Array.isArray(revenueData)) {
              revenueData.forEach(item => {
                const label = this.formatDateForChart(item.date);
                const value = item.total || 0;
                revenueSheet.push([label, value]);
                totalRevenue += value;
              });
            }

            revenueSheet.push([]);
            revenueSheet.push(['TOTAL', totalRevenue]);

            const ws3 = XLSX.utils.aoa_to_sheet(revenueSheet);
            ws3['!cols'] = [
              { wch: 25 },
              { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, ws3, 'Revenus 7j');

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, `finance-pharmacie-${timestamp}.xlsx`);
            this.isExporting = false;
            console.log('Export Excel réussi');
          },
          error: (error) => {
            console.error('Erreur lors du chargement des revenus:', error);
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, `finance-pharmacie-${timestamp}.xlsx`);
            this.isExporting = false;
          }
        });

    } catch (err) {
      console.error('Erreur lors de l\'export Excel :', err);
      this.isExporting = false;
    }
  }

  /**
   * Navigation pagination
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      console.log('📄 Navigation vers page:', page);
      this.loadPaymentHistory(page, this.pageSize);
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Utilitaires de formatage
   */
  formatAmount(amount: number): string {
    if (isNaN(amount)) return '0 F';
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' F';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  formatDateForChart(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('fr-FR', { month: 'short' });
      return `${day} ${month}`;
    } catch (e) {
      return '';
    }
  }

  getPaymentMethodLabel(method: string): string {
    const methods: Record<string, string> = {
      'CARD': 'Carte Bancaire',
      'CASH': 'Espèces',
      'CHECK': 'Chèque',
      'MOBILE': 'Mobile Money',
      'TRANSFER': 'Virement'
    };
    return methods[method] || method;
  }

  getStatusLabel(status: string): string {
    const statuses: Record<string, string> = {
      'COMPLETED': 'Réussie',
      'PENDING': 'En attente',
      'FAILED': 'Échouée',
      'CANCELLED': 'Annulée',
      'SUCCESS': 'Réussie'
    };
    return statuses[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'COMPLETED': '#10B981',
      'SUCCESS': '#10B981',
      'PENDING': '#F59E0B',
      'FAILED': '#EF4444',
      'CANCELLED': '#6B7280'
    };
    return colors[status] || '#6B7280';
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;

    setTimeout(() => {
      this.showError = false;
    }, 5000);
  }
}