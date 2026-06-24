import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = environment.baseUrl;

interface FinanceSummary {
  totalDonations: number;
  donorCount: number;
  contributionCount: number;
  campaignCount: number;
  byType: { ORDONNANCE: number; ANALYSE: number; IMAGERIE: number; HOSPITALISATION: number };
}

interface VersementsSummary {
  totalVerse: number;
  countVersements: number;
  byType: { type: string; verse: number }[];
}

interface EstablishmentDonation {
  establishmentId: string;
  establishmentName: string;
  establishmentType: string;
  totalCollected: number;
  campaignCount: number;
}

interface EstablishmentsData {
  establishments: EstablishmentDonation[];
  pharmacySummary: { totalCollected: number; campaignCount: number };
}

interface Versement {
  id: string;
  establishmentType: string;
  establishmentName: string;
  amount: number;
  documentUrl?: string;
  note?: string;
  paymentDate: string;
  adminName?: string;
  createdAt: string;
}

interface Establishment {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  PHARMACY:   'Pharmacies',
  LABORATORY: 'Laboratoires',
  IMAGING:    'Imagerie',
  HOSPITAL:   'Hôpitaux',
};

const TYPE_COLORS: Record<string, string> = {
  PHARMACY:   '#1A3C6E',
  LABORATORY: '#0D6E6E',
  IMAGING:    '#6D28D9',
  HOSPITAL:   '#B45309',
};


@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceDashboardComponent implements OnInit {
  financeSummary: FinanceSummary | null = null;
  versementsSummary: VersementsSummary | null = null;
  establishmentsData: EstablishmentsData | null = null;
  versements: Versement[] = [];
  total = 0;
  page = 1;
  limit = 10;
  filterType = '';
  filterSearch = '';
  loading = false;
  loadingList = false;

  activeTab: 'etablissements' | 'campagnes' | 'versements' = 'etablissements';
  searchEstablishment = '';
  filterVersementStatus = '';

  establPage = 1;
  readonly establPageSize = 10;

  showModal = false;
  submitting = false;
  submitError = '';
  submitSuccess = false;

  form = {
    establishmentType: '',
    establishmentId: '',
    establishmentName: '',
    amount: '' as string | number,
    paymentDate: new Date().toISOString().split('T')[0],
    note: '',
  };
  selectedFile: File | null = null;
  fileName = '';

  establishments: Establishment[] = [];
  loadingEstablishments = false;

  readonly typeLabels = TYPE_LABELS;
  readonly typeColors = TYPE_COLORS;
  readonly types = Object.keys(TYPE_LABELS);

  get totalPages() { return Math.ceil(this.total / this.limit); }

  get totalAlloue(): number {
    return this.financeSummary?.totalDonations ?? 0;
  }

  get totalVerse(): number {
    return this.versementsSummary?.totalVerse ?? 0;
  }

  get soldeRestant(): number {
    return Math.max(0, this.totalAlloue - this.totalVerse);
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadAll();
    this.loadVersements();
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadAll() {
    this.loading = true;
    forkJoin({
      finance:       this.http.get<FinanceSummary>(`${BASE}/admin/finance/summary`, { headers: this.authHeaders() }),
      versements:    this.http.get<VersementsSummary>(`${BASE}/admin/versements/summary`, { headers: this.authHeaders() }),
      establishments: this.http.get<EstablishmentsData>(`${BASE}/admin/finance/establishments`, { headers: this.authHeaders() }),
    }).subscribe({
      next: ({ finance, versements, establishments }) => {
        this.financeSummary      = finance;
        this.versementsSummary   = versements;
        this.establishmentsData  = establishments;
        this.loading             = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  loadVersements() {
    this.loadingList = true;
    const params: Record<string, any> = { page: this.page, limit: this.limit };
    if (this.filterType)   params['type']   = this.filterType;
    if (this.filterSearch) params['search'] = this.filterSearch;

    this.http.get<{ data: Versement[]; total: number }>(`${BASE}/admin/versements`, {
      headers: this.authHeaders(), params,
    }).subscribe({
      next: r => {
        this.versements  = r.data;
        this.total       = r.total;
        this.loadingList = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingList = false; this.cdr.markForCheck(); },
    });
  }

  onFilterChange() { this.page = 1; this.loadVersements(); }
  goPage(p: number) { if (p >= 1 && p <= this.totalPages) { this.page = p; this.loadVersements(); } }

  openModal() {
    this.form = {
      establishmentType: '',
      establishmentId: '',
      establishmentName: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      note: '',
    };
    this.selectedFile = null;
    this.fileName = '';
    this.submitError = '';
    this.submitSuccess = false;
    this.establishments = [];
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal() { this.showModal = false; this.cdr.markForCheck(); }

  onTypeChange() {
    this.form.establishmentId = '';
    this.form.establishmentName = '';
    this.establishments = [];
    if (!this.form.establishmentType) return;
    this.loadEstablishments(this.form.establishmentType);
  }

  loadEstablishments(type: string) {
    this.loadingEstablishments = true;
    const endpointMap: Record<string, string> = {
      PHARMACY:   `${BASE}/admin/pharmacies`,
      LABORATORY: `${BASE}/admin/laboratories`,
      IMAGING:    `${BASE}/admin/imaging-centers`,
      HOSPITAL:   `${BASE}/admin/hospitals`,
    };
    const url = endpointMap[type];
    if (!url) { this.loadingEstablishments = false; return; }

    this.http.get<any[]>(url, { headers: this.authHeaders() }).subscribe({
      next: list => {
        this.establishments = list.map(e => ({
          id:   e.id,
          name: e.name ?? e.nom ?? e.hospitalName ?? e.centerName ?? e.labName ?? '',
        }));
        this.loadingEstablishments = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingEstablishments = false; this.cdr.markForCheck(); },
    });
  }

  onEstablishmentSelect() {
    const found = this.establishments.find(e => e.id === this.form.establishmentId);
    if (found) this.form.establishmentName = found.name;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
      this.cdr.markForCheck();
    }
  }

  submitVersement() {
    if (!this.form.establishmentType || !this.form.establishmentId || !this.form.amount || !this.form.paymentDate) {
      this.submitError = 'Veuillez remplir tous les champs obligatoires.';
      this.cdr.markForCheck();
      return;
    }
    this.submitting = true;
    this.submitError = '';

    const fd = new FormData();
    fd.append('establishmentId',   this.form.establishmentId);
    fd.append('establishmentType', this.form.establishmentType);
    fd.append('establishmentName', this.form.establishmentName);
    fd.append('amount',            String(this.form.amount));
    fd.append('paymentDate',       this.form.paymentDate);
    if (this.form.note)    fd.append('note',     this.form.note);
    if (this.selectedFile) fd.append('document', this.selectedFile);

    this.http.post(`${BASE}/admin/versements`, fd, { headers: this.authHeaders() }).subscribe({
      next: () => {
        this.submitting     = false;
        this.submitSuccess  = true;
        this.loadAll();
        this.loadVersements();
        setTimeout(() => this.closeModal(), 1500);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting  = false;
        this.submitError = err?.error?.message ?? 'Une erreur est survenue.';
        this.cdr.markForCheck();
      },
    });
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n) + ' F';
  }

  typeLabel(t: string): string { return TYPE_LABELS[t] ?? t; }
  typeColor(t: string): string { return TYPE_COLORS[t] ?? '#6B7280'; }

  verseForType(type: string): number {
    return this.versementsSummary?.byType?.find(b => b.type === type)?.verse ?? 0;
  }

  collecteForType(type: string): number {
    if (!this.financeSummary) return 0;
    const map: Record<string, number> = {
      PHARMACY:   this.financeSummary.byType.ORDONNANCE,
      LABORATORY: this.financeSummary.byType.ANALYSE,
      IMAGING:    this.financeSummary.byType.IMAGERIE,
      HOSPITAL:   this.financeSummary.byType.HOSPITALISATION,
    };
    return map[type] ?? 0;
  }

  progressPct(collecte: number, verse: number): number {
    if (collecte <= 0) return 0;
    return Math.min(100, Math.round(verse / collecte * 100));
  }

  setTab(tab: 'etablissements' | 'campagnes' | 'versements') {
    this.activeTab = tab;
    if (tab === 'versements') this.loadVersements();
  }

  get filteredEstablishments() {
    const all = this.establishmentsData?.establishments ?? [];
    const q = this.searchEstablishment.toLowerCase().trim();
    const bySearch = q ? all.filter(e => e.establishmentName.toLowerCase().includes(q)) : all;
    return this.filterType ? bySearch.filter(e => e.establishmentType === this.filterType) : bySearch;
  }

  get establTotalPages() { return Math.ceil(this.filteredEstablishments.length / this.establPageSize); }

  get pagedEstablishments() {
    const start = (this.establPage - 1) * this.establPageSize;
    return this.filteredEstablishments.slice(start, start + this.establPageSize);
  }

  onEstablishmentSearchChange() { this.establPage = 1; }

  goEstablPage(p: number) {
    if (p >= 1 && p <= this.establTotalPages) this.establPage = p;
  }

  get pharmacyVisible(): boolean {
    const total = this.establishmentsData?.pharmacySummary?.totalCollected ?? 0;
    if (total <= 0) return false;
    if (!this.searchEstablishment.trim()) return true;
    return 'pharmacies'.includes(this.searchEstablishment.toLowerCase());
  }

  get campaignRows() {
    if (!this.financeSummary) return [];
    const { byType } = this.financeSummary;
    return [
      { label: 'Ordonnances (Pharmacies)',  type: 'PHARMACY',   collecte: byType.ORDONNANCE,      verse: this.verseForType('PHARMACY') },
      { label: 'Analyses (Laboratoires)',   type: 'LABORATORY', collecte: byType.ANALYSE,         verse: this.verseForType('LABORATORY') },
      { label: 'Imagerie',                  type: 'IMAGING',    collecte: byType.IMAGERIE,        verse: this.verseForType('IMAGING') },
      { label: 'Hospitalisations',          type: 'HOSPITAL',   collecte: byType.HOSPITALISATION, verse: this.verseForType('HOSPITAL') },
    ];
  }
}
