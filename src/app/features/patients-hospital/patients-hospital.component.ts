import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface StatCard {
  label: string;
  value: string;
  icon: 'patients' | 'critical' | 'discharged' | 'calendar';
  toneClass: string;
}

interface PatientFilter {
  label: string;
  careStatus?: string;
  isActive: boolean;
}

interface HospitalPatient {
  id: string;
  patientRef: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  address: string;
  currentService: string;
  lastActivity: string;
  careStatus: 'IN_TREATMENT' | 'URGENT' | 'FOLLOW_UP' | 'TERMINATED';
}

@Component({
  selector: 'app-patients-hospital',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients-hospital.component.html',
  styleUrls: ['./patients-hospital.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsHospitalComponent implements OnInit {
  readonly periodLabel = 'Ce-mois';
  private readonly api = environment.baseUrl;

  stats: StatCard[] = [
    { label: 'Total patients',  value: '—', icon: 'patients',   toneClass: 'bg-[#EAF2FF] text-[#2563EB]' },
    { label: 'Cas urgents',     value: '—', icon: 'critical',   toneClass: 'bg-[#FFF3E8] text-[#F97316]' },
    { label: 'Sorties du jour', value: '—', icon: 'discharged', toneClass: 'bg-[#EAF8F1] text-[#2FA373]' },
    { label: 'Rendez-vous',     value: '—', icon: 'calendar',   toneClass: 'bg-[#F3EDFF] text-[#7C3AED]' },
  ];

  filters: PatientFilter[] = [
    { label: 'Tous',          careStatus: undefined,       isActive: true  },
    { label: 'En traitement', careStatus: 'IN_TREATMENT',  isActive: false },
    { label: 'Urgents',       careStatus: 'URGENT',        isActive: false },
    { label: 'Terminés',      careStatus: 'TERMINATED',    isActive: false },
    { label: 'Suivi',         careStatus: 'FOLLOW_UP',     isActive: false },
  ];

  patients: HospitalPatient[] = [];
  search = '';
  loading = false;

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadPatients();
  }

  private loadStats() {
    this.http.get<any>(`${this.api}/hospital/patients/stats`).subscribe({
      next: d => {
        this.stats[0].value = (d.totalPatients   ?? 0).toLocaleString('fr-FR');
        this.stats[1].value = (d.urgentCases      ?? 0).toString();
        this.stats[2].value = (d.dischargesToday  ?? 0).toString();
        this.stats[3].value = (d.appointmentsToday ?? 0).toString();
        this.cdr.markForCheck();
      },
    });
  }

  loadPatients() {
    this.loading = true;
    const active = this.filters.find(f => f.isActive);
    const params: string[] = [];
    if (active?.careStatus)     params.push(`careStatus=${active.careStatus}`);
    if (this.search.trim())     params.push(`search=${encodeURIComponent(this.search.trim())}`);
    const qs = params.length ? '?' + params.join('&') : '';

    this.http.get<HospitalPatient[]>(`${this.api}/hospital/patients${qs}`).subscribe({
      next: data => {
        this.patients = data;
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  selectFilter(filter: PatientFilter) {
    this.filters.forEach(f => (f.isActive = false));
    filter.isActive = true;
    this.loadPatients();
  }

  onSearch() {
    this.loadPatients();
  }

  fullName(p: HospitalPatient) {
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      IN_TREATMENT: 'EN TRAITEMENT',
      URGENT:       'URGENT',
      FOLLOW_UP:    'SUIVI',
      TERMINATED:   'TERMINÉ',
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      IN_TREATMENT: 'bg-[#FDEFD9] text-[#BC7A1F]',
      URGENT:       'bg-[#FBE5DF] text-[#CB5A37]',
      FOLLOW_UP:    'bg-[#E5ECFF] text-[#2557D8]',
      TERMINATED:   'bg-[#E5F4E9] text-[#2A7F45]',
    };
    return map[s] ?? 'bg-[#F1F4F9] text-[#6B7280]';
  }

  openPatient(id: string) {
    this.router.navigate(['/hospital/patients', id]);
  }
}
