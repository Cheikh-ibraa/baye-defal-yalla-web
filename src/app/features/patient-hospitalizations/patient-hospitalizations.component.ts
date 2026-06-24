import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface PatientHospitalization {
  id: string;
  establishmentName: string;
  hospitalName: string;
  department: string;
  motif: string;
  admissionDate: string;
  expectedDischargeDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'FUNDED' | 'ADMITTED' | 'DISCHARGED' | 'REJECTED';
  priority: 'Normal' | 'Urgent';
  referentDoctorName: string;
  room: string;
  bed: string;
}

@Component({
  selector: 'app-patient-hospitalizations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-hospitalizations.component.html',
})
export class PatientHospitalizationsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.baseUrl;

  hospitalizations: PatientHospitalization[] = [];
  loading = true;
  error = false;

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
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.http.get<PatientHospitalization[]>(`${this.api}/patient/hospitalizations`).subscribe({
      next: data => {
        this.hospitalizations = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  goToDetail(id: string): void {
    this.router.navigate(['/patient/hospitalizations', id]);
  }

  statusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  statusClass(status: string): string {
    return this.statusClasses[status] ?? 'bg-gray-100 text-gray-700';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  hospitalDisplay(h: PatientHospitalization): string {
    return h.hospitalName || h.establishmentName || '—';
  }
}
