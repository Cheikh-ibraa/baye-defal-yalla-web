import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type DevisStatus = 'Retenu' | 'En attente' | 'Non retenu';

interface DevisCard {
  id: string;
  hopital: string;
  ref: string;
  status: DevisStatus;
  montant: string;
  dateEnvoi: string;
}

@Component({
  selector: 'app-devis-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devis-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevisFournisseurComponent {
  searchQuery = '';
  activeFilter: 'Tous' | 'En attente' | 'Retenu' | 'Non retenu' = 'Tous';

  constructor(private router: Router) {}

  openDetail(id: string): void {
    this.router.navigate(['/devis-fournisseur', id]);
  }

  readonly allDevis: DevisCard[] = [
    {
      id: '1',
      hopital: 'Hôpital Saint-Louis',
      ref: 'DEV-2023-0892',
      status: 'Retenu',
      montant: '5 000 000',
      dateEnvoi: '24/05/2023'
    },
    {
      id: '2',
      hopital: 'Clinique du Parc',
      ref: 'DEV-2023-0741',
      status: 'En attente',
      montant: '2 000 000',
      dateEnvoi: '12/05/2023'
    },
    {
      id: '3',
      hopital: 'CHRU Lille',
      ref: 'DEV-2023-0915',
      status: 'Non retenu',
      montant: '10 000 000',
      dateEnvoi: '05/05/2023'
    },
    {
      id: '4',
      hopital: 'CHRU Lille',
      ref: 'DEV-2023-0915',
      status: 'Non retenu',
      montant: '10 000 000',
      dateEnvoi: '05/05/2023'
    },
    {
      id: '5',
      hopital: 'Hôpital Saint-Louis',
      ref: 'DEV-2023-0892',
      status: 'Retenu',
      montant: '5 000 000',
      dateEnvoi: '24/05/2023'
    },
    {
      id: '6',
      hopital: 'Clinique du Parc',
      ref: 'DEV-2023-0741',
      status: 'En attente',
      montant: '2 000 000',
      dateEnvoi: '12/05/2023'
    }
  ];

  setFilter(filter: 'Tous' | 'En attente' | 'Retenu' | 'Non retenu'): void {
    this.activeFilter = filter;
  }

  get filteredDevis(): DevisCard[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.allDevis.filter(d => {
      const matchesSearch = !q || d.hopital.toLowerCase().includes(q) || d.ref.toLowerCase().includes(q);
      const matchesFilter = this.activeFilter === 'Tous' || d.status === this.activeFilter;
      return matchesSearch && matchesFilter;
    });
  }

  get countEnAttente(): number {
    return this.allDevis.filter(d => d.status === 'En attente').length;
  }

  statusBadgeClass(status: DevisStatus): string {
    switch (status) {
      case 'Retenu':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'En attente':  return 'bg-[#DBEAFE] text-[#104382]';
      case 'Non retenu': return 'bg-[#FCE8E6] text-[#C5221F]';
    }
  }
}
