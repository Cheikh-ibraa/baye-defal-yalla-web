import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ─── Domain Types ───────────────────────────────────────────────────────────

type DemandeStatus = 'En attente' | 'Validé' | 'Urgent';

interface DemandeFournisseur {
  id: string;
  hopital: string;
  categorie: string;
  status: DemandeStatus;
  echeance: string;
  produitsCount: number;
  /** SVG icon key: 'hospital' | 'star' | 'lab' */
  iconKey: 'hospital' | 'star' | 'lab';
}

type FilterOption = 'Toutes' | 'En attente' | 'Validé';

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-demandes-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demandes-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandesFournisseurComponent {

  activeFilter: FilterOption = 'Toutes';

  readonly filters: FilterOption[] = ['Toutes', 'En attente', 'Validé'];

  constructor(private router: Router) {}

  readonly allDemandes: DemandeFournisseur[] = [
    {
      id: '1',
      hopital: 'BDY Hôpital Central',
      categorie: 'Equipement de bloc...',
      status: 'En attente',
      echeance: '24 oct 2025',
      produitsCount: 3,
      iconKey: 'hospital'
    },
    {
      id: '2',
      hopital: 'Clinique du Parc',
      categorie: 'Imagerie IRM',
      status: 'Validé',
      echeance: '30 dec 2025',
      produitsCount: 5,
      iconKey: 'star'
    },
    {
      id: '3',
      hopital: 'CHU Saint-Luc',
      categorie: 'Équipement Labo',
      status: 'Urgent',
      echeance: '24 sept 2025',
      produitsCount: 2,
      iconKey: 'lab'
    },
    {
      id: '4',
      hopital: 'Clinique du Parc',
      categorie: 'Imagerie IRM',
      status: 'Validé',
      echeance: '30 dec 2025',
      produitsCount: 5,
      iconKey: 'star'
    },
    {
      id: '5',
      hopital: 'BDY Hôpital Central',
      categorie: 'Equipement de bloc...',
      status: 'En attente',
      echeance: '24 oct 2025',
      produitsCount: 3,
      iconKey: 'hospital'
    },
    {
      id: '6',
      hopital: 'CHU Saint-Luc',
      categorie: 'Équipement Labo',
      status: 'Urgent',
      echeance: '24 sept 2025',
      produitsCount: 2,
      iconKey: 'lab'
    }
  ];

  get filteredDemandes(): DemandeFournisseur[] {
    if (this.activeFilter === 'Toutes') return this.allDemandes;
    return this.allDemandes.filter(d => d.status === this.activeFilter);
  }

  setFilter(filter: FilterOption): void {
    this.activeFilter = filter;
  }

  /** Returns Tailwind classes for the status badge */
  statusBadgeClass(status: DemandeStatus): string {
    switch (status) {
      case 'Validé':    return 'bg-[#E6F4EA] text-[#137333]';
      case 'En attente': return 'bg-[#DBEAFE] text-[#104382]';
      case 'Urgent':    return 'bg-[#FCE8E6] text-[#C5221F]';
    }
  }

  /** Returns Tailwind classes for the icon container background */
  iconBgClass(iconKey: DemandeFournisseur['iconKey']): string {
    switch (iconKey) {
      case 'hospital': return 'bg-[#EEF4FF] text-[#104382]';
      case 'star':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'lab':      return 'bg-[#FCE8E6] text-[#C5221F]';
    }
  }
  /** Navigates to the detail page of the selected demande */
  openDetail(id: string): void {
    this.router.navigate(['/demandes-fournisseur', id]);
  }
}
