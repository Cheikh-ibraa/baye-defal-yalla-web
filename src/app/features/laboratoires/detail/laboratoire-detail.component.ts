import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './laboratoire-detail.component.html',
})
export class LaboratoireDetailComponent implements OnInit {
  loading        = true;
  loadError      = '';
  saving         = false;
  deleting       = false;
  addingTech     = false;

  laboratoireRow:  any   = null;
  technicianUsers: any[] = [];
  recentExamens:   any[] = [];

  initials    = '';
  displayName = '';
  isActive    = false;
  activeTab: 'examens' | 'performances' = 'examens';

  // Modal ajout technicien
  showAddModal     = false;
  addTechEmail     = '';
  addTechFirstName = '';
  addTechLastName  = '';
  addError         = '';

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
          this.recentExamens  = detail.recentExamens ?? [];
          this.applyRow();
        }
        this.loading = false;
        this.loadTechnicianList();
      });
  }

  private loadTechnicianList(): void {
    this.http.get<any[]>(`${this.api}/admin/laboratories/${this.laboratoireId}/technicians`)
      .pipe(catchError(() => of([])))
      .subscribe(list => {
        this.technicianUsers = Array.isArray(list) ? list : [];
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

  // ── Gestion des techniciens liés ─────────────────────────────────────────────

  openAddModal(): void {
    this.showAddModal     = true;
    this.addTechEmail     = '';
    this.addTechFirstName = '';
    this.addTechLastName  = '';
    this.addError         = '';
  }

  closeAddModal(): void { this.showAddModal = false; }

  confirmAddTechnician(): void {
    if (!this.addTechEmail.trim()) return;
    this.addingTech = true;
    this.addError   = '';
    const body: any = { email: this.addTechEmail.trim() };
    if (this.addTechFirstName.trim()) body.firstName = this.addTechFirstName.trim();
    if (this.addTechLastName.trim())  body.lastName  = this.addTechLastName.trim();

    this.http.post(
      `${this.api}/admin/laboratories/${this.laboratoireId}/technicians`,
      body,
    ).pipe(
      catchError(err => {
        this.addError   = err.error?.message ?? 'Technicien introuvable ou déjà lié.';
        this.addingTech = false;
        return of(null);
      }),
    ).subscribe(res => {
      if (res) {
        this.addingTech   = false;
        this.showAddModal = false;
        this.loadTechnicianList();
      }
    });
  }

  removeTechnician(tech: any): void {
    const name = this.getTechName(tech);
    if (!confirm(`Retirer ${name} de ce laboratoire ?`)) return;
    const tid = tech.keycloakId ?? tech.id;
    this.http.delete(`${this.api}/admin/laboratories/${this.laboratoireId}/technicians/${tid}`)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.technicianUsers = this.technicianUsers.filter(t => t !== tech);
      });
  }

  // ── Helpers technicien ───────────────────────────────────────────────────────

  getTechName(t: any): string {
    return `${t?.firstName ?? ''} ${t?.lastName ?? ''}`.trim() || t?.email || '—';
  }

  getTechEmail(t: any): string {
    return t?.email ?? '—';
  }

  getTechInitials(t: any): string {
    return ((t?.firstName?.[0] ?? '') + (t?.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  // ── Actions laboratoire ───────────────────────────────────────────────────────

  activerLaboratoire(): void {
    if (this.saving) return;
    const id = this.technicianUsers[0]?.keycloakId ?? this.laboratoireRow?.labTechnicianId;
    if (!id) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/laboratories/${id}/activate`, {}).subscribe({
      next:  () => { this.isActive = true;  this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  desactiverLaboratoire(): void {
    if (this.saving) return;
    const id = this.technicianUsers[0]?.keycloakId ?? this.laboratoireRow?.labTechnicianId;
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
    this.http.delete(`${this.api}/admin/laboratories/${this.laboratoireId}`).subscribe({
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

  get hasTechnician(): boolean {
    return this.technicianUsers.length > 0 || !!(this.laboratoireRow?.labTechnicianId);
  }

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
}
