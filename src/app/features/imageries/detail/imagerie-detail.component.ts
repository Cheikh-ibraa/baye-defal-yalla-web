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
  ACCEPTED:   'Accepté',
  COMPLETED:  'Terminé',
  CANCELLED:  'Annulé',
};
const EXAM_CLASS: Record<string, string> = {
  PENDING:    'text-yellow-600 bg-yellow-50',
  ACCEPTED:   'text-blue-600 bg-blue-50',
  COMPLETED:  'text-green-600 bg-green-50',
  CANCELLED:  'text-red-500 bg-red-50',
};

@Component({
  selector: 'app-imagerie-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagerie-detail.component.html',
})
export class ImagerieDetailComponent implements OnInit {
  loading       = true;
  loadError     = '';
  saving        = false;
  deleting      = false;
  addingRadio   = false;

  imagerieRow:      any   = null;
  radiologistUsers: any[] = [];
  recentExamens:    any[] = [];

  initials    = '';
  displayName = '';
  isActive    = false;
  activeTab: 'examens' | 'performances' = 'examens';

  // Modal ajout radiologue
  showAddModal    = false;
  addRadioEmail   = '';
  addRadioFirst   = '';
  addRadioLast    = '';
  addError        = '';

  private imagerieId   = '';
  private readonly api = environment.baseUrl;

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
  ) {}

  ngOnInit(): void {
    this.imagerieId = this.route.snapshot.paramMap.get('id') ?? '';

    const nav   = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;
    if (state?.imagerieRow) {
      this.imagerieRow = state.imagerieRow;
      this.applyRow();
    }

    this.load();
  }

  private load(): void {
    this.loading = true;

    this.http.get<any>(`${this.api}/admin/imaging-centers/detail/${this.imagerieId}`)
      .pipe(catchError(() => of(null)))
      .subscribe(detail => {
        if (detail) {
          this.imagerieRow   = { ...this.imagerieRow, ...detail.imagingCenter, ...detail.stats };
          this.recentExamens = detail.recentExamens ?? [];
          this.applyRow();
        }
        this.loading = false;
        this.loadRadiologistList();
      });
  }

  private loadRadiologistList(): void {
    this.http.get<any[]>(`${this.api}/admin/imaging-centers/${this.imagerieId}/radiologists`)
      .pipe(catchError(() => of([])))
      .subscribe(list => {
        this.radiologistUsers = Array.isArray(list) ? list : [];
      });
  }

  private applyRow(): void {
    const r = this.imagerieRow;
    if (!r) return;
    const name = r.name ?? r.imagerieName ?? '';
    const words = name.trim().split(/\s+/);
    this.initials    = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
    this.displayName = name;
    this.isActive    = r.isActive ?? r.isOpen ?? false;
  }

  // ── Gestion des radiologues liés ─────────────────────────────────────────────

  openAddModal(): void {
    this.showAddModal  = true;
    this.addRadioEmail = '';
    this.addRadioFirst = '';
    this.addRadioLast  = '';
    this.addError      = '';
  }

  closeAddModal(): void { this.showAddModal = false; }

  confirmAddRadiologist(): void {
    if (!this.addRadioEmail.trim()) return;
    this.addingRadio = true;
    this.addError    = '';
    const body: any  = { email: this.addRadioEmail.trim() };
    if (this.addRadioFirst.trim()) body.firstName = this.addRadioFirst.trim();
    if (this.addRadioLast.trim())  body.lastName  = this.addRadioLast.trim();

    this.http.post(
      `${this.api}/admin/imaging-centers/${this.imagerieId}/radiologists`,
      body,
    ).pipe(
      catchError(err => {
        this.addError    = err.error?.message ?? 'Radiologue introuvable ou déjà lié.';
        this.addingRadio = false;
        return of(null);
      }),
    ).subscribe(res => {
      if (res) {
        this.addingRadio  = false;
        this.showAddModal = false;
        this.loadRadiologistList();
      }
    });
  }

  removeRadiologist(radio: any): void {
    const name = this.getRadioName(radio);
    if (!confirm(`Retirer ${name} de ce centre d'imagerie ?`)) return;
    const rid = radio.keycloakId ?? radio.id;
    this.http.delete(`${this.api}/admin/imaging-centers/${this.imagerieId}/radiologists/${rid}`)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.radiologistUsers = this.radiologistUsers.filter(r => r !== radio);
      });
  }

  // ── Helpers radiologue ───────────────────────────────────────────────────────

  getRadioName(r: any): string {
    return `${r?.firstName ?? ''} ${r?.lastName ?? ''}`.trim() || r?.email || '—';
  }

  getRadioEmail(r: any): string { return r?.email ?? '—'; }

  getRadioInitials(r: any): string {
    return ((r?.firstName?.[0] ?? '') + (r?.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  // ── Actions centre ────────────────────────────────────────────────────────────

  activerImagerie(): void {
    if (this.saving) return;
    const id = this.radiologistUsers[0]?.keycloakId ?? this.imagerieRow?.radiologistId;
    if (!id) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/imaging-centers/${id}/activate`, {}).subscribe({
      next:  () => { this.isActive = true;  this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  desactiverImagerie(): void {
    if (this.saving) return;
    const id = this.radiologistUsers[0]?.keycloakId ?? this.imagerieRow?.radiologistId;
    if (!id) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/users/${id}/deactivate`, {}).subscribe({
      next:  () => { this.isActive = false; this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  supprimerImagerie(): void {
    if (!confirm(`Supprimer définitivement "${this.displayName}" ?`)) return;
    this.deleting = true;
    this.http.delete(`${this.api}/admin/imaging-centers/${this.imagerieId}`).subscribe({
      next:  () => this.router.navigate(['/admin/imageries']),
      error: () => { this.deleting = false; },
    });
  }

  goBack(): void { this.router.navigate(['/admin/imageries']); }

  examLabel(status: string): string { return EXAM_LABEL[status] ?? status; }
  examClass(status: string): string { return EXAM_CLASS[status] ?? 'text-gray-500 bg-gray-100'; }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  get imagerieRef(): string { return (this.imagerieId ?? '').substring(0, 4).toUpperCase(); }

  get hasRadiologist(): boolean {
    return this.radiologistUsers.length > 0 || !!(this.imagerieRow?.radiologistId);
  }

  get stats() {
    return {
      total:         this.imagerieRow?.total          ?? this.imagerieRow?.examensTraites ?? 0,
      completed:     this.imagerieRow?.completed       ?? this.imagerieRow?.examensTraites ?? 0,
      pending:       this.imagerieRow?.pending         ?? 0,
      cancelled:     this.imagerieRow?.cancelled       ?? 0,
      disponibilite: this.imagerieRow?.disponibilite   ?? 0,
      delaiMoyen:    this.imagerieRow?.delaiMoyen      ?? 0,
    };
  }

  get disponibiliteClass(): string {
    const d = this.stats.disponibilite;
    return d >= 90 ? 'text-green-600' : d >= 70 ? 'text-yellow-600' : 'text-red-500';
  }
}
