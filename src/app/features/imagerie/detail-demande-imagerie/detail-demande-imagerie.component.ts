import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

// ── Interfaces ────────────────────────────────────────────────────────────────

type Priority = 'URGENT' | 'ROUTINE' | 'PRIORITAIRE';

interface Examen {
  id: number;
  titre: string;
  sousTitre: string;
  icon: 'irm' | 'scanner' | 'echo' | 'radio';
}

interface DetailDemande {
  id: number;
  priority: Priority;
  patient: { nom: string; genre: string; age: number; ref: string };
  medecin: { nom: string; specialite: string; clinique: string };
  contexteMedical: string;
  examens: Examen[];
}

interface AccepterForm { montant: number | null; date: string; heure: string; note: string; }

// ── Mock store ────────────────────────────────────────────────────────────────

const MOCK_DETAILS: Record<number, DetailDemande> = {
  1: {
    id: 1, priority: 'URGENT',
    patient: { nom: 'Fatou Diop', genre: 'FEMME', age: 35, ref: 'ANA-2026-001' },
    medecin: { nom: 'Dr. Mamadou Ndiaye', specialite: 'Cardiologue', clinique: 'Clinique St. Luc' },
    contexteMedical: '"Patient suspecté d\'une rupture du LCA. Interprétation prioritaire et séquences hautes résolutions requises."',
    examens: [
      { id: 1, titre: 'IRM Genou Droit',   sousTitre: 'Routine • Standard',  icon: 'irm'     },
      { id: 2, titre: 'Scanner Thoracique', sousTitre: 'Injection Requis',    icon: 'scanner' }
    ]
  },
  2: {
    id: 2, priority: 'ROUTINE',
    patient: { nom: 'Maman Fall', genre: 'FEMME', age: 42, ref: 'ANA-2026-002' },
    medecin: { nom: 'Dr. Assane Diallo', specialite: 'Pneumologue', clinique: 'Laboratoire Central Ville' },
    contexteMedical: '"Patient présentant une toux chronique. Scanner thoracique avec injection requis pour évaluation pulmonaire."',
    examens: [
      { id: 1, titre: 'Scanner Thoracique', sousTitre: 'Injection Requis', icon: 'scanner' },
      { id: 2, titre: 'Radiographie',        sousTitre: 'Standard',         icon: 'radio'   }
    ]
  },
  3: {
    id: 3, priority: 'PRIORITAIRE',
    patient: { nom: 'Fatou Fall', genre: 'FEMME', age: 28, ref: 'ANA-2026-003' },
    medecin: { nom: 'Dr. Moussa Sarr', specialite: 'Orthopédiste', clinique: 'Hôpital Universitaire' },
    contexteMedical: '"Suivi échographique pour douleurs abdominales persistantes. Le patient demande un RDV dans les meilleurs délais."',
    examens: [
      { id: 1, titre: 'Échographie Abdominale', sousTitre: 'Routine • Standard', icon: 'echo' }
    ]
  },
  4: {
    id: 4, priority: 'ROUTINE',
    patient: { nom: 'Isseu Ly', genre: 'FEMME', age: 31, ref: 'ANA-2026-004' },
    medecin: { nom: 'Dr. Khadim Ba', specialite: 'Gastroentérologue', clinique: 'Laboratoire Central Ville' },
    contexteMedical: '"Douleurs abdominales chroniques sans cause identifiée. Scanner thoracique avec injection requis."',
    examens: [
      { id: 1, titre: 'Scanner Thoracique', sousTitre: 'Injection Requis', icon: 'scanner' },
      { id: 2, titre: 'Échographie',         sousTitre: 'Standard',         icon: 'echo'    }
    ]
  },
  5: {
    id: 5, priority: 'URGENT',
    patient: { nom: 'Moussa Wade', genre: 'HOMME', age: 45, ref: 'ANA-2026-005' },
    medecin: { nom: 'Dr. Oumar Diop', specialite: 'Neurologue', clinique: 'Clinique St. Luc' },
    contexteMedical: '"Patient suspecté d\'une rupture du LCA. Interprétation prioritaire et séquences hautes résolutions requises."',
    examens: [
      { id: 1, titre: 'IRM Cérébral',     sousTitre: 'Urgence • Standard',  icon: 'irm'  },
      { id: 2, titre: 'IRM Genou Droit',  sousTitre: 'Routine • Standard',  icon: 'irm'  }
    ]
  },
  6: {
    id: 6, priority: 'PRIORITAIRE',
    patient: { nom: 'Aïssatou Ndiaye', genre: 'FEMME', age: 52, ref: 'ANA-2026-006' },
    medecin: { nom: 'Dr. Ibrahima Fall', specialite: 'Cardiologue', clinique: 'Hôpital Universitaire' },
    contexteMedical: '"Suivi échographique pour douleurs abdominales. Contrôle post-opératoire recommandé."',
    examens: [
      { id: 1, titre: 'Échographie Abdominale', sousTitre: 'Routine • Standard',  icon: 'echo'    },
      { id: 2, titre: 'Scanner Thoracique',      sousTitre: 'Injection Requis',    icon: 'scanner' },
      { id: 3, titre: 'IRM Lombaire',            sousTitre: 'Prioritaire',         icon: 'irm'     },
      { id: 4, titre: 'Radiographie',            sousTitre: 'Standard',            icon: 'radio'   }
    ]
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-detail-demande-imagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-demande-imagerie.component.html',
  styleUrl: './detail-demande-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDemandeImagerieComponent implements OnInit {

  detail: DetailDemande | null = null;
  loading = true;

  // Modal accepter
  showAccepterModal = false;
  showSuccessModal  = false;
  form: AccepterForm = { montant: null, date: '', heure: '', note: '' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    of(MOCK_DETAILS[id] ?? MOCK_DETAILS[1]).pipe(delay(150)).subscribe(data => {
      this.detail  = data;
      this.loading = false;
      this.cdr.markForCheck();
    });
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
    this.cdr.detectChanges();
  }

  fermerModal(): void {
    this.showAccepterModal = false;
    this.cdr.detectChanges();
  }

  confirmerAcceptation(): void {
    this.showAccepterModal = false;
    this.showSuccessModal  = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showSuccessModal = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  // ── Refuser ────────────────────────────────────────────────────────────────
  refuser(): void {
    this.router.navigate(['/demande-imagerie']);
  }

  getPatientInitiales(): string {
    if (!this.detail) return '';
    return this.detail.patient.nom
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0].toUpperCase())
      .join('');
  }
}
