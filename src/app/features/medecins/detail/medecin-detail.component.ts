import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface PrescriptionRow {
  id: string;
  reference: string;
  date: string;
  patientName: string;
  pharmacyName: string;
  status: string;
  statusClass: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT:                  'Brouillon',
  SENT_TO_PATIENT:        'Transmise',
  SUBMITTED_FOR_DONATION: 'Soumise',
  FULLY_FUNDED:           'Financée',
  QR_GENERATED:           'QR généré',
  IN_PROGRESS:            'En cours',
  DELIVERED:              'Validée',
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT:                  'text-gray-500 bg-gray-100',
  SENT_TO_PATIENT:        'text-blue-600 bg-blue-50',
  SUBMITTED_FOR_DONATION: 'text-purple-600 bg-purple-50',
  FULLY_FUNDED:           'text-indigo-600 bg-indigo-50',
  QR_GENERATED:           'text-yellow-600 bg-yellow-50',
  IN_PROGRESS:            'text-orange-500 bg-orange-50',
  DELIVERED:              'text-green-600 bg-green-50',
};

@Component({
  selector: 'app-medecin-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medecin-detail.component.html',
})
export class MedecinDetailComponent implements OnInit {
  loading = true;
  loadError = '';
  saving = false;
  deleting = false;
  activeTab: 'ordonnances' | 'transactions' | 'documents' = 'ordonnances';

  doctor: any = null;
  initials = '';
  displayName = '';
  isActive = false;

  stats = { total: 0, pending: 0, validated: 0 };
  prescriptions: PrescriptionRow[] = [];

  private readonly api = environment.baseUrl;
  private keycloakId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.keycloakId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.loadError = '';

    forkJoin({
      doctor:        this.http.get<any>(`${this.api}/admin/doctors/${this.keycloakId}`),
      prescriptions: this.http.get<any[]>(`${this.api}/admin/doctors/${this.keycloakId}/prescriptions`)
                         .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ doctor, prescriptions }) => {
        this.applyDoctor(doctor);
        this.applyPrescriptions(prescriptions ?? []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Impossible de charger les données du médecin.';
      },
    });
  }

  private applyDoctor(doctor: any): void {
    this.doctor = doctor;
    const first = doctor.user?.firstName ?? '';
    const last  = doctor.user?.lastName  ?? '';
    this.displayName = `Dr. ${first} ${last}`.trim();
    this.isActive    = doctor.user?.isActive ?? false;
    const words = `${first} ${last}`.trim().split(/\s+/);
    this.initials = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : this.displayName.substring(0, 2).toUpperCase();
  }

  private applyPrescriptions(rows: any[]): void {
    this.prescriptions = rows.map(p => this.mapRow(p));

    const total     = rows.length;
    const pending   = rows.filter(p => ['DRAFT', 'SENT_TO_PATIENT'].includes(p.status)).length;
    const validated = rows.filter(p => ['DELIVERED', 'IN_PROGRESS', 'FULLY_FUNDED', 'QR_GENERATED'].includes(p.status)).length;
    this.stats = { total, pending, validated };
  }

  private mapRow(p: any): PrescriptionRow {
    const dt = p.createdAt ? new Date(p.createdAt) : null;
    const date = dt
      ? dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '—';

    return {
      id:           p.id,
      reference:    p.reference ?? `ORD-${p.id?.substring(0, 7).toUpperCase()}`,
      date,
      patientName:  p.patientName  ?? '—',
      pharmacyName: p.pharmacyName ?? '—',
      status:       STATUS_LABEL[p.status] ?? p.status,
      statusClass:  STATUS_CLASS[p.status] ?? 'text-gray-500 bg-gray-100',
    };
  }

  goBack(): void {
    this.router.navigate(['/admin/medecins']);
  }

  activerMedecin(): void {
    if (this.saving) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/doctors/${this.keycloakId}/activate`, {}).subscribe({
      next: () => { this.isActive = true; this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  desactiverMedecin(): void {
    if (this.saving) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/users/${this.keycloakId}/deactivate`, {}).subscribe({
      next: () => { this.isActive = false; this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  supprimerMedecin(): void {
    if (!confirm(`Supprimer définitivement ${this.displayName} ?`)) return;
    this.deleting = true;
    this.http.delete(`${this.api}/admin/doctors/${this.keycloakId}`).subscribe({
      next: () => this.router.navigate(['/admin/medecins']),
      error: () => { this.deleting = false; },
    });
  }

  get registrationDate(): string {
    const d = this.doctor?.user?.createdAt;
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get doctorNumber(): string {
    const id = this.keycloakId ?? '';
    return id.substring(0, 4).toUpperCase();
  }
}
