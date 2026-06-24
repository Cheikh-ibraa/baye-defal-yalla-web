import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon: string;
  iconColor: string;
  loading?: boolean;
}

interface MedecinRow {
  keycloakId: string;
  name: string;
  initials: string;
  speciality: string;
  isActive: boolean;
  ordonnancesEmises: number;
  ordonnancesValidees: number;
  enAttente: number;
  tauxValidation: number;
}

@Component({
  selector: 'app-medecins-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medecins.component.html',
  styleUrls: ['./medecins.component.css']
})
export class MedecinsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('monthlyChart')   monthlyChartRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('topMedecinChart') topMedecinChartRef!: ElementRef<HTMLCanvasElement>;

  Math = Math;
  searchTerm = '';
  selectedSpecialty = 'all';
  itemsPerPage = 10;
  currentPage = 1;
  loading = false;
  loadError = '';
  loadingStats = true;
  savingId: string | null = null;

  specialties: string[] = [];
  allMedecins: MedecinRow[] = [];
  filteredMedecins: MedecinRow[] = [];
  paginatedMedecins: MedecinRow[] = [];
  totalPages = 1;

  statsCards: StatCard[] = [
    { title: 'Médecins Actifs',       value: '—', subtitle: 'Chargement...', icon: 'med',      iconColor: 'bg-white-50 shadow md', loading: true },
    { title: 'Ordonnances totales',   value: '—', subtitle: 'Chargement...', icon: 'document', iconColor: 'bg-white-50 shadow md', loading: true },
    { title: 'Taux de validation',    value: '—', subtitle: 'Chargement...', icon: 'check',    iconColor: 'bg-white-50 shadow md', loading: true },
    { title: 'En attente',            value: '—', subtitle: 'Chargement...', icon: 'clock',    iconColor: 'bg-white-50 shadow md', loading: true },
  ];

  private monthlyChart: Chart | null  = null;
  private topChart: Chart | null      = null;
  private readonly api = environment.baseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.monthlyChart?.destroy();
    this.topChart?.destroy();
  }

  private loadAll(): void {
    this.loading = true;
    this.loadingStats = true;

    forkJoin({
      doctors: this.http.get<any[]>(`${this.api}/admin/doctors`),
      stats:   this.http.get<any>(`${this.api}/admin/doctors/stats`),
    }).subscribe({
      next: ({ doctors, stats }) => {
        // Build table rows
        this.allMedecins = (doctors || []).map(d => this.mapRow(d));
        this.specialties = [...new Set(this.allMedecins.map(m => m.speciality).filter(Boolean))];
        this.loading = false;
        this.filterMedecins();

        // Fill stat cards
        const active   = stats.active  ?? 0;
        const total    = stats.total   ?? 0;
        const rate     = stats.validationRate ?? 0;
        const pending  = stats.prescriptions?.pending ?? 0;
        const ordTotal = stats.prescriptions?.total ?? 0;
        const pct = total > 0 ? Math.round((active / total) * 100) : 0;

        this.statsCards = [
          { title: 'Médecins Actifs',     value: String(active).padStart(2, '0'), subtitle: 'Ce mois', trend: 'up', trendValue: `${pct}% du total`, icon: 'med',      iconColor: 'bg-white-50 shadow md', loading: false },
          { title: 'Ordonnances totales', value: String(ordTotal),                subtitle: 'Ce mois',             icon: 'document', iconColor: 'bg-white-50 shadow md', loading: false },
          { title: 'Taux de validation',  value: `${rate}%`,                      subtitle: 'vs mois dernier', trend: 'up', trendValue: '', icon: 'check', iconColor: 'bg-white-50 shadow md', loading: false },
          { title: 'En attente',          value: String(pending),                 subtitle: 'Ordonnances',         icon: 'clock',    iconColor: 'bg-white-50 shadow md', loading: false },
        ];
        this.loadingStats = false;

        // Build charts after DOM is ready
        setTimeout(() => {
          this.initMonthlyChart();
          this.initTopMedecinChart();
        }, 50);
      },
      error: () => {
        this.loading = false;
        this.loadingStats = false;
        this.loadError = 'Impossible de charger les données.';
        this.statsCards.forEach(c => { c.loading = false; c.value = '—'; c.subtitle = 'Erreur'; });
        this.filterMedecins();
      },
    });
  }

  private mapRow(d: any): MedecinRow {
    const first = d.user?.firstName ?? '';
    const last  = d.user?.lastName  ?? '';
    const words = `${first} ${last}`.trim().split(/\s+/);
    const initials = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : `${first}${last}`.substring(0, 2).toUpperCase();

    const p = d.prescriptions ?? { total: 0, validated: 0, pending: 0 };
    const tot = p.total ?? 0;
    const val = p.validated ?? 0;
    const taux = tot > 0 ? Math.round((val / tot) * 100) : 0;

    return {
      keycloakId:          d.keycloakId ?? d.user?.keycloakId ?? '',
      name:                `Dr. ${first} ${last}`.trim(),
      initials,
      speciality:          d.specialization ?? '',
      isActive:            d.user?.isActive ?? false,
      ordonnancesEmises:   tot,
      ordonnancesValidees: val,
      enAttente:           p.pending ?? 0,
      tauxValidation:      taux,
    };
  }

  // ─── Charts ──────────────────────────────────────────────────────────────────

  private initMonthlyChart(): void {
    if (!this.monthlyChartRef?.nativeElement) return;
    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.monthlyChart?.destroy();

    // Use real totals distributed as a trend curve (mock months shape)
    const total = this.allMedecins.reduce((s, m) => s + m.ordonnancesEmises, 0);
    const val   = this.allMedecins.reduce((s, m) => s + m.ordonnancesValidees, 0);
    const base  = Math.max(1, Math.round(total / 6));
    const vbase = Math.max(1, Math.round(val   / 6));
    const emises   = [0.60, 0.70, 0.63, 0.82, 0.90, 1.00].map(f => Math.round(base  * f));
    const validees = [0.58, 0.68, 0.62, 0.80, 0.88, 0.98].map(f => Math.round(vbase * f));

    this.monthlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [
          { label: 'Émises',  data: emises,   borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', tension: 0.4, fill: true, pointRadius: 4 },
          { label: 'Validées',data: validees,  borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', tension: 0.4, fill: true, pointRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  private initTopMedecinChart(): void {
    if (!this.topMedecinChartRef?.nativeElement) return;
    const ctx = this.topMedecinChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.topChart?.destroy();

    const top5 = [...this.allMedecins]
      .sort((a, b) => b.ordonnancesEmises - a.ordonnancesEmises)
      .slice(0, 5);

    this.topChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top5.map(m => m.name.replace('Dr. ', 'Dr. ')),
        datasets: [{ label: 'Ordonnances', data: top5.map(m => m.ordonnancesEmises), backgroundColor: '#5DADE2', borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { color: '#F3F4F6' } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  // ─── Table ────────────────────────────────────────────────────────────────────

  filterMedecins(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredMedecins = this.allMedecins.filter(m => {
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.speciality.toLowerCase().includes(q);
      const matchSpec   = this.selectedSpecialty === 'all' || m.speciality === this.selectedSpecialty;
      return matchSearch && matchSpec;
    });
    this.totalPages = Math.max(1, Math.ceil(this.filteredMedecins.length / this.itemsPerPage));
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedMedecins = this.filteredMedecins.slice(start, start + this.itemsPerPage);
  }

  get startItem(): number { return this.filteredMedecins.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem(): number   { return Math.min(this.currentPage * this.itemsPerPage, this.filteredMedecins.length); }

  onSearchChange(): void    { this.filterMedecins(); }
  onSpecialtyChange(): void { this.filterMedecins(); }
  onItemsPerPageChange(): void { this.filterMedecins(); }
  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); } }

  voirDetail(m: MedecinRow): void {
    this.router.navigate(['/admin/medecins', m.keycloakId]);
  }

  toggleActive(m: MedecinRow): void {
    if (this.savingId) return;
    this.savingId = m.keycloakId;
    const url = m.isActive
      ? `${this.api}/admin/users/${m.keycloakId}/deactivate`
      : `${this.api}/admin/doctors/${m.keycloakId}/activate`;
    this.http.patch(url, {}).subscribe({
      next: () => { m.isActive = !m.isActive; this.savingId = null; },
      error: () => { this.savingId = null; },
    });
  }

  getProgressBarColor(taux: number): string {
    if (taux >= 90) return 'bg-green-500';
    if (taux >= 75) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  pad2(n: number): string { return n < 10 ? '0' + n : String(n); }
}
