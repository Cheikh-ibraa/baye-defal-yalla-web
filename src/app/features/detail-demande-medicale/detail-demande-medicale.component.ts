import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface MedicalRequest {
  id: string;
  patientId: string;
  patientName: string;
  referentDoctorId: string;
  referentDoctorName: string;
  type: string;
  service: string;
  description: string;
  priority: 'URGENT' | 'NORMAL';
  status: 'PENDING' | 'VALIDATED' | 'PAID' | 'TERMINATED' | 'REJECTED';
  totalAmount: number;
  fundedAmount: number;
  actionHistory: { action: string; description: string; date: string }[];
  medicalServiceRef?: string;
}

@Component({
  selector: 'app-detail-demande-medicale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-demande-medicale.component.html',
  styleUrls: ['./detail-demande-medicale.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailDemandeMedicaleComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly location = inject(Location);
  private readonly http     = inject(HttpClient);
  private readonly cdr      = inject(ChangeDetectorRef);
  private readonly api      = environment.baseUrl;

  readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';

  request: MedicalRequest | null = null;
  loading = true;

  showValidateModal = false;
  validateDate  = '';
  validateTime  = '';
  validatePrice = '';
  validateNote  = '';
  isSubmitting  = false;

  ngOnInit() {
    this.http.get<MedicalRequest>(`${this.api}/hospital/requests/${this.requestId}`).subscribe({
      next: data => {
        this.request = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  goBack() { this.location.back(); }

  get isPending() { return this.request?.status === 'PENDING'; }

  get canAdmit(): boolean {
    return this.request?.type === 'HOSPITALIZATION' && this.request?.status === 'PAID';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      PENDING:    'En attente',
      VALIDATED:  'Validée',
      PAID:       'Financée',
      TERMINATED: 'Terminée',
      REJECTED:   'Rejetée',
    };
    return map[this.request?.status ?? ''] ?? '—';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      PENDING:    'bg-[#FFF3E8] text-[#F97316]',
      VALIDATED:  'bg-[#EAF8F1] text-[#2FA373]',
      PAID:       'bg-[#EAF2FF] text-[#2563EB]',
      TERMINATED: 'bg-[#F1F4F9] text-[#6B7280]',
      REJECTED:   'bg-[#FBE5DF] text-[#CB5A37]',
    };
    return map[this.request?.status ?? ''] ?? '';
  }

  get actType(): string {
    const map: Record<string, string> = {
      HOSPITALIZATION: 'Hospitalisation',
      PRESCRIPTION:    'Ordonnance',
      LAB_EXAM:        'Examen Laboratoire',
      SURGERY:         'Chirurgie',
      CONSULTATION:    'Consultation',
      OTHER:           'Autre',
    };
    return map[this.request?.type ?? ''] ?? '—';
  }

  get fundedPercent(): number {
    if (!this.request?.totalAmount) return 0;
    return Math.min(100, Math.round((Number(this.request.fundedAmount) / Number(this.request.totalAmount)) * 100));
  }

  get remainingAmount(): number {
    return Math.max(0, Number(this.request?.totalAmount ?? 0) - Number(this.request?.fundedAmount ?? 0));
  }

  get financeNote(): string {
    if (!this.request) return '';
    if (this.request.status === 'PAID') return 'Le financement est complet. La prise en charge peut démarrer.';
    if (Number(this.request.fundedAmount) > 0) return 'Le financement est en cours. Une partie des fonds a déjà été collectée.';
    if (this.request.status === 'VALIDATED') return 'Demande acceptée. En attente de financement via la campagne.';
    return 'En attente de validation par l\'hôpital.';
  }

  historyTone(action: string): 'green' | 'blue' | 'gray' {
    if (action.includes('Acceptée') || action.includes('Validée') || action.includes('Reçue')) return 'green';
    if (action.includes('Financement') || action.includes('Payé') || action.includes('PAID')) return 'blue';
    return 'gray';
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return '0 FCFA';
    return Number(amount).toLocaleString('fr-FR') + ' FCFA';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  admitPatient() {
    if (!this.request) return;
    Swal.fire({
      title: 'Admettre le patient',
      html: `
        <p style="margin-bottom:16px;color:#6B7280;font-size:14px">
          Confirmer l'admission de <strong style="color:#191B23">${this.request.patientName}</strong>
          en <strong style="color:#191B23">${this.request.service || 'service non précisé'}</strong>.
        </p>
        <div style="margin-bottom:12px;text-align:left">
          <label style="font-size:13px;color:#374151;font-weight:500">Chambre / Lit (optionnel)</label>
          <input id="swal-room" type="text" class="swal2-input" placeholder="ex: 402-A" style="margin-top:6px">
        </div>
        <div style="text-align:left">
          <label style="font-size:13px;color:#374151;font-weight:500">Médecin responsable (optionnel)</label>
          <input id="swal-doctor" type="text" class="swal2-input" placeholder="Dr. Nom Prénom" style="margin-top:6px">
        </div>
      `,
      confirmButtonText: 'Admettre',
      cancelButtonText: 'Annuler',
      showCancelButton: true,
      confirmButtonColor: '#124A92',
      preConfirm: () => ({
        room:               (document.getElementById('swal-room')   as HTMLInputElement)?.value  || undefined,
        treatingDoctorName: (document.getElementById('swal-doctor') as HTMLInputElement)?.value  || undefined,
      }),
    }).then(result => {
      if (!result.isConfirmed || !this.request) return;
      const dto = {
        patientId:          this.request.patientId,
        patientName:        this.request.patientName,
        service:            this.request.service || undefined,
        admissionDate:      new Date().toISOString(),
        room:               result.value.room,
        treatingDoctorName: result.value.treatingDoctorName,
      };
      this.http.post<{ id: string }>(`${this.api}/hospital/hospitalizations`, dto).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Patient admis', text: 'L\'hospitalisation a été créée.', timer: 1800, showConfirmButton: false });
          this.router.navigate(['/hospital/hospitalisations']);
        },
        error: () => Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de créer l\'hospitalisation.' }),
      });
    });
  }

  openValidate() {
    if (!this.request) return;
    this.validateDate  = '';
    this.validateTime  = '';
    this.validatePrice = '';
    this.validateNote  = '';
    this.showValidateModal = true;
  }

  closeValidateModal() {
    this.showValidateModal = false;
  }

  confirmValidate() {
    if (!this.request || this.isSubmitting) return;
    const isHospit = this.request.type === 'HOSPITALIZATION';

    if (isHospit && (!this.validatePrice || Number(this.validatePrice) <= 0)) {
      Swal.fire({ icon: 'warning', title: 'Montant requis', text: 'Veuillez saisir un montant valide.', confirmButtonColor: '#124A92' });
      return;
    }

    this.isSubmitting = true;
    const url = isHospit
      ? `${this.api}/hospital/requests/${this.request.id}/hospitalization/accept`
      : `${this.api}/hospital/requests/${this.request.id}/validate`;
    const body = isHospit
      ? { price: Number(this.validatePrice), note: this.validateNote || undefined, date: this.validateDate || undefined, time: this.validateTime || undefined }
      : {};

    this.http.patch<MedicalRequest>(url, body).subscribe({
      next: updated => {
        this.request = updated;
        this.showValidateModal = false;
        this.isSubmitting = false;
        this.cdr.markForCheck();
        Swal.fire({ icon: 'success', title: 'Demande validée', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        this.isSubmitting = false;
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de valider la demande.' });
      },
    });
  }

  openReject() {
    if (!this.request) return;
    Swal.fire({
      title: 'Rejeter la demande',
      html: `
        <div style="text-align:left">
          <label style="font-size:13px;color:#374151;font-weight:500">Motif du rejet</label>
          <textarea id="swal-reason" class="swal2-textarea" placeholder="Expliquez le motif…" style="margin-top:6px;height:90px"></textarea>
        </div>
      `,
      confirmButtonText: 'Rejeter',
      cancelButtonText: 'Annuler',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      preConfirm: () => {
        return { reason: (document.getElementById('swal-reason') as HTMLTextAreaElement)?.value || undefined };
      },
    }).then(result => {
      if (!result.isConfirmed || !this.request) return;
      const isHospit = this.request.type === 'HOSPITALIZATION';
      const url = isHospit
        ? `${this.api}/hospital/requests/${this.request.id}/hospitalization/reject`
        : `${this.api}/hospital/requests/${this.request.id}/reject`;

      this.http.patch<MedicalRequest>(url, { reason: result.value.reason }).subscribe({
        next: updated => {
          this.request = updated;
          this.cdr.markForCheck();
          Swal.fire({ icon: 'success', title: 'Demande rejetée', timer: 1500, showConfirmButton: false });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de rejeter la demande.' }),
      });
    });
  }
}
