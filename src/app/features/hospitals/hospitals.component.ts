import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface HospitalRow {
  id:          string;
  name:        string;
  type:        string;
  address:     string;
  region:      string;
  phone:       string;
  email:       string;
  isActive:    boolean;
  createdAt:   string;
}

interface StatsCard {
  label:    string;
  value:    string;
  sub?:     string;
  subClass?: string;
  icon:     string;
  iconBg:   string;
}

const TYPE_COLORS: Record<string, string> = {
  'CHU':                  'bg-blue-100 text-blue-700',
  'CHR':                  'bg-indigo-100 text-indigo-700',
  'Hôpital de district':  'bg-teal-100 text-teal-700',
  'Clinique privée':      'bg-purple-100 text-purple-700',
  'Polyclinique':         'bg-orange-100 text-orange-700',
  'Centre de santé':      'bg-green-100 text-green-700',
};

@Component({
  selector: 'app-hospitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitals.component.html',
})
export class HospitalsComponent implements OnInit {

  loading   = true;
  loadError = '';

  searchTerm   = '';
  itemsPerPage = 10;
  currentPage  = 1;

  statsCards:           StatsCard[]   = [];
  allHospitals:         HospitalRow[] = [];
  filteredHospitals:    HospitalRow[] = [];
  paginatedHospitals:   HospitalRow[] = [];
  totalPages            = 1;

  private readonly api = environment.baseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading   = true;
    this.loadError = '';

    forkJoin({
      hospitals: this.http.get<HospitalRow[]>(`${this.api}/admin/hospitals`).pipe(catchError(() => of([]))),
      stats:     this.http.get<any>(`${this.api}/admin/hospitals/stats`).pipe(catchError(() => of({}))),
    }).subscribe({
      next: ({ hospitals, stats }) => {
        this.allHospitals = hospitals ?? [];
        this.applyStats(stats ?? {});
        this.filter();
        this.loading = false;
      },
      error: () => {
        this.loading   = false;
        this.loadError = 'Impossible de charger les données.';
      },
    });
  }

  private applyStats(s: any): void {
    const active       = s.active      ?? this.allHospitals.filter(h => h.isActive).length;
    const newMonth     = s.newThisMonth ?? 0;
    const byType       = (s.byType ?? []) as { type: string; count: number }[];
    const topType      = byType[0];

    this.statsCards = [
      {
        label: 'Hôpitaux enregistrés', value: String(this.allHospitals.length),
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        iconBg: 'bg-blue-50 text-blue-500',
      },
      {
        label: 'Établissements actifs', value: String(active),
        sub: `${this.allHospitals.length - active} inactif(s)`,
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg: 'bg-green-50 text-green-500',
      },
      {
        label: 'Ajoutés ce mois', value: String(newMonth),
        icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
        iconBg: 'bg-teal-50 text-teal-500',
      },
      {
        label: 'Type dominant', value: topType?.type ?? '—',
        sub: topType ? `${topType.count} établissement(s)` : '',
        icon: 'M4 6h16M4 10h16M4 14h16M4 18h7',
        iconBg: 'bg-purple-50 text-purple-500',
      },
    ];
  }

  filter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredHospitals = q
      ? this.allHospitals.filter(h =>
          h.name?.toLowerCase().includes(q) ||
          h.type?.toLowerCase().includes(q) ||
          h.address?.toLowerCase().includes(q) ||
          h.region?.toLowerCase().includes(q) ||
          h.email?.toLowerCase().includes(q))
      : [...this.allHospitals];
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
    const cls = ['bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-indigo-100 text-indigo-700','bg-purple-100 text-purple-700','bg-green-100 text-green-700'];
    return cls[i % cls.length];
  }

  typeClass(type: string): string { return TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'; }

  goNew():            void { this.router.navigate(['/admin/hospitals/new']); }
  viewDetail(h: HospitalRow): void { this.router.navigate(['/admin/hospitals/detail', h.id], { state: { hospitalRow: h } }); }
}
