import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface HospitalRow {
  id:             string;
  name:           string;
  type:           string;
  address:        string;
  region:         string;
  phone:          string;
  email:          string;
  isActive:       boolean;
  logoUrl?:       string;
  createdAt:      string;
  patients:       number;
  careRate:       number;
  monthlyRevenue: number;
}

interface StatsData {
  total:          number;
  active:         number;
  newThisMonth:   number;
  totalPatients:  number;
  monthlyPatients:number;
  globalCareRate: number;
  monthlyRevenue: number;
  monthly:        { month: string; patients: number; revenue: number }[];
  byType:         { type: string; count: number }[];
}

@Component({
  selector: 'app-hospitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitals.component.html',
})
export class HospitalsComponent implements OnInit {

  loading   = true;
  loadError = '';

  searchTerm    = '';
  statusFilter  = 'all';
  itemsPerPage  = 10;
  currentPage   = 1;

  stats:              StatsData | null = null;
  allHospitals:       HospitalRow[]   = [];
  filteredHospitals:  HospitalRow[]   = [];
  paginatedHospitals: HospitalRow[]   = [];
  totalPages          = 1;

  private readonly api = environment.baseUrl;

  Math = Math;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading   = true;
    this.loadError = '';

    forkJoin({
      hospitals: this.http.get<HospitalRow[]>(`${this.api}/admin/hospitals`).pipe(catchError(() => of([]))),
      stats:     this.http.get<StatsData>(`${this.api}/admin/hospitals/stats`).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ hospitals, stats }) => {
        this.allHospitals = (hospitals ?? []).map(h => ({
          ...h,
          patients:       h.patients       ?? 0,
          careRate:       h.careRate       ?? 0,
          monthlyRevenue: h.monthlyRevenue ?? 0,
        }));
        this.stats   = stats;
        this.filter();
        this.loading = false;
      },
      error: () => {
        this.loading   = false;
        this.loadError = 'Impossible de charger les données.';
      },
    });
  }

  filter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredHospitals = this.allHospitals.filter(h => {
      const matchSearch = !q || h.name?.toLowerCase().includes(q) || h.region?.toLowerCase().includes(q) || h.type?.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'all' || (this.statusFilter === 'active' ? h.isActive : !h.isActive);
      return matchSearch && matchStatus;
    });
    this.totalPages  = Math.ceil(this.filteredHospitals.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedHospitals = this.filteredHospitals.slice(start, start + this.itemsPerPage);
  }

  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.paginate(); } }
  nextPage():     void { if (this.currentPage < this.totalPages) { this.currentPage++; this.paginate(); } }

  get startItem(): number { return this.filteredHospitals.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem():   number { return Math.min(this.currentPage * this.itemsPerPage, this.filteredHospitals.length); }

  initials(name: string): string {
    const w = (name ?? '').split(' ').filter(Boolean);
    return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : (name ?? '?').substring(0, 2).toUpperCase();
  }

  initialsClass(i: number): string {
    const cls = ['bg-blue-100 text-blue-800','bg-teal-100 text-teal-800','bg-indigo-100 text-indigo-800','bg-purple-100 text-purple-800','bg-green-100 text-green-800','bg-orange-100 text-orange-800'];
    return cls[i % cls.length];
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n ?? 0) + ' F';
  }

  // Chart helpers
  get maxChartPatients(): number {
    if (!this.stats?.monthly?.length) return 1;
    return Math.max(...this.stats.monthly.map(m => m.patients), 1);
  }

  barHeight(patients: number): number {
    return Math.round((patients / this.maxChartPatients) * 100);
  }

  // Top 5 par patients
  get top5(): HospitalRow[] {
    return [...this.allHospitals]
      .sort((a, b) => b.patients - a.patients)
      .slice(0, 5);
  }

  get maxTop5(): number {
    const m = this.top5[0]?.patients ?? 1;
    return m > 0 ? m : 1;
  }

  top5Bar(patients: number): number {
    return Math.round((patients / this.maxTop5) * 100);
  }

  toggleStatus(h: HospitalRow): void {
    this.http.patch(`${this.api}/admin/hospitals/${h.id}`, { isActive: !h.isActive })
      .subscribe({ next: () => { h.isActive = !h.isActive; }, error: () => {} });
  }

  goNew():            void { this.router.navigate(['/admin/hospitals/new']); }
  viewDetail(h: HospitalRow): void { this.router.navigate(['/admin/hospitals/detail', h.id]); }
}
