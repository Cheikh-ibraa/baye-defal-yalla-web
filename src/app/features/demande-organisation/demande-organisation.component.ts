import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type DemandeStatus = 'En attente' | 'Validé' | 'Urgent';

interface DemandeOrganisation {
  id: string;
  hopital: string;
  categorie: string;
  status: DemandeStatus;
  budgetEstime: string;
  devisRecus: number;
  iconKey: 'hospital' | 'star' | 'lab';
}

type FilterOption = 'Toutes' | 'En attente' | 'Validé';

@Component({
  selector: 'app-demande-organisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeOrganisationComponent {
  activeFilter: FilterOption = 'Toutes';

  readonly filters: FilterOption[] = ['Toutes', 'En attente', 'Validé'];

  constructor(private router: Router) {}

  readonly allDemandes: DemandeOrganisation[] = [
    {
      id: '1',
      hopital: 'BDY Hôpital Central',
      categorie: 'Equipement de bloc...',
      status: 'En attente',
      budgetEstime: '2 000 000 FCFA',
      devisRecus: 3,
      iconKey: 'hospital'
    },
    {
      id: '2',
      hopital: 'Clinique du Parc',
      categorie: 'Imagerie IRM',
      status: 'Validé',
      budgetEstime: '5 000 000 FCFA',
      devisRecus: 5,
      iconKey: 'star'
    },
    {
      id: '3',
      hopital: 'CHU Saint-Luc',
      categorie: 'Équipement Labo',
      status: 'Urgent',
      budgetEstime: '2 500 000 FCFA',
      devisRecus: 2,
      iconKey: 'lab'
    },
    {
      id: '4',
      hopital: 'Clinique du Parc',
      categorie: 'Imagerie IRM',
      status: 'Validé',
      budgetEstime: '5 000 000 FCFA',
      devisRecus: 5,
      iconKey: 'star'
    },
    {
      id: '5',
      hopital: 'BDY Hôpital Central',
      categorie: 'Equipement de bloc...',
      status: 'En attente',
      budgetEstime: '2 000 000 FCFA',
      devisRecus: 3,
      iconKey: 'hospital'
    },
    {
      id: '6',
      hopital: 'CHU Saint-Luc',
      categorie: 'Équipement Labo',
      status: 'Urgent',
      budgetEstime: '2 500 000 FCFA',
      devisRecus: 2,
      iconKey: 'lab'
    }
  ];

  get filteredDemandes(): DemandeOrganisation[] {
    if (this.activeFilter === 'Toutes') return this.allDemandes;
    return this.allDemandes.filter(d => d.status === this.activeFilter);
  }

  setFilter(filter: FilterOption): void {
    this.activeFilter = filter;
  }

  statusBadgeClass(status: DemandeStatus): string {
    switch (status) {
      case 'Validé':    return 'bg-[#E6F4EA] text-[#137333]';
      case 'En attente': return 'bg-[#EEF4FF] text-[#104382]';
      case 'Urgent':    return 'bg-[#FCE8E6] text-[#C5221F]';
    }
  }

  iconBgClass(iconKey: DemandeOrganisation['iconKey']): string {
    switch (iconKey) {
      case 'hospital': return 'bg-[#EEF4FF] text-[#104382]';
      case 'star':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'lab':      return 'bg-[#FCE8E6] text-[#C5221F]';
    }
  }

  openDetail(id: string): void {
    // “Voir détail” doit utiliser “Voir devis” (même logique de navigation)
    this.openDevis(id);
  }


  openDevis(id: string): void {
    // Voir devis des cartes demande-organisation doit ouvrir le détail demande organisation
    console.log('navigate to detail-demande-organisation', id);
    this.router.navigate(['/demande-organisation', id]);
  }
}
