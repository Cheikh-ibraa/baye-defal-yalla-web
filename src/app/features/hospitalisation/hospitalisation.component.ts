import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface HospitalizationApi {
  id: string;
  admissionRef: string;
  patientName: string;
  patientAge: number;
  service: string;
  room: string;
  bed: string;
  admissionDate: string;
  actualDischargeDate: string;
  recoveryPercent: number;
  status: 'ADMITTED' | 'IN_PROGRESS' | 'URGENT' | 'DISCHARGED';
}

interface PatientHospital {
  id: string;
  fullname: string;
  patientId: string;
  age: number;
  status: string;
  admission: string;
  chambre: string;
  service: string;
  duree: string;
  progress: number;
}

@Component({
  selector: 'app-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalisationComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = environment.baseUrl;

  loading = true;
  searchQuery = '';
  activeFilter = 'all';
  patients: PatientHospital[] = [];

  filters = [
    { id: 'all',        label: 'Tous' },
    { id: 'active',     label: 'En cours' },
    { id: 'urgent',     label: 'Urgents' },
    { id: 'discharged', label: 'Sortis' },
  ];

  ngOnInit(): void {
    this.loadHospitalizations();
  }

  private loadHospitalizations(): void {
    this.http.get<HospitalizationApi[]>(`${this.api}/hospital/hospitalizations`).subscribe({
      next: list => {
        this.patients = list.map(h => this.mapHospitalization(h));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapHospitalization(h: HospitalizationApi): PatientHospital {
    const statusMap: Record<string, string> = {
      ADMITTED:    'EN COURS',
      IN_PROGRESS: 'EN COURS',
      URGENT:      'URGENT',
      DISCHARGED:  'SORTI',
    };
    const admDate = new Date(h.admissionDate);
    const endDate = h.actualDischargeDate ? new Date(h.actualDischargeDate) : new Date();
    const days    = Math.max(1, Math.ceil((endDate.getTime() - admDate.getTime()) / 86_400_000));

    return {
      id:        h.id,
      fullname:  h.patientName ?? '—',
      patientId: h.admissionRef ?? h.id.slice(0, 8).toUpperCase(),
      age:       h.patientAge ?? 0,
      status:    statusMap[h.status] ?? h.status,
      admission: admDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      chambre:   h.room ?? h.bed ?? '—',
      service:   h.service ?? '—',
      duree:     days === 1 ? '1 Jour' : `${days} Jours`,
      progress:  h.recoveryPercent ?? 0,
    };
  }

  setFilter(filterId: string): void {
    this.activeFilter = filterId;
  }

  isFilterActive(filterId: string): boolean {
    return this.activeFilter === filterId;
  }

  get filteredPatients(): PatientHospital[] {
    const q = this.searchQuery.toLowerCase();
    return this.patients.filter(p => {
      const matchesSearch =
        !q ||
        p.fullname.toLowerCase().includes(q) ||
        p.service.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q);
      const matchesFilter =
        this.activeFilter === 'all' ||
        (this.activeFilter === 'active'     && p.status === 'EN COURS') ||
        (this.activeFilter === 'urgent'     && p.status === 'URGENT') ||
        (this.activeFilter === 'discharged' && p.status === 'SORTI');
      return matchesSearch && matchesFilter;
    });
  }

  statusBadgeClass(status: string): string {
    if (status === 'URGENT')   return 'bg-[#BA1A1A1A] text-[#BA1A1A]';
    if (status === 'EN COURS') return 'bg-[#F39C121A] text-[#E8920A]';
    if (status === 'SORTI')    return 'bg-[#00B8941A] text-[#00B894]';
    return 'bg-[#F1F5F9] text-[#64748B]';
  }

  isDischarged(patient: PatientHospital): boolean {
    return patient.status === 'SORTI';
  }

  getCleanId(patientId: string): string {
    return patientId;
  }

  openDossier(patient: PatientHospital, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/hospital/hospitalisations', patient.id]);
  }

}
