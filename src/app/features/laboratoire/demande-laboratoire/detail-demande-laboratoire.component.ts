import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type Priority = 'URGENT' | 'ROUTINE' | 'PRIORITAIRE';

interface Analyse {
  id:       number;
  titre:    string;
  sousTitre: string;
  icon: 'nfs' | 'glycemie' | 'creatinine' | 'hba1c' | 'lipides' | 'hepatique';
}

interface DetailDemande {
  id:       string;
  priority: Priority;
  patient:  { nom: string; genre: string; age: number; ref: string };
  medecin:  { nom: string; specialite: string; clinique: string };
  contexteMedical: string;
  examens:  Analyse[];
}

interface AccepterForm { montant: number | null; date: string; heure: string; note: string; }

const PRIORITY_MAP: Record<string, Priority> = {
  URGENT:   'URGENT',
  PRIORITY: 'PRIORITAIRE',
  NORMAL:   'ROUTINE',
};

@Component({
  selector: 'app-detail-demande-laboratoire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-demande-laboratoire.component.html',
  styleUrl: './detail-demande-laboratoire.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDemandeLaboratoireComponent implements OnInit {

  private http     = inject(HttpClient);
  private cdr      = inject(ChangeDetectorRef);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private location = inject(Location);
  private api      = environment.baseUrl;

  detail:  DetailDemande | null = null;
  loading  = true;

  showAccepterModal = false;
  showSuccessModal  = false;
  form: AccepterForm = { montant: null, date: '', heure: '', note: '' };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.http.get<any>(`${this.api}/diagnostic/lab-orders/${id}`).subscribe({
      next:  (order) => this.resolveNames(order),
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  private resolveNames(order: any): void {
    const ids = [order.patientId, order.doctorId].filter(Boolean);

    if (!ids.length) { this.build(order, {}); return; }

    this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
      `${this.api}/users/names?ids=${ids.join(',')}`
    ).subscribe({
      next:  (names) => {
        const m: Record<string, string> = {};
        for (const n of names) m[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
        this.build(order, m);
      },
      error: () => this.build(order, {}),
    });
  }

  private build(order: any, names: Record<string, string>): void {
    const pName = names[order.patientId] || `Patient ${(order.patientId ?? '').slice(-6).toUpperCase()}`;
    const dName = names[order.doctorId] ? `Dr. ${names[order.doctorId]}` : 'Médecin';
    const cats  = (order.categories ?? []) as string[];

    this.detail = {
      id:       order.id,
      priority: PRIORITY_MAP[order.urgency] ?? 'ROUTINE',
      patient: {
        nom:   pName,
        genre: '—',
        age:   0,
        ref:   order.labOrderRef ?? '—',
      },
      medecin: {
        nom:        dName,
        specialite: '—',
        clinique:   '—',
      },
      contexteMedical: order.clinicalIndication
        ? `"${order.clinicalIndication}"`
        : '"Aucune indication clinique précisée."',
      examens: cats.map((cat, i) => ({
        id:        i + 1,
        titre:     cat,
        sousTitre: 'Analyse biologique',
        icon:      this.iconForCategory(cat),
      })),
    };
    this.loading = false;
    this.cdr.markForCheck();
  }

  private iconForCategory(cat: string): Analyse['icon'] {
    const c = cat.toLowerCase();
    if (c.includes('hémat') || c.includes('nfs') || c.includes('sang')) return 'nfs';
    if (c.includes('glyc') || c.includes('diab'))                        return 'glycemie';
    if (c.includes('rén') || c.includes('créat') || c.includes('uro'))  return 'creatinine';
    if (c.includes('hba') || c.includes('hémog'))                        return 'hba1c';
    if (c.includes('lipid') || c.includes('chol'))                       return 'lipides';
    if (c.includes('hépa') || c.includes('foie'))                        return 'hepatique';
    return 'nfs';
  }

  goBack(): void { this.location.back(); }

  getPriorityClass(p: Priority): string {
    switch (p) {
      case 'URGENT':      return 'bg-red-100 text-red-600';
      case 'PRIORITAIRE': return 'bg-blue-100 text-[#104382]';
      default:            return 'bg-gray-100 text-gray-600';
    }
  }

  ouvrirAccepter(): void {
    this.form = { montant: null, date: '', heure: '', note: 'Résultats disponibles sous 24h' };
    this.showAccepterModal = true;
    this.cdr.detectChanges();
  }

  fermerModal(): void {
    this.showAccepterModal = false;
    this.cdr.detectChanges();
  }

  confirmerAcceptation(): void {
    if (!this.detail || !this.form.montant || !this.form.date || !this.form.heure) return;

    const appointmentDate = new Date(`${this.form.date}T${this.form.heure}:00`).toISOString();
    const body = { price: this.form.montant, appointmentDate, note: this.form.note || undefined };

    this.http.patch(`${this.api}/diagnostic/lab-orders/${this.detail.id}/accept`, body).subscribe({
      next: () => {
        this.showAccepterModal = false;
        this.showSuccessModal  = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showSuccessModal = false;
          this.router.navigate(['/laboratory/demandes']);
        }, 2500);
      },
      error: () => { this.showAccepterModal = false; this.cdr.detectChanges(); },
    });
  }

  refuser(): void {
    if (!this.detail) { this.router.navigate(['/laboratory/demandes']); return; }

    this.http.patch(`${this.api}/diagnostic/lab-orders/${this.detail.id}/reject`, {}).subscribe({
      next:  () => this.router.navigate(['/laboratory/demandes']),
      error: () => this.router.navigate(['/laboratory/demandes']),
    });
  }

  getInitiales(): string {
    if (!this.detail) return '';
    return this.detail.patient.nom
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
