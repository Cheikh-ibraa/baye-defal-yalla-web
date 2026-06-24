import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus = 'PENDING' | 'ACCEPTED' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';
type Priority    = 'Urgent' | 'Normal';

interface ExamRow {
  id:          string;
  initials:    string;
  patientName: string;
  patientRef:  string;
  type:        string;
  prescripteur: string;
  equipements: string[];
  receivedAt:  string;
  priority:    Priority;
  status:      OrderStatus;
}

interface FilterOption { label: string; value: string | null; }

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-examens-imagerie',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './examens-imagerie.component.html',
  styleUrl: './examens-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamensImagerieComponent implements OnInit {

  private readonly api = environment.baseUrl;

  loading = true;
  exams: ExamRow[] = [];

  // ── Filters ────────────────────────────────────────────────────────────────
  searchTerm      = '';
  selectedStatus: string | null   = null;
  selectedPriority: string | null = null;
  statusLabel   = 'Tous les statuts';
  priorityLabel = 'Toutes les priorités';
  showStatusMenu   = false;
  showPriorityMenu = false;

  statusOptions: FilterOption[] = [
    { label: 'Tous les statuts', value: null        },
    { label: 'En attente',       value: 'PENDING'    },
    { label: 'Accepté',          value: 'ACCEPTED'   },
    { label: 'Financé',          value: 'FUNDED'     },
    { label: 'En cours',         value: 'IN_PROGRESS'},
    { label: 'Terminé',          value: 'COMPLETED'  },
    { label: 'Refusé',           value: 'REJECTED'   },
    { label: 'Expiré',           value: 'EXPIRED'    },
  ];

  priorityOptions: FilterOption[] = [
    { label: 'Toutes les priorités', value: null     },
    { label: 'Urgent',               value: 'URGENT' },
    { label: 'Normal',               value: 'NORMAL' },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────────
  page          = 0;
  size          = 10;
  totalElements = 0;
  totalPages    = 0;

  get startItem(): number { return this.totalElements === 0 ? 0 : this.page * this.size + 1; }
  get endItem():   number { return Math.min((this.page + 1) * this.size, this.totalElements); }

  private allRows: ExamRow[] = [];

  constructor(
    private http: HttpClient,
    private cdr:  ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void { this.loadExams(); }

  // ── Load ───────────────────────────────────────────────────────────────────
  loadExams(): void {
    this.loading = true;
    this.http.get<any>(`${this.api}/diagnostic/imaging-orders/all`, { params: { page: '1', limit: '100' } })
      .pipe(catchError(() => of({ data: [] })))
      .subscribe(res => {
        const orders = Array.isArray(res) ? res : (res?.data ?? []);
        this.resolveNames(orders);
      });
  }

  private resolveNames(orders: any[]): void {
    const ids = [...new Set([
      ...orders.map(o => o.patientId).filter(Boolean),
      ...orders.map(o => o.doctorId).filter(Boolean),
    ])] as string[];

    if (!ids.length) { this.build(orders, {}); return; }

    this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
      `${this.api}/users/names?ids=${ids.join(',')}`
    ).pipe(catchError(() => of([]))).subscribe(names => {
      const m: Record<string, string> = {};
      for (const n of names) m[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
      this.build(orders, m);
    });
  }

  private build(orders: any[], names: Record<string, string>): void {
    const PRI_MAP: Record<string, Priority> = { URGENT: 'Urgent', PRIORITY: 'Urgent', NORMAL: 'Normal' };

    this.allRows = orders.map(o => {
      const pName    = names[o.patientId] || `Patient ${(o.patientId ?? '').slice(-6).toUpperCase()}`;
      const dName    = names[o.doctorId]  ? `Dr. ${names[o.doctorId]}` : 'Médecin';
      const cats     = (o.examTypes ?? o.categories ?? []) as string[];
      const regions  = (o.bodyRegions ?? []) as string[];
      const type     = [...cats, ...regions].join(', ') || (o.type ?? 'Examen');
      const equips   = o.equipment ? [o.equipment] : cats.slice(0, 2);
      const date     = o.receivedAt ?? o.createdAt;
      const initials = pName.split(' ').filter((w: string) => w).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

      return {
        id:          o.id,
        initials,
        patientName: pName,
        patientRef:  o.imagingOrderRef ?? '—',
        type,
        prescripteur: dName,
        equipements: equips,
        receivedAt:  date ? new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—',
        priority:    PRI_MAP[o.urgency] ?? 'Normal',
        status:      o.status as OrderStatus,
      };
    });

    this.loading = false;
    this.applyFilters();
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.allRows.filter(e => {
      const matchSearch   = !term
        || e.patientName.toLowerCase().includes(term)
        || e.patientRef.toLowerCase().includes(term)
        || e.type.toLowerCase().includes(term);
      const matchStatus   = !this.selectedStatus   || e.status === this.selectedStatus;
      const matchPriority = !this.selectedPriority || e.priority === (this.selectedPriority === 'URGENT' ? 'Urgent' : 'Normal');
      return matchSearch && matchStatus && matchPriority;
    });

    this.totalElements = filtered.length;
    this.totalPages    = Math.ceil(this.totalElements / this.size) || 1;
    if (this.page >= this.totalPages) this.page = 0;
    const start  = this.page * this.size;
    this.exams   = filtered.slice(start, start + this.size);
    this.cdr.markForCheck();
  }

  onSearchChange(): void { this.page = 0; this.applyFilters(); }

  setStatus(opt: FilterOption): void {
    this.selectedStatus = opt.value;
    this.statusLabel    = opt.label;
    this.showStatusMenu = false;
    this.page = 0;
    this.applyFilters();
  }

  setPriority(opt: FilterOption): void {
    this.selectedPriority  = opt.value;
    this.priorityLabel     = opt.label;
    this.showPriorityMenu  = false;
    this.page = 0;
    this.applyFilters();
  }

  closeMenus(): void { this.showStatusMenu = false; this.showPriorityMenu = false; }

  // ── Pagination ─────────────────────────────────────────────────────────────
  prevPage(): void { if (this.page > 0) { this.page--; this.applyFilters(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.applyFilters(); } }
  onSizeChange(val: number): void { this.size = val; this.page = 0; this.applyFilters(); }

  // ── Navigation ─────────────────────────────────────────────────────────────
  viewExam(id: string): void { this.router.navigate(['/imaging/examens', id]); }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getStatusLabel(s: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      PENDING: 'En attente', ACCEPTED: 'Accepté', FUNDED: 'Financé',
      IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', REJECTED: 'Refusé', EXPIRED: 'Expiré',
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
}
