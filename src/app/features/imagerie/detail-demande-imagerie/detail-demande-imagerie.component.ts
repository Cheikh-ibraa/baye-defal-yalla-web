import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

type Priority = 'URGENT' | 'ROUTINE' | 'PRIORITAIRE';

interface Examen {
  id: number;
  titre: string;
  sousTitre: string;
  icon: 'irm' | 'scanner' | 'echo' | 'radio';
}

interface DetailDemande {
  id: string;
  priority: Priority;
  patient: { nom: string; genre: string; age: number | null; ref: string };
  medecin: { nom: string; specialite: string; clinique: string };
  contexteMedical: string;
  examens: Examen[];
}

interface AccepterForm { montant: number | null; date: string; heure: string; note: string; }

@Component({
  selector: 'app-detail-demande-imagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-demande-imagerie.component.html',
  styleUrl: './detail-demande-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDemandeImagerieComponent implements OnInit {

  private readonly api = environment.baseUrl;

  detail:   DetailDemande | null = null;
  loading   = true;
  isSaving  = false;
  isRejecting = false;

  showAccepterModal = false;
  showSuccessModal  = false;
  form: AccepterForm = { montant: null, date: '', heure: '', note: '' };

  constructor(
    private route:    ActivatedRoute,
    private router:   Router,
    private location: Location,
    private cdr:      ChangeDetectorRef,
    private http:     HttpClient,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<any>(`${this.api}/diagnostic/imaging-orders/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe(order => {
        if (!order) { this.loading = false; this.cdr.markForCheck(); return; }
        const ids = [order.patientId, order.doctorId].filter(Boolean) as string[];
        if (!ids.length) { this.buildDetail(order, {}); return; }
        this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
          `${this.api}/users/names?ids=${ids.join(',')}`
        ).pipe(catchError(() => of([]))).subscribe(names => {
          const m: Record<string, string> = {};
          for (const n of names) m[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
          this.buildDetail(order, m);
        });
      });
  }

  private buildDetail(o: any, names: Record<string, string>): void {
    const PRI_MAP: Record<string, Priority> = {
      URGENT: 'URGENT', PRIORITY: 'PRIORITAIRE', PRIORITAIRE: 'PRIORITAIRE',
      NORMAL: 'ROUTINE', ROUTINE: 'ROUTINE',
    };
    const pName  = names[o.patientId] || `Patient ${(o.patientId ?? '').slice(-6).toUpperCase()}`;
    const dName  = names[o.doctorId]  ? `Dr. ${names[o.doctorId]}` : 'Médecin prescripteur';
    const cats   = (o.examTypes   ?? []) as string[];
    const regions = (o.bodyRegions ?? []) as string[];

    const iconFor = (t: string): 'irm' | 'scanner' | 'echo' | 'radio' => {
      const u = t.toUpperCase();
      if (u.includes('IRM') || u.includes('MRI'))              return 'irm';
      if (u.includes('SCANNER') || u.includes('CT') || u.includes('TDM')) return 'scanner';
      if (u.includes('ECHO') || u.includes('ÉCHOGRAPHIE'))     return 'echo';
      return 'radio';
    };

    let examens: Examen[] = cats.map((c, i) => ({
      id: i + 1, titre: c,
      sousTitre: regions[i] ? `${regions[i]}` : 'Standard',
      icon: iconFor(c),
    }));

    if (!examens.length && regions.length) {
      examens = regions.map((r, i) => ({ id: i + 1, titre: r, sousTitre: 'Standard', icon: 'radio' as const }));
    }
    if (!examens.length) {
      examens = [{ id: 1, titre: o.type ?? 'Examen d\'imagerie', sousTitre: 'Standard', icon: 'radio' }];
    }

    this.detail = {
      id:       o.id,
      priority: PRI_MAP[o.urgency] ?? 'ROUTINE',
      patient: {
        nom:   pName,
        genre: '—',
        age:   null,
        ref:   o.imagingOrderRef ?? o.id,
      },
      medecin: {
        nom:       dName,
        specialite: 'Médecin',
        clinique:  '—',
      },
      contexteMedical: o.clinicalContext ?? o.notes ?? 'Aucun contexte clinique fourni.',
      examens,
    };
    this.loading = false;
    this.cdr.markForCheck();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  goBack(): void { this.location.back(); }

  // ── Priorité ───────────────────────────────────────────────────────────────
  getPriorityClass(p: Priority): string {
    switch (p) {
      case 'URGENT':      return 'bg-red-100 text-red-600';
      case 'PRIORITAIRE': return 'bg-blue-100 text-[#104382]';
      case 'ROUTINE':     return 'bg-gray-100 text-gray-600';
    }
  }

  // ── Modal accepter ─────────────────────────────────────────────────────────
  ouvrirAccepter(): void {
    this.form = { montant: 25000, date: '', heure: '', note: 'Résultats disponibles sous 24h' };
    this.showAccepterModal = true;
    this.cdr.markForCheck();
  }

  fermerModal(): void {
    this.showAccepterModal = false;
    this.cdr.markForCheck();
  }

  confirmerAcceptation(): void {
    if (!this.detail || !this.form.montant || !this.form.date || !this.form.heure) return;

    const appointmentDate = new Date(`${this.form.date}T${this.form.heure}:00`).toISOString();
    this.isSaving = true;
    this.cdr.markForCheck();

    this.http.patch(
      `${this.api}/diagnostic/imaging-orders/${this.detail.id}/accept`,
      { price: this.form.montant, appointmentDate, note: this.form.note }
    ).pipe(finalize(() => { this.isSaving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.showAccepterModal = false;
          this.showSuccessModal  = true;
          this.cdr.markForCheck();
          setTimeout(() => { this.router.navigate(['/imaging/demandes']); }, 2000);
        },
        error: err => {
          console.error(err?.error?.message ?? 'Erreur lors de l\'acceptation');
        }
      });
  }

  // ── Refuser ────────────────────────────────────────────────────────────────
  refuser(): void {
    if (!this.detail) return;
    this.isRejecting = true;
    this.cdr.markForCheck();
    this.http.patch(
      `${this.api}/diagnostic/imaging-orders/${this.detail.id}/reject`, {}
    ).pipe(
      catchError(() => of(null)),
      finalize(() => { this.isRejecting = false; this.cdr.markForCheck(); })
    ).subscribe(() => this.router.navigate(['/imaging/demandes']));
  }

  getPatientInitiales(): string {
    if (!this.detail) return '?';
    return this.detail.patient.nom
      .split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('').slice(0, 2);
  }
}
