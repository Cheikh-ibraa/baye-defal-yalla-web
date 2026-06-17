import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

type Priority   = 'URGENT' | 'PRIORITAIRE' | 'Normal';
type OrderStatus = 'PENDING' | 'ACCEPTED' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

interface Demande {
  id:          string;
  status:      OrderStatus;
  priority:    Priority;
  timeAgo:     string;
  title:       string;
  description: string;
  patientName: string;
  patientRef:  string;
  patientId:   string;
  doctorName:  string;
  categories:  string[];
}

interface AccepterForm {
  montant: number | null;
  date:    string;
  heure:   string;
  note:    string;
}

interface FilterOption { label: string; value: string | null; }

const PRIORITY_MAP: Record<string, Priority> = {
  URGENT:   'URGENT',
  PRIORITY: 'PRIORITAIRE',
  NORMAL:   'Normal',
};

@Component({
  selector: 'app-demande-laboratoire',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './demande-laboratoire.component.html',
  styleUrl: './demande-laboratoire.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeLaboratoireComponent implements OnInit {

  private http   = inject(HttpClient);
  private cdr    = inject(ChangeDetectorRef);
  private router = inject(Router);
  private api    = environment.baseUrl;

  loading  = true;
  demandes: Demande[] = [];

  statDisponibles = 0;
  statAcceptees   = 0;
  statRealisees   = 0;

  // ── Filtre statut ──────────────────────────────────────────────────────────
  selectedStatus: string | null = null;
  statusLabel    = 'Tous les statuts';
  showStatusMenu = false;

  // ── Recherche & pagination ─────────────────────────────────────────────────
  searchQuery  = '';
  page         = 1;
  limit        = 12;
  total        = 0;
  totalPages   = 1;
  private searchTimer: any;

  statusOptions: FilterOption[] = [
    { label: 'Tous les statuts', value: null          },
    { label: 'En attente',       value: 'PENDING'     },
    { label: 'Accepté',          value: 'ACCEPTED'    },
    { label: 'Financé',          value: 'FUNDED'      },
    { label: 'En cours',         value: 'IN_PROGRESS' },
    { label: 'Terminé',          value: 'COMPLETED'   },
    { label: 'Rejeté',           value: 'REJECTED'    },
    { label: 'Expiré',           value: 'EXPIRED'     },
  ];

  showAccepterModal = false;
  showSuccessModal  = false;
  selectedDemande: Demande | null = null;
  form: AccepterForm = { montant: null, date: '', heure: '', note: '' };

  ngOnInit(): void {
    forkJoin({
      orders:    this.http.get<any>(`${this.api}/diagnostic/lab-orders/all`, { params: { page: '1', limit: String(this.limit) } }),
      dashboard: this.http.get<any>(`${this.api}/diagnostic/lab/dashboard`),
    }).subscribe({
      next: ({ orders, dashboard }) => {
        this.statDisponibles = dashboard?.newRequests ?? 0;
        this.statAcceptees   = dashboard?.accepted    ?? 0;
        this.statRealisees   = dashboard?.completed   ?? 0;
        this.applyPaginated(orders);
      },
      error: () => {
        this.http.get<any>(`${this.api}/diagnostic/lab-orders/all`, { params: { page: '1', limit: String(this.limit) } }).subscribe({
          next:  (res) => this.applyPaginated(res),
          error: () => { this.loading = false; this.cdr.markForCheck(); },
        });
      },
    });
  }

  private loadDemandes(): void {
    this.loading = true;
    const params: Record<string, string> = { page: String(this.page), limit: String(this.limit) };
    if (this.selectedStatus) params['status'] = this.selectedStatus;
    if (this.searchQuery.trim()) params['search'] = this.searchQuery.trim();

    this.http.get<any>(`${this.api}/diagnostic/lab-orders/all`, { params }).subscribe({
      next:  (res) => this.applyPaginated(res),
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  private applyPaginated(res: any): void {
    const orders = Array.isArray(res) ? res : (res?.data ?? []);
    this.total      = res?.total ?? orders.length;
    this.page       = res?.page  ?? this.page;
    this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
    this.resolveNames(orders);
  }

  setStatus(opt: FilterOption): void {
    this.selectedStatus = opt.value;
    this.statusLabel    = opt.label;
    this.showStatusMenu = false;
    this.page = 1;
    this.loadDemandes();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.loadDemandes(); }, 400);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.loadDemandes();
  }

  get pageNumbers(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end   = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  private resolveNames(orders: any[]): void {
    const ids = [...new Set([
      ...orders.map(o => o.patientId).filter(Boolean),
      ...orders.map(o => o.doctorId).filter(Boolean),
    ])];

    if (!ids.length) { this.build(orders, {}); return; }

    this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
      `${this.api}/users/names?ids=${ids.join(',')}`
    ).subscribe({
      next: (names) => {
        const m: Record<string, string> = {};
        for (const n of names) m[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
        this.build(orders, m);
      },
      error: () => this.build(orders, {}),
    });
  }

  private build(orders: any[], names: Record<string, string>): void {
    this.demandes = orders.map(o => {
      const pName = names[o.patientId] || `Patient ${(o.patientId ?? '').slice(-6).toUpperCase()}`;
      const dName = names[o.doctorId] ? `Dr. ${names[o.doctorId]}` : 'Médecin';
      const cats  = (o.categories ?? []) as string[];
      const title = cats.length > 0 ? cats.join(', ') : (o.tests?.[0]?.testName ?? 'Bilan');
      const date  = o.createdAt ?? o.receivedAt;
      return {
        id:          o.id,
        status:      o.status as OrderStatus,
        priority:    PRIORITY_MAP[o.urgency] ?? 'Normal',
        timeAgo:     date ? this.timeAgo(new Date(date)) : '—',
        title,
        description: o.clinicalIndication ?? 'Aucune indication clinique précisée.',
        patientName: pName,
        patientRef:  o.labOrderRef ?? '—',
        patientId:   o.patientId,
        doctorName:  dName,
        categories:  cats,
      };
    });
    this.loading = false;
    this.cdr.markForCheck();
  }

  private timeAgo(date: Date): string {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60)    return 'il y a quelques secondes';
    if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)} jour(s)`;
  }

  getInitiales(name: string): string {
    return name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getPriorityClass(priority: Priority): string {
    switch (priority) {
      case 'URGENT':      return 'bg-red-100 text-red-600';
      case 'PRIORITAIRE': return 'bg-blue-100 text-blue-700';
      default:            return 'bg-gray-100 text-gray-600';
    }
  }

  getPriorityLabel(priority: Priority): string { return priority; }

  getStatusLabel(s: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      PENDING: 'En attente', ACCEPTED: 'Accepté', FUNDED: 'Financé',
      IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', REJECTED: 'Rejeté', EXPIRED: 'Expiré',
    };
    return m[s] ?? s;
  }

  getStatusClass(s: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      PENDING:     'bg-yellow-100 text-yellow-700',
      ACCEPTED:    'bg-blue-100 text-blue-700',
      FUNDED:      'bg-purple-100 text-purple-700',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
      COMPLETED:   'bg-green-100 text-[#00B894]',
      REJECTED:    'bg-red-100 text-red-600',
      EXPIRED:     'bg-gray-100 text-gray-500',
    };
    return m[s] ?? 'bg-gray-100 text-gray-500';
  }

  accepter(demande: Demande): void {
    this.selectedDemande = demande;
    this.form = { montant: null, date: '', heure: '', note: 'Résultats disponibles sous 24h' };
    this.showAccepterModal = true;
    this.cdr.markForCheck();
  }

  fermerModal(): void {
    this.showAccepterModal = false;
    this.selectedDemande  = null;
    this.cdr.markForCheck();
  }

  confirmerAcceptation(): void {
    if (!this.selectedDemande || !this.form.montant || !this.form.date || !this.form.heure) return;

    const appointmentDate = new Date(`${this.form.date}T${this.form.heure}:00`).toISOString();
    const body = { price: this.form.montant, appointmentDate, note: this.form.note || undefined };

    this.http.patch(`${this.api}/diagnostic/lab-orders/${this.selectedDemande.id}/accept`, body).subscribe({
      next: () => {
        this.demandes = this.demandes.filter(d => d.id !== this.selectedDemande!.id);
        this.showAccepterModal = false;
        this.showSuccessModal  = true;
        this.cdr.markForCheck();
        setTimeout(() => { this.showSuccessModal = false; this.cdr.markForCheck(); }, 2500);
      },
      error: () => { this.showAccepterModal = false; this.cdr.markForCheck(); },
    });
  }

  voirDetails(demande: Demande): void {
    this.router.navigate(['/laboratory/demandes', demande.id]);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showStatusMenu) { this.showStatusMenu = false; this.cdr.markForCheck(); }
  }
}
