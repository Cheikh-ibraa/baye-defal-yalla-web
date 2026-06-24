import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface PatientDetail {
  patientId: string;
  fullname: string;
  age: number;
  genderLabel: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  photoUrl?: string;
  currentService: string;
}

interface PatientStat {
  label: string;
  value: string;
  icon: 'requests' | 'completed' | 'funding' | 'service';
  toneClass: string;
  trend?: string;
}

interface AssociatedRequest {
  id: string;
  type: string;
  status: 'APPROUVÉ' | 'EN ATTENTE' | 'TERMINÉ' | 'REFUSÉ';
  montant: string;
  service: string;
}

type CareStepStatus = 'completed' | 'active' | 'upcoming';

interface CarePathwayStep {
  title: string;
  subtitle: string;
  description: string;
  status: CareStepStatus;
  icon: 'check' | 'bed' | 'scalpel' | 'flag';
  actionLabel?: string;
}

interface HospitalPatientApi {
  id: string;
  patientKeycloakId: string;
  patientRef: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  bloodType: string;
  phone: string;
  email: string;
  address: string;
  currentService: string;
  referentDoctorName: string;
  careStatus: string;
  lastActivity: string;
  totalFunding: number;
  careJourney: Array<{
    step: string;
    status: 'done' | 'in_progress' | 'pending';
    date?: string;
    description?: string;
  }>;
  qrCodeUrl: string;
}

interface MedicalRequestApi {
  id: string;
  type: string;
  status: string;
  totalAmount: number;
  service: string;
  description: string;
  priority: string;
  actionHistory: Array<{ action: string; description: string; date: string }>;
}

@Component({
  selector: 'app-detail-patient',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-patient.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPatientComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = environment.baseUrl;

  patientId: string | null = null;
  loading = true;
  patient: PatientDetail | undefined;
  stats: PatientStat[] = [];
  demandes: AssociatedRequest[] = [];
  parcours: CarePathwayStep[] = [];

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (!this.patientId) {
      this.loading = false;
      return;
    }

    this.http.get<HospitalPatientApi>(`${this.api}/hospital/patients/${this.patientId}`).subscribe({
      next: (p) => {
        this.patient = this.mapPatient(p);
        this.http
          .get<{ data: MedicalRequestApi[] }>(
            `${this.api}/hospital/requests?patientId=${p.patientKeycloakId}&limit=50`,
          )
          .pipe(catchError(() => of({ data: [] as MedicalRequestApi[] })))
          .subscribe((res) => {
            const requests = res.data ?? [];
            this.demandes = requests.map((r) => this.mapDemande(r));
            this.stats = this.buildStats(p, requests);
            this.parcours = this.buildParcours(p, requests);
            this.loading = false;
            this.cdr.markForCheck();
          });
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapPatient(p: HospitalPatientApi): PatientDetail {
    const genderMap: Record<string, string> = {
      M: 'Homme', F: 'Femme', MALE: 'Homme', FEMALE: 'Femme',
    };
    return {
      patientId: p.patientRef ?? p.patientKeycloakId.slice(0, 8).toUpperCase(),
      fullname: [p.firstName, p.lastName].filter(Boolean).join(' ') || '—',
      age: p.age,
      genderLabel: genderMap[p.gender] ?? p.gender ?? '—',
      bloodGroup: p.bloodType ?? '—',
      phone: p.phone ?? '—',
      email: p.email ?? '—',
      address: p.address ?? '—',
      currentService: p.currentService ?? '—',
    };
  }

  private mapDemande(r: MedicalRequestApi): AssociatedRequest {
    const typeMap: Record<string, string> = {
      HOSPITALIZATION: 'Hospitalisation',
      PRESCRIPTION: 'Ordonnance',
      LAB_EXAM: 'Examen Laboratoire',
      SURGERY: 'Chirurgie',
      CONSULTATION: 'Consultation',
      OTHER: 'Autre',
    };
    const statusMap: Record<string, AssociatedRequest['status']> = {
      PENDING: 'EN ATTENTE',
      VALIDATED: 'APPROUVÉ',
      PAID: 'APPROUVÉ',
      TERMINATED: 'TERMINÉ',
      REJECTED: 'REFUSÉ',
    };
    return {
      id: r.id,
      type: typeMap[r.type] ?? r.type,
      status: statusMap[r.status] ?? 'EN ATTENTE',
      montant: r.totalAmount
        ? Number(r.totalAmount).toLocaleString('fr-FR') + ' FCFA'
        : '—',
      service: r.service ?? '—',
    };
  }

  private buildStats(p: HospitalPatientApi, requests: MedicalRequestApi[]): PatientStat[] {
    const total = requests.length;
    const terminated = requests.filter(
      (r) => r.status === 'TERMINATED' || r.status === 'PAID',
    ).length;
    const fundingRaw =
      Number(p.totalFunding) ||
      requests.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
    const fundingLabel =
      fundingRaw >= 1_000_000
        ? (fundingRaw / 1_000_000).toFixed(1) + 'M FCFA'
        : fundingRaw > 0
          ? fundingRaw.toLocaleString('fr-FR') + ' FCFA'
          : '—';

    return [
      {
        label: 'Demandes totales',
        value: String(total).padStart(2, '0'),
        icon: 'requests',
        toneClass: 'bg-[#EAF2FF] text-[#2563EB]',
      },
      {
        label: 'Soins terminés',
        value: String(terminated).padStart(2, '0'),
        icon: 'completed',
        toneClass: 'bg-[#EAF8F1] text-[#2FA373]',
      },
      {
        label: 'Financement total',
        value: fundingLabel,
        icon: 'funding',
        toneClass: 'bg-[#FEECEC] text-[#EF4444]',
      },
      {
        label: 'Service actuel',
        value: p.currentService ?? '—',
        icon: 'service',
        toneClass: 'bg-[#EAF2FF] text-[#2563EB]',
      },
    ];
  }

  private buildParcours(
    p: HospitalPatientApi,
    requests: MedicalRequestApi[],
  ): CarePathwayStep[] {
    if (p.careJourney?.length) {
      return p.careJourney.map((e) => ({
        title: e.step,
        subtitle: e.date
          ? new Date(e.date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })
          : '',
        description: e.description ?? '',
        status: (e.status === 'done'
          ? 'completed'
          : e.status === 'in_progress'
            ? 'active'
            : 'upcoming') as CareStepStatus,
        icon: (e.status === 'done'
          ? 'check'
          : e.status === 'in_progress'
            ? 'bed'
            : 'flag') as 'check' | 'bed' | 'flag',
      }));
    }

    const steps: CarePathwayStep[] = [];
    for (const req of requests) {
      for (const h of req.actionHistory ?? []) {
        const isDone =
          req.status === 'TERMINATED' ||
          req.status === 'PAID' ||
          req.status === 'REJECTED';
        const isActive = req.status === 'VALIDATED' || req.status === 'PENDING';
        const icon: 'check' | 'bed' | 'flag' =
          h.action.includes('Acceptée') ||
          h.action.includes('Validée') ||
          h.action.includes('Reçue')
            ? 'check'
            : h.action.includes('Financement')
              ? 'bed'
              : 'flag';
        steps.push({
          title: h.action,
          subtitle: new Date(h.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          description: h.description,
          status: isDone ? 'completed' : isActive ? 'active' : 'upcoming',
          icon,
        });
      }
    }
    return steps.slice(0, 10);
  }

  back(): void {
    this.router.navigate(['/hospital/patients']);
  }

  viewDemande(id: string): void {
    this.router.navigate(['/hospital/demandes', id]);
  }

  statusClass(status: AssociatedRequest['status']): string {
    switch (status) {
      case 'APPROUVÉ':   return 'bg-[#EAF8F1] text-[#2FA373]';
      case 'EN ATTENTE': return 'bg-[#EAF2FF] text-[#2563EB]';
      case 'TERMINÉ':    return 'bg-[#F1F5F9] text-[#64748B]';
      case 'REFUSÉ':     return 'bg-[#FEE2E2] text-[#DC2626]';
      default:           return 'bg-slate-100 text-slate-600';
    }
  }

  stepIconClass(status: CareStepStatus): string {
    switch (status) {
      case 'completed': return 'bg-[#2FA373] text-white';
      case 'active':    return 'bg-[#2563EB] text-white';
      case 'upcoming':  return 'bg-[#F1F5F9] text-[#CBD5E1]';
      default:          return 'bg-slate-100 text-slate-400';
    }
  }

  stepTitleClass(status: CareStepStatus): string {
    switch (status) {
      case 'completed': return 'text-[#0F172A]';
      case 'active':    return 'text-[#2563EB]';
      case 'upcoming':  return 'text-[#64748B]';
      default:          return 'text-slate-600';
    }
  }

  stepSubtitleClass(status: CareStepStatus): string {
    return status === 'active'
      ? 'text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]'
      : 'text-xs text-[#94A3B8]';
  }

  stepBoxClass(status: CareStepStatus): string {
    switch (status) {
      case 'completed': return 'bg-[#F8FAFC] text-[#475569]';
      case 'active':    return 'border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]';
      case 'upcoming':  return 'border border-dashed border-[#CBD5E1] bg-white text-[#94A3B8]';
      default:          return 'bg-slate-50 text-slate-600';
    }
  }
}
