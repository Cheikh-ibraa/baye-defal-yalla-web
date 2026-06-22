import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface NursingJournalEntry {
  id: string;
  date: string;
  time: string;
  type: string;
  description: string;
  dose?: string;
  observations?: string;
  nurseName: string;
}

interface DischargeInfo {
  dischargeDate: string;
  dischargeTime: string;
  patientState: string;
  recommendations: string;
  homeTreatment: string;
  medicalComments: string;
}

interface HospitalizationDetail {
  id: string;
  establishmentName: string;
  hospitalName: string;
  department: string;
  motif: string;
  initialDiagnosis: string;
  admissionDate: string;
  expectedDischargeDate: string;
  referentDoctorName: string;
  serviceContact: string;
  room: string;
  bed: string;
  priority: 'Normal' | 'Urgent';
  medicalObservations: string;
  nursingJournal: NursingJournalEntry[];
  dischargeInfo: DischargeInfo | null;
  status: string;
  acceptedPrice: number;
  hospitalNote: string;
  campaignId: string;
}

type ActiveTab = 'resume' | 'journal' | 'sortie';

@Component({
  selector: 'app-patient-hospitalization-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-hospitalization-detail.component.html',
})
export class PatientHospitalizationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly api = environment.baseUrl;

  id = '';
  loading = true;
  detail: HospitalizationDetail | null = null;
  activeTab: ActiveTab = 'resume';

  private readonly statusLabels: Record<string, string> = {
    PENDING:    'En attente',
    ACCEPTED:   'Acceptée',
    FUNDED:     'Financée',
    ADMITTED:   'Admis',
    DISCHARGED: 'Sorti',
    REJECTED:   'Refusée',
  };

  private readonly statusClasses: Record<string, string> = {
    PENDING:    'bg-yellow-100 text-yellow-700',
    ACCEPTED:   'bg-blue-100 text-blue-700',
    FUNDED:     'bg-purple-100 text-purple-700',
    ADMITTED:   'bg-orange-100 text-orange-700',
    DISCHARGED: 'bg-green-100 text-green-700',
    REJECTED:   'bg-red-100 text-red-700',
  };

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<HospitalizationDetail>(`${this.api}/patient/hospitalizations/${this.id}`).subscribe({
      next: data => {
        this.detail = data;
        this.loading = false;
      },
      error: () => {
        this.detail = null;
        this.loading = false;
      },
    });
  }

  back(): void {
    this.router.navigate(['/patient/hospitalizations']);
  }

  setTab(tab: string): void {
    this.activeTab = tab as ActiveTab;
  }

  roomBedLabel(): string {
    if (!this.detail) return '—';
    return [this.detail.room, this.detail.bed].filter(Boolean).join(' / ') || '—';
  }

  statusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  statusClass(status: string): string {
    return this.statusClasses[status] ?? 'bg-gray-100 text-gray-700';
  }

  hospitalDisplay(): string {
    if (!this.detail) return '—';
    return this.detail.hospitalName || this.detail.establishmentName || '—';
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatDateTime(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  journalTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Médicament':         '💊',
      'Surveillance/Contrôle': '📊',
      'Alimentation':       '🍽️',
      'Soin infirmier':     '🩺',
      'Autres':             '📝',
    };
    return icons[type] ?? '📝';
  }

  get journalSorted(): NursingJournalEntry[] {
    if (!this.detail?.nursingJournal) return [];
    return [...this.detail.nursingJournal].sort((a, b) => {
      const da = new Date(`${a.date}T${a.time}`).getTime();
      const db = new Date(`${b.date}T${b.time}`).getTime();
      return db - da;
    });
  }

  get priceDisplay(): string {
    if (!this.detail?.acceptedPrice) return '—';
    return Number(this.detail.acceptedPrice).toLocaleString('fr-FR') + ' FCFA';
  }
}
