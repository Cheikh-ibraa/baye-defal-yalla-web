import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface HospitalizationApi {
  id: string;
  admissionRef: string;
  patientName: string;
  patientAge: number;
  patientRef: string;
  service: string;
  room: string;
  bed: string;
  treatingDoctorName: string;
  bloodGroup: string;
  admissionDate: string;
  expectedDischargeDate: string;
  actualDischargeDate: string;
  lastObservation: string;
  stateEvolution: string;
  recoveryPercent: number;
  totalAmount: number;
  fundingStatus: string;
  careJourney: Array<{
    step: string;
    status: 'done' | 'in_progress' | 'pending';
    date?: string;
    description?: string;
    location?: string;
    tags?: string[];
  }>;
  status: 'ADMITTED' | 'IN_PROGRESS' | 'URGENT' | 'DISCHARGED';
}

interface StayInfoField {
  icon: 'calendar' | 'service' | 'room' | 'doctor';
  label: string;
  value: string;
}

interface TimelineStep {
  status: 'completed' | 'active' | 'pending';
  title: string;
  subtitle: string;
  note?: string;
  tags?: string[];
}

interface HospDetail {
  fullname: string;
  displayId: string;
  statusLabel: string;
  statusBadgeClass: string;
  age: number;
  bloodGroup: string;
  stayInfo: StayInfoField[];
  lastObservation: { badge: string; text: string };
  evolution: { status: string; text: string; recoveryPercent: number };
  financial: { totalAmount: string; fundingStatus: string };
  timeline: TimelineStep[];
  canDischarge: boolean;
}

@Component({
  selector: 'app-detail-hospitalisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-hospitalisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailHospitalisationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = environment.baseUrl;

  hospitalisationId = '';
  loading = true;
  detail: HospDetail | null = null;

  ngOnInit(): void {
    this.hospitalisationId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDetail();
  }

  private loadDetail(): void {
    this.http.get<HospitalizationApi>(`${this.api}/hospital/hospitalizations/${this.hospitalisationId}`).subscribe({
      next: h => {
        this.detail = this.mapDetail(h);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapDetail(h: HospitalizationApi): HospDetail {
    const statusLabelMap: Record<string, string> = {
      ADMITTED:    'En cours',
      IN_PROGRESS: 'En cours',
      URGENT:      'Urgent',
      DISCHARGED:  'Sorti',
    };
    const statusBadgeMap: Record<string, string> = {
      ADMITTED:    'bg-[#FFF3E8] text-[#F97316]',
      IN_PROGRESS: 'bg-[#FFF3E8] text-[#F97316]',
      URGENT:      'bg-[#FEE2E2] text-[#DC2626]',
      DISCHARGED:  'bg-[#ECFDF5] text-[#059669]',
    };

    const admDate = new Date(h.admissionDate);
    const admLabel = admDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const chambre = [h.room, h.bed].filter(Boolean).join(' / ') || '—';

    const stayInfo: StayInfoField[] = [
      { icon: 'calendar', label: "Date d'admission", value: admLabel },
      { icon: 'service',  label: 'Service',          value: h.service ?? '—' },
      { icon: 'room',     label: 'Chambre / Lit',    value: chambre },
      { icon: 'doctor',   label: 'Médecin traitant', value: h.treatingDoctorName ?? '—' },
    ];

    const timeline: TimelineStep[] = (h.careJourney ?? []).map(e => ({
      status:   e.status === 'done' ? 'completed' : e.status === 'in_progress' ? 'active' : 'pending',
      title:    e.step,
      subtitle: e.date
        ? new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : (e.location ?? ''),
      note:  e.description,
      tags:  [],
    }));

    // Ajouter étape "Sortie prévue" si pas encore sorti
    if (h.status !== 'DISCHARGED' && h.expectedDischargeDate) {
      timeline.push({
        status:   'pending',
        title:    'Sortie prévue',
        subtitle: 'Date estimée : ' + new Date(h.expectedDischargeDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      });
    }
    if (h.status === 'DISCHARGED' && h.actualDischargeDate) {
      timeline.push({
        status:   'completed',
        title:    'Sortie effective',
        subtitle: new Date(h.actualDischargeDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      });
    }

    const totalAmountFmt = h.totalAmount
      ? Number(h.totalAmount).toLocaleString('fr-FR') + ' FCFA'
      : '—';

    const fundingLabel = h.fundingStatus ?? (h.totalAmount ? 'Pris en charge' : 'Non renseigné');

    return {
      fullname:         h.patientName ?? '—',
      displayId:        h.admissionRef ?? h.patientRef ?? '—',
      statusLabel:      statusLabelMap[h.status] ?? h.status,
      statusBadgeClass: statusBadgeMap[h.status] ?? 'bg-slate-100 text-slate-600',
      age:              h.patientAge ?? 0,
      bloodGroup:       h.bloodGroup ?? '—',
      stayInfo,
      lastObservation: {
        badge: h.status === 'DISCHARGED' ? 'Sorti' : h.status === 'URGENT' ? 'Urgent' : 'En cours',
        text:  h.lastObservation ?? 'Aucune observation enregistrée.',
      },
      evolution: {
        status:          h.stateEvolution ?? (h.status === 'DISCHARGED' ? 'Rétablissement complet' : 'Suivi en cours'),
        text:            h.stateEvolution ?? '',
        recoveryPercent: h.recoveryPercent ?? 0,
      },
      financial: {
        totalAmount:   totalAmountFmt,
        fundingStatus: fundingLabel,
      },
      timeline,
      canDischarge: h.status !== 'DISCHARGED',
    };
  }

  back(): void {
    this.router.navigate(['/hospital/hospitalisations']);
  }

  dischargePatient(): void {
    if (!this.detail) return;
    Swal.fire({
      title: 'Autoriser la sortie',
      html: `<p style="color:#6B7280;font-size:14px">Confirmer la sortie de <strong style="color:#191B23">${this.detail.fullname}</strong> ?<br>Cette action ne peut pas être annulée.</p>`,
      confirmButtonText: 'Confirmer la sortie',
      cancelButtonText: 'Annuler',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      icon: 'warning',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.http.patch<HospitalizationApi>(`${this.api}/hospital/hospitalizations/${this.hospitalisationId}/discharge`, {}).subscribe({
        next: h => {
          this.detail = this.mapDetail(h);
          this.cdr.markForCheck();
          Swal.fire({ icon: 'success', title: 'Patient sorti', timer: 1500, showConfirmButton: false });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible d\'autoriser la sortie.' }),
      });
    });
  }

  stepIconClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-[#1E6B34] text-white';
      case 'active':    return 'bg-[#00339E] text-white';
      default:          return 'bg-[#CBD5E1] text-[#94A3B8]';
    }
  }

  stepTitleClass(status: string): string {
    switch (status) {
      case 'completed': return 'text-[#0F172A] font-bold';
      case 'active':    return 'text-[#00339E] font-bold';
      default:          return 'text-[#94A3B8] font-bold';
    }
  }
}
