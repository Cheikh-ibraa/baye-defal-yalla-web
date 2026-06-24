import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type Priority   = 'Urgent' | 'Prioritaire' | 'Normal';
type ExamStatus = 'PENDING' | 'ACCEPTED' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

interface ExamRow {
  id:           string;
  initials:     string;
  patientName:  string;
  patientRef:   string;
  type:         string;
  prescripteur: string;
  receivedAt:   string;
  priority:     Priority;
  status:       ExamStatus;
}

interface FilterOption { label: string; value: string | null; }

const PRIORITY_MAP: Record<string, Priority> = {
  URGENT:   'Urgent',
  PRIORITY: 'Prioritaire',
  NORMAL:   'Normal',
};

@Component({
  selector: 'app-examens-laboratoire',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './examens-laboratoire.component.html',
  styleUrl: './examens-laboratoire.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamensLaboratoireComponent implements OnInit {

  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);
  private api  = environment.baseUrl;

  loading = true;
  private allExams: ExamRow[] = [];

  // ── Display ────────────────────────────────────────────────────────────────
  exams: ExamRow[] = [];

  // ── Filters ────────────────────────────────────────────────────────────────
  searchTerm       = '';
  selectedStatus:   string | null = null;
  selectedPriority: string | null = null;
  statusLabel   = 'Tous les statuts';
  priorityLabel = 'Toutes les priorités';
  showStatusMenu   = false;
  showPriorityMenu = false;

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

  priorityOptions: FilterOption[] = [
    { label: 'Toutes les priorités', value: null        },
    { label: 'Urgent',               value: 'URGENT'    },
    { label: 'Prioritaire',          value: 'PRIORITY'  },
    { label: 'Normal',               value: 'NORMAL'    },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────────
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages    = 0;

  get startItem(): number { return this.totalElements === 0 ? 0 : this.page * this.size + 1; }
  get endItem():   number { return Math.min((this.page + 1) * this.size, this.totalElements); }

  ngOnInit(): void {
    this.loadExams();
  }

  private loadExams(): void {
    this.loading = true;
    const params: Record<string, string> = {};
    if (this.selectedStatus)   params['status']  = this.selectedStatus;
    if (this.selectedPriority) params['urgency'] = this.selectedPriority;

    this.http.get<any>(`${this.api}/diagnostic/lab-orders/all`, { params: { ...params, page: '1', limit: '100' } }).subscribe({
      next:  (res) => {
        const orders = Array.isArray(res) ? res : (res?.data ?? []);
        this.resolveNames(orders);
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
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
      next:  (names) => { const m: Record<string,string> = {}; for (const n of names) m[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim(); this.build(orders, m); },
      error: () => this.build(orders, {}),
    });
  }

  private build(orders: any[], names: Record<string, string>): void {
    this.allExams = orders.map(o => {
      const pName = names[o.patientId] || `Patient ${(o.patientId ?? '').slice(-6).toUpperCase()}`;
      const dName = names[o.doctorId]  ? `Dr. ${names[o.doctorId]}` : 'Médecin';
      const type  = (o.categories ?? []).length > 0 ? o.categories.join(', ') : (o.tests?.[0]?.testName ?? 'Bilan');
      const date  = o.receivedAt ?? o.createdAt;
      return {
        id:           o.id,
        initials:     pName.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase(),
        patientName:  pName,
        patientRef:   o.labOrderRef ?? '—',
        type,
        prescripteur: dName,
        receivedAt:   date ? new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—',
        priority:     PRIORITY_MAP[o.urgency] ?? 'Normal',
        status:       o.status as ExamStatus,
      };
    });
    this.loading = false;
    this.applyFilters();
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.allExams.filter(e =>
      !term ||
      e.patientName.toLowerCase().includes(term) ||
      e.patientRef.toLowerCase().includes(term)  ||
      e.type.toLowerCase().includes(term)
    );
    this.totalElements = filtered.length;
    this.totalPages    = Math.ceil(this.totalElements / this.size) || 1;
    if (this.page >= this.totalPages) this.page = 0;
    const start = this.page * this.size;
    this.exams  = filtered.slice(start, start + this.size);
    this.cdr.markForCheck();
  }

  onSearchChange(): void { this.page = 0; this.applyFilters(); }

  setStatus(opt: FilterOption): void {
    this.selectedStatus = opt.value;
    this.statusLabel    = opt.label;
    this.showStatusMenu = false;
    this.page = 0;
    this.loadExams();
  }

  setPriority(opt: FilterOption): void {
    this.selectedPriority  = opt.value;
    this.priorityLabel     = opt.label;
    this.showPriorityMenu  = false;
    this.page = 0;
    this.loadExams();
  }

  closeMenus(): void { this.showStatusMenu = false; this.showPriorityMenu = false; }
  prevPage(): void { if (this.page > 0) { this.page--; this.applyFilters(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.applyFilters(); } }
  onSizeChange(val: number): void { this.size = val; this.page = 0; this.applyFilters(); }

  // ── Status helpers ─────────────────────────────────────────────────────────
  getStatusLabel(s: ExamStatus): string {
    const m: Record<ExamStatus, string> = {
      PENDING: 'En attente', ACCEPTED: 'Accepté', FUNDED: 'Financé',
      IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', REJECTED: 'Rejeté', EXPIRED: 'Expiré'
    };
    return m[s] ?? s;
  }

  getStatusClass(s: ExamStatus): string {
    const m: Record<ExamStatus, string> = {
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

  getPriorityClass(p: Priority): string {
    if (p === 'Urgent')     return 'text-red-600 bg-red-50 border border-red-200';
    if (p === 'Prioritaire') return 'text-orange-600 bg-orange-50 border border-orange-200';
    return 'text-gray-500 bg-gray-50 border border-gray-200';
  }
}
