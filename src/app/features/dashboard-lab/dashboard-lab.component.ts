import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

type Priority   = 'Urgent' | 'Prioritaire' | 'Normal';
type ExamStatus = 'En attente' | 'En cours' | 'Validé' | 'Annulé';

interface ExamRow {
  id: string;
  initials: string;
  patientName: string;
  patientRef: string;
  type: string;
  prescripteur: string;
  receivedAt: string;
  priority: Priority;
  status: ExamStatus;
}

interface PerformanceBar {
  label: string;
  value: number;
  displayValue: string;
  valueClass: string;
  barClass: string;
  subLabel: string;
}

interface AssuranceItem {
  label: string;
  percent: number;
  dotClass: string;
}

interface LabDashboard {
  newRequests: number;
  urgentRequests: number;
  accepted: number;
  funded: number;
  inProgress: number;
  completed: number;
  expired: number;
  receivedToday: number;
  insurance: { covered: number; pending: number; refused: number };
  performance: { avgTurnaroundMin: number; conformanceRate: number; abnormalRate: number };
  actionsRequired: { toAccept: number; toStart: number; toComplete: number };
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard-lab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-lab.component.html',
  styleUrl: './dashboard-lab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLabComponent implements OnInit {

  loading = true;
  private readonly api = environment.baseUrl;

  stats = [
    { label: 'Examens reçus',      value: 0, sub: "Aujourd'hui",    subClass: 'text-gray-400',  icon: 'flask' },
    { label: 'Examens en attente', value: 0, sub: '',               subClass: 'text-gray-400',  icon: 'clock' },
    { label: 'Examens urgents',    value: 0, sub: '',               subClass: 'text-red-500',   icon: 'alert' },
    { label: 'Examens validés',    value: 0, sub: '',               subClass: 'text-[#00B894]', icon: 'check' }
  ];

  examens: ExamRow[] = [];
  performance: PerformanceBar[] = [];
  assurance: AssuranceItem[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    forkJoin({
      dashboard: this.http.get<LabDashboard>(`${this.api}/diagnostic/lab/dashboard`),
      orders:    this.http.get<any[]>(`${this.api}/diagnostic/lab-orders/all`)
    }).subscribe({
      next: ({ dashboard, orders }) => {
        this.applyDashboard(dashboard);
        this.resolveNamesAndApplyOrders(orders);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private resolveNamesAndApplyOrders(orders: any[]): void {
    const ids = [...new Set([
      ...orders.map(o => o.patientId).filter(Boolean),
      ...orders.map(o => o.doctorId).filter(Boolean),
    ])];

    if (!ids.length) {
      this.applyOrders(orders, {});
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
      `${this.api}/users/names?ids=${ids.join(',')}`
    ).subscribe({
      next: (names) => {
        const map: Record<string, string> = {};
        for (const n of names) {
          map[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim() || n.keycloakId.slice(0, 8);
        }
        this.applyOrders(orders, map);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.applyOrders(orders, {});
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private applyDashboard(d: LabDashboard): void {
    this.stats[0].value = d.receivedToday;
    this.stats[1].value = d.newRequests;
    this.stats[1].sub   = d.funded > 0 ? `Dont ${d.funded} financé(s)` : '';
    this.stats[2].value = d.urgentRequests;
    this.stats[2].sub   = d.urgentRequests > 0 ? `${d.urgentRequests} urgent(s)` : '';
    this.stats[3].value = d.completed;
    this.stats[3].sub   = d.inProgress > 0 ? `${d.inProgress} en cours` : '';

    const avgMin = d.performance?.avgTurnaroundMin ?? 45;
    const conf   = d.performance?.conformanceRate  ?? 100;
    const abn    = d.performance?.abnormalRate     ?? 0;

    this.performance = [
      {
        label: 'Délai moyen de rendu',
        value: Math.min(Math.round((60 / (avgMin || 1)) * 75), 100),
        displayValue: `${avgMin} min`,
        valueClass: 'text-[#343A40] font-medium',
        barClass: 'bg-[#2C7BE5]',
        subLabel: 'Objectif : < 60 min'
      },
      {
        label: 'Taux de conformité',
        value: conf,
        displayValue: `${conf}%`,
        valueClass: 'text-[#343A40] font-medium',
        barClass: 'bg-[#00B894]',
        subLabel: ''
      },
      {
        label: 'Analyses anormales',
        value: abn,
        displayValue: `${abn}%`,
        valueClass: 'text-[#F59E0B] font-semibold',
        barClass: 'bg-[#F59E0B]',
        subLabel: ''
      }
    ];

    const insTotal = (d.insurance?.covered ?? 0) + (d.insurance?.pending ?? 0) + (d.insurance?.refused ?? 0) || 1;
    this.assurance = [
      { label: 'Pris en charge', percent: Math.round((d.insurance?.covered ?? 0) / insTotal * 100), dotClass: 'bg-[#00B894]' },
      { label: 'En attente',     percent: Math.round((d.insurance?.pending ?? 0) / insTotal * 100),  dotClass: 'bg-[#F59E0B]' },
      { label: 'Refusé',         percent: Math.round((d.insurance?.refused ?? 0) / insTotal * 100),  dotClass: 'bg-red-500'   },
    ];
  }

  private applyOrders(orders: any[], names: Record<string, string>): void {
    const STATUS_MAP: Record<string, ExamStatus> = {
      PENDING:     'En attente',
      ACCEPTED:    'En attente',
      FUNDED:      'En attente',
      IN_PROGRESS: 'En cours',
      COMPLETED:   'Validé',
      REJECTED:    'Annulé',
      EXPIRED:     'Annulé',
    };
    const PRIORITY_MAP: Record<string, Priority> = {
      NORMAL:   'Normal',
      PRIORITY: 'Prioritaire',
      URGENT:   'Urgent',
    };

    this.examens = (orders ?? []).slice(0, 10).map(o => {
      const patientName = names[o.patientId] ?? `Patient ${(o.patientId ?? '').slice(-6).toUpperCase()}`;
      const doctorName  = names[o.doctorId]  ? `Dr. ${names[o.doctorId]}` : `Dr. ${(o.doctorId ?? '').slice(-6).toUpperCase()}`;
      const type  = o.categories?.length > 0 ? o.categories.join(', ') : (o.tests?.[0]?.testName ?? 'Bilan');
      const date  = o.receivedAt ?? o.createdAt;
      const initials = patientName.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
      return {
        id:           o.id,
        initials,
        patientName,
        patientRef:   o.labOrderRef ?? '—',
        type,
        prescripteur: doctorName,
        receivedAt:   date ? new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—',
        priority:     PRIORITY_MAP[o.urgency] ?? 'Normal',
        status:       STATUS_MAP[o.status]    ?? 'En attente',
      };
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getStatusClass(status: ExamStatus): string {
    switch (status) {
      case 'En attente': return 'bg-yellow-100 text-yellow-700';
      case 'En cours':   return 'bg-blue-100 text-blue-700';
      case 'Validé':     return 'bg-green-100 text-[#00B894]';
      case 'Annulé':     return 'bg-red-100 text-red-600';
    }
  }

  navigateToAll(): void { this.router.navigate(['/laboratory/examens']); }
  viewExam(id: string): void { this.router.navigate(['/laboratory/examens', id]); }
}
