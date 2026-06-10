import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

type Priority = 'URGENT' | 'ROUTINE' | 'PRIORITAIRE';

interface Analyse {
  id: number;
  titre: string;
  sousTitre: string;
  icon: 'nfs' | 'glycemie' | 'creatinine' | 'hba1c' | 'lipides' | 'hepatique';
}

interface DetailDemande {
  id: number;
  priority: Priority;
  patient: { nom: string; genre: string; age: number; ref: string };
  medecin: { nom: string; specialite: string; clinique: string };
  contexteMedical: string;
  examens: Analyse[];
}

interface AccepterForm { montant: number | null; date: string; heure: string; note: string; }

const MOCK_DETAILS: Record<number, DetailDemande> = {
  1: {
    id: 1, priority: 'URGENT',
    patient: { nom: 'Fatou Diop', genre: 'FEMME', age: 35, ref: 'ANA-2026-001' },
    medecin: { nom: 'Dr. Mamadou Ndiaye', specialite: 'Cardiologue', clinique: 'Clinique St. Luc' },
    contexteMedical: '"Patient suspecté d\'une rupture du LCA. Interprétation prioritaire et séquences hautes résolutions requises."',
    examens: [
      { id: 1, titre: 'NFS',                sousTitre: 'Routine • Standard',  icon: 'nfs'       },
      { id: 2, titre: 'Glycémie à jeun',    sousTitre: 'Indice glycémique',   icon: 'glycemie'  },
      { id: 3, titre: 'Créatinine sanguine',sousTitre: 'Fonction rénale',     icon: 'creatinine'},
      { id: 4, titre: 'Hémoglobine glyquée',sousTitre: 'Suivi diabète',       icon: 'hba1c'     }
    ]
  },
  2: {
    id: 2, priority: 'ROUTINE',
    patient: { nom: 'Maman Fall', genre: 'FEMME', age: 42, ref: 'ANA-2026-002' },
    medecin: { nom: 'Dr. Assane Diallo', specialite: 'Endocrinologue', clinique: 'Laboratoire Central Ville' },
    contexteMedical: '"Bilan annuel complet. Contrôle lipidique et glycémique demandé."',
    examens: [
      { id: 1, titre: 'Bilan lipidique',    sousTitre: 'Cholestérol total',   icon: 'lipides'   },
      { id: 2, titre: 'Glycémie à jeun',    sousTitre: 'Indice glycémique',   icon: 'glycemie'  }
    ]
  },
  3: {
    id: 3, priority: 'PRIORITAIRE',
    patient: { nom: 'Fatou Fall', genre: 'FEMME', age: 28, ref: 'ANA-2026-003' },
    medecin: { nom: 'Dr. Moussa Sarr', specialite: 'Hépatologue', clinique: 'Hôpital Universitaire' },
    contexteMedical: '"Douleurs de l\'hypochondre droit. Bilan hépatique complet requis en urgence."',
    examens: [
      { id: 1, titre: 'Bilan hépatique',    sousTitre: 'Transaminases',       icon: 'hepatique' },
      { id: 2, titre: 'NFS complète',       sousTitre: 'Routine • Standard',  icon: 'nfs'       },
      { id: 3, titre: 'Créatinine',         sousTitre: 'Fonction rénale',     icon: 'creatinine'}
    ]
  },
  4: {
    id: 4, priority: 'ROUTINE',
    patient: { nom: 'Isseu Ly', genre: 'FEMME', age: 31, ref: 'ANA-2026-004' },
    medecin: { nom: 'Dr. Khadim Ba', specialite: 'Gastroentérologue', clinique: 'Laboratoire Central Ville' },
    contexteMedical: '"Ionogramme sanguin complet requis pour suivi électrolytique."',
    examens: [
      { id: 1, titre: 'Ionogramme',         sousTitre: 'Sodium • Potassium',  icon: 'creatinine'},
      { id: 2, titre: 'NFS',                sousTitre: 'Routine • Standard',  icon: 'nfs'       }
    ]
  },
  5: {
    id: 5, priority: 'URGENT',
    patient: { nom: 'Moussa Wade', genre: 'HOMME', age: 45, ref: 'ANA-2026-005' },
    medecin: { nom: 'Dr. Oumar Diop', specialite: 'Interniste', clinique: 'Clinique St. Luc' },
    contexteMedical: '"Suspicion de sepsis. Hémocultures et bilan inflammatoire urgents."',
    examens: [
      { id: 1, titre: 'Hémoculture x2',     sousTitre: 'Avant ATB',           icon: 'nfs'       },
      { id: 2, titre: 'CRP • Procalcitonine',sousTitre: 'Inflammation',        icon: 'glycemie'  }
    ]
  },
  6: {
    id: 6, priority: 'PRIORITAIRE',
    patient: { nom: 'Aïssatou Ndiaye', genre: 'FEMME', age: 52, ref: 'ANA-2026-006' },
    medecin: { nom: 'Dr. Ibrahima Fall', specialite: 'Diabétologue', clinique: 'Hôpital Universitaire' },
    contexteMedical: '"Suivi diabétique annuel. HbA1c, bilan rénal et lipidique complets."',
    examens: [
      { id: 1, titre: 'HbA1c',              sousTitre: 'Suivi diabète',       icon: 'hba1c'     },
      { id: 2, titre: 'Bilan lipidique',    sousTitre: 'LDL • HDL',           icon: 'lipides'   },
      { id: 3, titre: 'Créatinine',         sousTitre: 'Fonction rénale',     icon: 'creatinine'},
      { id: 4, titre: 'Microalbuminurie',   sousTitre: 'Atteinte rénale',     icon: 'glycemie'  }
    ]
  }
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

  detail: DetailDemande | null = null;
  loading = true;

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

  goBack(): void { this.location.back(); }

  getPriorityClass(p: Priority): string {
    switch (p) {
      case 'URGENT':      return 'bg-red-100 text-red-600';
      case 'PRIORITAIRE': return 'bg-blue-100 text-[#104382]';
      case 'ROUTINE':     return 'bg-gray-100 text-gray-600';
    }
  }

  ouvrirAccepter(): void {
    this.form = { montant: 15000, date: '', heure: '', note: 'Résultats disponibles sous 24h' };
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

  refuser(): void {
    this.router.navigate(['/demande-laboratoire']);
  }

  getInitiales(): string {
    if (!this.detail) return '';
    return this.detail.patient.nom
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('');
  }
}
