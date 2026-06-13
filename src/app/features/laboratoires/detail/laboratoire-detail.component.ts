import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const EXAM_LABEL: Record<string, string> = {
  PENDING:    'En attente',
  IN_PROCESS: 'En cours',
  COMPLETED:  'Terminé',
  CANCELLED:  'Annulé',
};
const EXAM_CLASS: Record<string, string> = {
  PENDING:    'text-yellow-600 bg-yellow-50',
  IN_PROCESS: 'text-blue-600 bg-blue-50',
  COMPLETED:  'text-green-600 bg-green-50',
  CANCELLED:  'text-red-500 bg-red-50',
};

@Component({
  selector: 'app-laboratoire-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './laboratoire-detail.component.html',
})
export class LaboratoireDetailComponent implements OnInit {
  loading   = true;
  loadError = '';
  saving    = false;
  deleting  = false;

  laboratoireRow: any = null;
  technicianUser: any = null;
  recentExamens:  any[] = [];

  initials    = '';
  displayName = '';
  isActive    = false;
  activeTab: 'examens' | 'performances' = 'examens';

  private laboratoireId = '';
  private readonly api  = environment.baseUrl;

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
  ) {}

  ngOnInit(): void {
    this.laboratoireId = this.route.snapshot.paramMap.get('id') ?? '';

    const nav   = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;
    if (state?.laboratoireRow) {
      this.laboratoireRow = state.laboratoireRow;
      this.applyRow();
    }

    this.load();
  }

  private load(): void {
    this.loading = true;

    this.http.get<any>(`${this.api}/admin/laboratories/detail/${this.laboratoireId}`)
      .pipe(catchError(() => of(null)))
      .subscribe(detail => {
        if (detail) {
          this.laboratoireRow = { ...this.laboratoireRow, ...detail.laboratory, ...detail.stats };
          this.recentExamens  = detail.recentExamens  ?? [];
          this.technicianUser = detail.technicianUser ?? null;
          this.applyRow();
          this.loading = false;
        } else {
          this.loadFallback();
        }
      });
  }

  private loadFallback(): void {
    const techId = this.laboratoireRow?.labTechnicianId;
    if (!techId) { this.loading = false; return; }

    this.http.get<any>(`${this.api}/admin/laboratories/${techId}`)
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        if (data) {
          this.technicianUser = data;
          this.isActive = data.user?.isActive ?? this.isActive;
        }
        this.loading = false;
      });
  }

  private applyRow(): void {
    const r = this.laboratoireRow;
    if (!r) return;
    const name = r.name ?? r.laboratoireName ?? '';
    const words = name.trim().split(/\s+/);
    this.initials    = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
    this.displayName = name;
    this.isActive    = r.isActive ?? r.isOpen ?? false;
  }

  activerLaboratoire(): void {
    if (this.saving) return;
    const id = this.technicianUser?.keycloakId ?? this.laboratoireRow?.labTechnicianId;
    if (!id) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/laboratories/${id}/activate`, {}).subscribe({
      next:  () => { this.isActive = true; this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  desactiverLaboratoire(): void {
    if (this.saving) return;
    const id = this.technicianUser?.keycloakId ?? this.laboratoireRow?.labTechnicianId;
    if (!id) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/users/${id}/deactivate`, {}).subscribe({
      next:  () => { this.isActive = false; this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  supprimerLaboratoire(): void {
    if (!confirm(`Supprimer définitivement "${this.displayName}" ?`)) return;
    this.deleting = true;
    const id = this.technicianUser?.keycloakId ?? this.laboratoireRow?.labTechnicianId ?? this.laboratoireId;
    this.http.delete(`${this.api}/admin/laboratories/${id}`).subscribe({
      next:  () => this.router.navigate(['/admin/laboratoires']),
      error: () => { this.deleting = false; },
    });
  }

  goBack(): void { this.router.navigate(['/admin/laboratoires']); }

  examLabel(status: string): string { return EXAM_LABEL[status] ?? status; }
  examClass(status: string): string { return EXAM_CLASS[status] ?? 'text-gray-500 bg-gray-100'; }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  get laboratoireRef(): string { return (this.laboratoireId ?? '').substring(0, 4).toUpperCase(); }

  get stats() {
    return {
      total:         this.laboratoireRow?.total          ?? this.laboratoireRow?.analysesTraitees ?? 0,
      completed:     this.laboratoireRow?.completed       ?? this.laboratoireRow?.analysesTraitees ?? 0,
      pending:       this.laboratoireRow?.pending         ?? 0,
      cancelled:     this.laboratoireRow?.cancelled       ?? 0,
      disponibilite: this.laboratoireRow?.disponibilite   ?? 0,
      delaiMoyen:    this.laboratoireRow?.delaiMoyen      ?? 0,
    };
  }

  get disponibiliteClass(): string {
    const d = this.stats.disponibilite;
    return d >= 90 ? 'text-green-600' : d >= 70 ? 'text-yellow-600' : 'text-red-500';
  }

  get technicianName(): string {
    const u = this.technicianUser?.user ?? this.technicianUser;
    if (!u) return '—';
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '—';
  }

  get technicianEmail(): string {
    return this.technicianUser?.user?.email ?? this.technicianUser?.email ?? '—';
  }

  get hasTechnician(): boolean {
    return !!(this.laboratoireRow?.labTechnicianId || this.technicianUser);
  }
}
