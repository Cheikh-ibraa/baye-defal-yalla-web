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
  selector: 'app-demande-imagerie',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './demande-imagerie.component.html',
  styleUrl: './demande-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeImagerieComponent implements OnInit {

  // ── Demandes ───────────────────────────────────────────────────────────────
  demandes: Demande[] = [
    { id: 1, priority: 'URGENT',      timeAgo: 'il y a 12 min', title: 'IRM Genou Droit',         description: 'Patient suspecté d\'une rupture du LCA. Interprétation prioritaire et séquences haute...', distance: '4.2 km',  lieu: 'Clinique St. Luc'           },
    { id: 2, priority: 'ROUTINE',     timeAgo: 'il y a 45 min', title: 'Scanner Thoracique',       description: 'Patient présentant une toux chronique. Scanner thoracique avec injection requis.',          distance: '0.8 km',  lieu: 'Laboratoire Central Ville'  },
    { id: 3, priority: 'PRIORITAIRE', timeAgo: 'il y a 2h',     title: 'Échographie Abdominale',   description: 'Suivi échographique pour douleurs abdominales. Le patient demande un RDV le...',             distance: '12.5 km', lieu: 'Hôpital Universitaire'      },
    { id: 4, priority: 'ROUTINE',     timeAgo: 'il y a 45 min', title: 'Scanner Thoracique',       description: 'Patient présentant une toux chronique. Scanner thoracique avec injection requis.',          distance: '0.8 km',  lieu: 'Laboratoire Central Ville'  },
    { id: 5, priority: 'URGENT',      timeAgo: 'il y a 12 min', title: 'IRM Genou Droit',         description: 'Patient suspecté d\'une rupture du LCA. Interprétation prioritaire et séquences haute...', distance: '4.2 km',  lieu: 'Clinique St. Luc'           },
    { id: 6, priority: 'PRIORITAIRE', timeAgo: 'il y a 2h',     title: 'Échographie Abdominale',   description: 'Suivi échographique pour douleurs abdominales. Le patient demande un RDV le...',             distance: '12.5 km', lieu: 'Hôpital Universitaire'      }
  ];

  // ── Modal state ────────────────────────────────────────────────────────────
  showAccepterModal = false;
  showSuccessModal  = false;
  selectedDemande: Demande | null = null;
  form: AccepterForm = { montant: null, date: '', heure: '', note: '' };

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {}

  // ── Helpers ────────────────────────────────────────────────────────────────
  getPriorityClass(priority: Priority): string {
    switch (priority) {
      case 'URGENT':      return 'bg-red-100 text-red-600';
      case 'PRIORITAIRE': return 'bg-blue-100 text-blue-700';
      case 'ROUTINE':     return 'bg-gray-100 text-gray-600';
    }
  }

  getPriorityLabel(priority: Priority): string { return priority; }

  // ── Actions ────────────────────────────────────────────────────────────────
  accepter(demande: Demande): void {
    this.selectedDemande = demande;
    this.form = { montant: 25000, date: '', heure: '', note: 'Résultats disponibles sous 24h' };
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
    this.router.navigate(['/detail-demande-imagerie', demande.id]);
  }
}
