import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ImagingDashboard {
  newRequests:    number;
  urgentRequests: number;
  accepted:       number;
  completed:      number;
  inProgress:     number;
  receivedToday:  number;
}

type Priority     = 'Urgent' | 'Normal';
type OrderStatus  = 'PENDING' | 'ACCEPTED' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

interface PlanningExam {
  id:              string;
  patientInitials: string;
  patientName:     string;
  patientRef:      string;
  type:            string;
  prescripteur:    string;
  receivedAt:      string;
  priority:        Priority;
  status:          OrderStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard-imagerie',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-imagerie.component.html',
  styleUrl: './dashboard-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardImagerieComponent implements OnInit {

  loading = true;
  private readonly api = environment.baseUrl;

  // Stats
  statDuJour   = 0;
  statAttente  = 0;
  statUrgents  = 0;
  statRealises = 0;

  planningExams: PlanningExam[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    forkJoin({
      dashboard: this.http.get<ImagingDashboard>(`${this.api}/diagnostic/imaging/dashboard`).pipe(catchError(() => of(null))),
      orders:    this.http.get<any>(`${this.api}/diagnostic/imaging-orders/all`, { params: { page: '1', limit: '10' } }).pipe(catchError(() => of({ data: [] }))),
    }).subscribe(({ dashboard, orders }) => {
      if (dashboard) {
        this.statDuJour   = dashboard.receivedToday  ?? 0;
        this.statAttente  = dashboard.newRequests     ?? 0;
        this.statUrgents  = dashboard.urgentRequests  ?? 0;
        this.statRealises = dashboard.completed       ?? 0;
      }
      const list = Array.isArray(orders) ? orders : (orders?.data ?? []);
      this.resolveNames(list);
    });
  }

  private resolveNames(orders: any[]): void {
    const ids = [...new Set([
      ...orders.map((o: any) => o.patientId).filter(Boolean),
      ...orders.map((o: any) => o.doctorId).filter(Boolean),
    ])];

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
    const PRIORITY_MAP: Record<string, Priority> = {
      URGENT:   'Urgent',
      PRIORITY: 'Urgent',
      NORMAL:   'Normal',
    };

    this.planningExams = orders.slice(0, 10).map((o: any) => {
      const pName = names[o.patientId] || `Patient ${(o.patientId ?? '').slice(-6).toUpperCase()}`;
      const dName = names[o.doctorId]  ? `Dr. ${names[o.doctorId]}` : 'Médecin';
      const cats  = (o.categories ?? o.examTypes ?? []) as string[];
      const type  = cats.length > 0 ? cats.join(', ') : (o.examType ?? o.type ?? 'Examen');
      const date  = o.receivedAt ?? o.createdAt;
      const initials = pName.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
      return {
        id:              o.id,
        patientInitials: initials,
        patientName:     pName,
        patientRef:      o.imagingOrderRef ?? o.labOrderRef ?? '—',
        type,
        prescripteur:    dName,
        receivedAt:      date ? new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—',
        priority:        PRIORITY_MAP[o.urgency] ?? 'Normal',
        status:          o.status as OrderStatus,
      };
    });

    this.loading = false;
    this.cdr.markForCheck();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

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

  navigateToAll(): void {
    this.router.navigate(['/imaging/examens']);
  }

  viewExam(id: string): void {
    this.router.navigate(['/imaging/examens', id]);
  }
}
