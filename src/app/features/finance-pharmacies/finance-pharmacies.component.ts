import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = environment.baseUrl;

interface PharmacyApi {
  id: string;
  name?: string;
  nom?: string;
  pharmacyName?: string;
  address?: string;
  adresse?: string;
  commune?: string;
}

interface PharmacyDonation {
  pharmacyId: string;
  pharmacyName: string;
  totalCollected: number;
  campaignCount: number;
}

interface VersementApi {
  id: string;
  establishmentId: string;
  establishmentName: string;
  amount: number;
  documentUrl?: string;
  note?: string;
  paymentDate: string;
  adminName?: string;
  createdAt: string;
}

export interface PharmacyRow {
  id: string;
  initial: string;
  name: string;
  address: string;
  allocated: number;
  totalVerse: number;
  remaining: number;
  countVersements: number;
  lastVersement: string | null;
  status: 'pending' | 'paid' | 'unallocated';
}

@Component({
  selector: 'app-finance-pharmacies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-pharmacies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancePharmaciesComponent implements OnInit {

  poolTotal       = 0;
  globalVerse     = 0;
  globalRemaining = 0;
  pharmacies: PharmacyRow[] = [];
  versementsHistory: VersementApi[] = [];

  loading        = false;
  loadingHistory = false;

  activeTab: 'pharmacies' | 'historique' = 'pharmacies';
  statusFilter: '' | 'pending' | 'paid' | 'unallocated' = '';
  searchTerm = '';
  pharmPage  = 1;
  readonly pharmPageSize = 10;

  histSearch = '';
  histPage   = 1;
  histTotal  = 0;
  readonly histPageSize = 10;

  // ── Modal versement ───────────────────────────────────────────────────────────
  showModal     = false;
  submitting    = false;
  submitError   = '';
  submitSuccess = false;
  modalPharmacy: PharmacyRow | null = null;
  form = { amount: '' as string | number, paymentDate: '', note: '' };
  selectedFile: File | null = null;
  fileName = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadAll(); this.loadHistory(); }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── Chargement ────────────────────────────────────────────────────────────────

  loadAll() {
    this.loading = true;
    forkJoin({
      donations:  this.http.get<PharmacyDonation[]>(`${BASE}/admin/finance/pharmacy-donations`, { headers: this.headers() }),
      pharmacies: this.http.get<PharmacyApi[]>(`${BASE}/admin/pharmacies`, { headers: this.headers() }),
      versements: this.http.get<{ data: VersementApi[]; total: number }>(`${BASE}/admin/versements`, {
        headers: this.headers(), params: { type: 'PHARMACY', limit: '1000', page: '1' },
      }),
    }).subscribe({
      next: ({ donations, pharmacies, versements }) => {
        const donationMap = new Map(donations.map(d => [d.pharmacyId, d]));
        this.poolTotal = donations.reduce((s, d) => s + Number(d.totalCollected), 0);

        this.pharmacies = pharmacies.map(p => {
          const name  = p.name ?? p.nom ?? p.pharmacyName ?? '';
          const don   = donationMap.get(p.id);
          const pvs   = versements.data.filter(v => v.establishmentId === p.id);
          const sorted = [...pvs].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
          const allocated  = don ? Number(don.totalCollected) : 0;
          const totalVerse = pvs.reduce((s, v) => s + Number(v.amount), 0);
          const remaining  = Math.max(0, allocated - totalVerse);
          const status: PharmacyRow['status'] = allocated === 0 ? 'unallocated'
            : remaining === 0 ? 'paid' : 'pending';

          return {
            id: p.id,
            initial: name.slice(0, 2).toUpperCase(),
            name,
            address:         p.address ?? p.adresse ?? p.commune ?? '',
            allocated,
            totalVerse,
            remaining,
            countVersements: pvs.length,
            lastVersement:   sorted[0]?.paymentDate ?? null,
            status,
          };
        });

        this.globalVerse     = versements.data.reduce((s, v) => s + Number(v.amount), 0);
        this.globalRemaining = Math.max(0, this.poolTotal - this.globalVerse);
        this.loading = false;
        this.pharmPage = 1;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  loadHistory() {
    this.loadingHistory = true;
    const params: Record<string, any> = { type: 'PHARMACY', page: this.histPage, limit: this.histPageSize };
    if (this.histSearch) params['search'] = this.histSearch;
    this.http.get<{ data: VersementApi[]; total: number }>(`${BASE}/admin/versements`, {
      headers: this.headers(), params,
    }).subscribe({
      next: r => { this.versementsHistory = r.data; this.histTotal = r.total; this.loadingHistory = false; this.cdr.markForCheck(); },
      error: () => { this.loadingHistory = false; this.cdr.markForCheck(); },
    });
  }

  // ── Filtres & pagination ──────────────────────────────────────────────────────

  get filteredPharmacies(): PharmacyRow[] {
    let list = this.pharmacies;
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
    }
    if (this.statusFilter) list = list.filter(p => p.status === this.statusFilter);
    return list;
  }

  get pharmTotalPages() { return Math.ceil(this.filteredPharmacies.length / this.pharmPageSize); }

  get pagedPharmacies(): PharmacyRow[] {
    const start = (this.pharmPage - 1) * this.pharmPageSize;
    return this.filteredPharmacies.slice(start, start + this.pharmPageSize);
  }

  setFilter(f: typeof this.statusFilter) {
    this.statusFilter = this.statusFilter === f ? '' : f;
    this.pharmPage = 1;
    this.cdr.markForCheck();
  }

  onSearchChange() { this.pharmPage = 1; this.cdr.markForCheck(); }
  goPharmPage(p: number) { if (p >= 1 && p <= this.pharmTotalPages) { this.pharmPage = p; this.cdr.markForCheck(); } }

  get histTotalPages() { return Math.ceil(this.histTotal / this.histPageSize); }
  onHistSearchChange() { this.histPage = 1; this.loadHistory(); }
  goHistPage(p: number) { if (p >= 1 && p <= this.histTotalPages) { this.histPage = p; this.loadHistory(); } }

  setTab(t: 'pharmacies' | 'historique') { this.activeTab = t; this.cdr.markForCheck(); }

  // ── Modal versement ───────────────────────────────────────────────────────────

  openModal(p: PharmacyRow) {
    this.modalPharmacy = p;
    this.form          = { amount: '', paymentDate: new Date().toISOString().split('T')[0], note: '' };
    this.selectedFile  = null;
    this.fileName      = '';
    this.submitError   = '';
    this.submitSuccess = false;
    this.showModal     = true;
    this.cdr.markForCheck();
  }

  closeModal() { this.showModal = false; this.cdr.markForCheck(); }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) { this.selectedFile = input.files[0]; this.fileName = this.selectedFile.name; this.cdr.markForCheck(); }
  }

  get amountExceedsRemaining(): boolean {
    return !!this.modalPharmacy && Number(this.form.amount) > this.modalPharmacy.remaining;
  }

  submitVersement() {
    if (!this.form.amount || !this.form.paymentDate || !this.modalPharmacy) {
      this.submitError = 'Veuillez remplir tous les champs obligatoires.'; this.cdr.markForCheck(); return;
    }
    if (this.amountExceedsRemaining) {
      this.submitError = `Le montant dépasse le reste à verser (${this.fmt(this.modalPharmacy!.remaining)}).`;
      this.cdr.markForCheck(); return;
    }
    this.submitting  = true;
    this.submitError = '';
    const fd = new FormData();
    fd.append('establishmentId',   this.modalPharmacy.id);
    fd.append('establishmentType', 'PHARMACY');
    fd.append('establishmentName', this.modalPharmacy.name);
    fd.append('amount',            String(this.form.amount));
    fd.append('paymentDate',       this.form.paymentDate);
    if (this.form.note)    fd.append('note',     this.form.note);
    if (this.selectedFile) fd.append('document', this.selectedFile);
    this.http.post(`${BASE}/admin/versements`, fd, { headers: this.headers() }).subscribe({
      next: () => {
        this.submitting = false; this.submitSuccess = true;
        this.loadAll(); this.loadHistory();
        setTimeout(() => this.closeModal(), 1500);
        this.cdr.markForCheck();
      },
      error: err => {
        this.submitting = false;
        this.submitError = err?.error?.message ?? 'Une erreur est survenue.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  fmt(n: number): string { return new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' F'; }

  pct(verse: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.round(verse / total * 100));
  }

  get pendingCount()     { return this.pharmacies.filter(p => p.status === 'pending').length; }
  get paidCount()        { return this.pharmacies.filter(p => p.status === 'paid').length; }
  get unallocatedCount() { return this.pharmacies.filter(p => p.status === 'unallocated').length; }
}
