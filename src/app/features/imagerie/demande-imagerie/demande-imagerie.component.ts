import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

type Priority = 'URGENT' | 'ROUTINE' | 'PRIORITAIRE';

interface DemandeRow {
  id:          string;
  status:      string;
  priority:    Priority;
  timeAgo:     string;
  title:       string;
  description: string;
  patientName: string;
  patientRef:  string;
  doctorName:  string;
  examTypes:   string[];
}

interface AccepterForm { montant: number | null; date: string; heure: string; note: string; }

@Component({
  selector: 'app-demande-imagerie',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './demande-imagerie.component.html',
  styleUrl: './demande-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeImagerieComponent implements OnInit {

  private readonly api = environment.baseUrl;

  loading  = true;
  isSaving = false;

  demandes:       DemandeRow[] = [];
  pendingCount    = 0;
  acceptedCount   = 0;
  completedCount  = 0;

  showAccepterModal = false;
  showSuccessModal  = false;
  selectedDemande: DemandeRow | null = null;
  form: AccepterForm = { montant: null, date: '', heure: '', note: '' };

  constructor(
    private http:   HttpClient,
    private cdr:    ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void { this.loadDemandes(); }

  // ── Load ────────────────────────────────────────────────────────────────────
  loadDemandes(): void {
    this.loading = true;
    this.http.get<any>(`${this.api}/diagnostic/imaging-orders/all`, { params: { page: '1', limit: '100' } })
      .pipe(catchError(() => of({ data: [] })))
      .subscribe(res => {
        const orders = Array.isArray(res) ? res : (res?.data ?? []);
        this.resolveNames(orders);
      });
  }

  private resolveNames(orders: any[]): void {
    const ids = [...new Set([
      ...orders.map(o => o.patientId).filter(Boolean),
      ...orders.map(o => o.doctorId).filter(Boolean),
    ])] as string[];

    if (!ids.length) { this.build(orders, {}); return; }

    this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
      `${this.api}/users/names?ids=${ids.join(',')}`
    ).pipe(catchError(() => of([]))).subscribe(names => {
      const m: Record<string, string> = {};
      for (const n of names) m[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
      this.build(orders, m);
    });
  }

  private build(orders: any[], names: Record<string, string>): void {
    const PRI_MAP: Record<string, Priority> = {
      URGENT:      'URGENT',
      PRIORITY:    'PRIORITAIRE',
      PRIORITAIRE: 'PRIORITAIRE',
      NORMAL:      'ROUTINE',
      ROUTINE:     'ROUTINE',
    };

    const rows: DemandeRow[] = orders.map(o => {
      const pName    = names[o.patientId] || `Patient ${(o.patientId ?? '').slice(-6).toUpperCase()}`;
      const dName    = names[o.doctorId]  ? `Dr. ${names[o.doctorId]}` : 'Médecin prescripteur';
      const cats     = (o.examTypes ?? o.categories ?? []) as string[];
      const regions  = (o.bodyRegions ?? []) as string[];
      const title    = [...cats, ...regions].join(', ') || (o.type ?? 'Examen d\'imagerie');
      const desc     = o.clinicalContext ?? o.notes ?? 'Aucun contexte clinique disponible.';

      return {
        id:          o.id as string,
        status:      o.status as string,
        priority:    PRI_MAP[o.urgency] ?? 'ROUTINE',
        timeAgo:     this.timeAgo(o.createdAt),
        title,
        description: desc,
        patientName: pName,
        patientRef:  o.imagingOrderRef ?? '—',
        doctorName:  dName,
        examTypes:   cats,
      };
    });

    this.pendingCount   = rows.filter(r => r.status === 'PENDING').length;
    this.acceptedCount  = rows.filter(r => ['ACCEPTED', 'FUNDED', 'IN_PROGRESS'].includes(r.status)).length;
    this.completedCount = rows.filter(r => r.status === 'COMPLETED').length;
    this.demandes       = rows.filter(r => r.status === 'PENDING');
    this.loading        = false;
    this.cdr.markForCheck();
  }

  private timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60)  return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24)  return `il y a ${hrs}h`;
    return `il y a ${Math.floor(hrs / 24)} j`;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getSelectedInitials(): string {
    const name = this.selectedDemande?.patientName ?? '?';
    return name.split(' ').filter(w => w).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  getPriorityClass(p: Priority): string {
    switch (p) {
      case 'URGENT':      return 'bg-red-100 text-red-600';
      case 'PRIORITAIRE': return 'bg-blue-100 text-blue-700';
      case 'ROUTINE':     return 'bg-gray-100 text-gray-600';
    }
  }

  getPriorityLabel(p: Priority): string {
    switch (p) {
      case 'URGENT':      return 'Urgent';
      case 'PRIORITAIRE': return 'Prioritaire';
      case 'ROUTINE':     return 'Routine';
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  accepter(demande: DemandeRow): void {
    this.selectedDemande = demande;
    this.form = { montant: 25000, date: '', heure: '', note: 'Résultats disponibles sous 24h' };
    this.showAccepterModal = true;
    this.cdr.markForCheck();
  }

  fermerModal(): void {
    this.showAccepterModal = false;
    this.selectedDemande   = null;
    this.cdr.markForCheck();
  }

  confirmerAcceptation(): void {
    if (!this.selectedDemande || !this.form.montant || !this.form.date || !this.form.heure) return;

    const appointmentDate = new Date(`${this.form.date}T${this.form.heure}:00`).toISOString();
    this.isSaving = true;
    this.cdr.markForCheck();

    this.http.patch(
      `${this.api}/diagnostic/imaging-orders/${this.selectedDemande.id}/accept`,
      { price: this.form.montant, appointmentDate, note: this.form.note }
    ).pipe(
      finalize(() => { this.isSaving = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => {
        const id = this.selectedDemande!.id;
        this.showAccepterModal = false;
        this.showSuccessModal  = true;
        this.demandes          = this.demandes.filter(d => d.id !== id);
        this.pendingCount      = Math.max(0, this.pendingCount - 1);
        this.acceptedCount++;
        this.selectedDemande   = null;
        this.cdr.markForCheck();
        setTimeout(() => { this.showSuccessModal = false; this.cdr.markForCheck(); }, 2500);
      },
      error: err => {
        const msg = err?.error?.message ?? 'Erreur lors de l\'acceptation';
        console.error(msg);
      }
    });
  }

  voirDetails(demande: DemandeRow): void {
    this.router.navigate(['/imaging/demandes', demande.id]);
  }
}
