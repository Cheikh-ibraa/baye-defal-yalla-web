import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

type Priority = 'URGENT' | 'ROUTINE' | 'PRIORITAIRE';

interface Demande {
  id: number;
  priority: Priority;
  timeAgo: string;
  title: string;
  description: string;
  distance: string;
  lieu: string;
}

interface AccepterForm {
  montant: number | null;
  date: string;
  heure: string;
  note: string;
}

@Component({
  selector: 'app-demande-laboratoire',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './demande-laboratoire.component.html',
  styleUrl: './demande-laboratoire.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeLaboratoireComponent implements OnInit {

  demandes: Demande[] = [
    { id: 1, priority: 'URGENT',      timeAgo: 'il y a 8 min',  title: 'NFS complète',             description: 'Patient présentant une anémie sévère. Numération formule sanguine complète avec réticulocytes urgente.', distance: '2.1 km',  lieu: 'Clinique St. Luc'           },
    { id: 2, priority: 'ROUTINE',     timeAgo: 'il y a 30 min', title: 'Bilan lipidique',           description: 'Contrôle annuel du bilan lipidique complet : cholestérol total, LDL, HDL, triglycérides.',              distance: '0.5 km',  lieu: 'Laboratoire Central Ville'  },
    { id: 3, priority: 'PRIORITAIRE', timeAgo: 'il y a 1h30',   title: 'Glycémie à jeun + HbA1c',  description: 'Suivi diabétique. Glycémie à jeun, HbA1c et bilan rénal complet demandés par l\'endocrinologue.',         distance: '8.3 km',  lieu: 'Hôpital Universitaire'      },
    { id: 4, priority: 'ROUTINE',     timeAgo: 'il y a 45 min', title: 'Ionogramme sanguin',        description: 'Bilan électrolytique complet : sodium, potassium, chlore, bicarbonates, créatinine et urée.',            distance: '1.2 km',  lieu: 'Laboratoire Central Ville'  },
    { id: 5, priority: 'URGENT',      timeAgo: 'il y a 5 min',  title: 'Hémoculture x2',           description: 'Suspicion de sepsis. Deux hémocultures à prélever avant toute antibiothérapie. Résultat urgent.',       distance: '3.7 km',  lieu: 'Clinique St. Luc'           },
    { id: 6, priority: 'PRIORITAIRE', timeAgo: 'il y a 2h',     title: 'Bilan hépatique complet',   description: 'Douleurs de l\'hypochondre droit. Transaminases, GGT, phosphatases alcalines, bilirubine totale/directe.', distance: '11.0 km', lieu: 'Hôpital Universitaire'      }
  ];

  showAccepterModal = false;
  showSuccessModal  = false;
  selectedDemande: Demande | null = null;
  form: AccepterForm = { montant: null, date: '', heure: '', note: '' };

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {}

  getPriorityClass(priority: Priority): string {
    switch (priority) {
      case 'URGENT':      return 'bg-red-100 text-red-600';
      case 'PRIORITAIRE': return 'bg-blue-100 text-blue-700';
      case 'ROUTINE':     return 'bg-gray-100 text-gray-600';
    }
  }

  getPriorityLabel(priority: Priority): string { return priority; }

  accepter(demande: Demande): void {
    this.selectedDemande = demande;
    this.form = { montant: 15000, date: '', heure: '', note: 'Résultats disponibles sous 24h' };
    this.showAccepterModal = true;
    this.cdr.markForCheck();
  }

  fermerModal(): void {
    this.showAccepterModal = false;
    this.selectedDemande = null;
    this.cdr.markForCheck();
  }

  confirmerAcceptation(): void {
    this.showAccepterModal = false;
    this.showSuccessModal  = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.showSuccessModal = false;
      this.cdr.markForCheck();
    }, 2500);
  }

  voirDetails(demande: Demande): void {
    this.router.navigate(['/detail-demande-laboratoire', demande.id]);
  }
}
