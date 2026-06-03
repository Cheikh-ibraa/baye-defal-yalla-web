import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type ChirurgieStatus = 'URGENT' | 'EN PRÉPARATION' | 'PLANIFIÉ' | 'TERMINÉ';
type PaiementStatus = 'Financé' | 'En attente' | 'Partiellement';

interface ChirurgieCard {
  id: string;
  fullname: string;
  age: number;
  status: ChirurgieStatus;
  intervention: string;
  service: string;
  planificationDate: string;
  planificationTime: string;
  chirurgien: string;
  paiement: PaiementStatus;
}

@Component({
  selector: 'app-chirurgie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chirurgie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChirurgieComponent {
  searchQuery = '';
  serviceFilter = 'Tous les services';

  readonly interventions: ChirurgieCard[] = [
    {
      id: 'PX-8821',
      fullname: 'Elena Rodriguez',
      age: 72,
      status: 'URGENT',
      intervention: 'Appendicectomie',
      service: 'Chirurgie viscérale',
      planificationDate: "Aujourd'hui, 24 oct.",
      planificationTime: '09:15',
      chirurgien: 'Dr. Marcus Thorne',
      paiement: 'Financé'
    },
    {
      id: 'PX-9014',
      fullname: 'Julian Schmidt',
      age: 34,
      status: 'EN PRÉPARATION',
      intervention: 'Arthroscopie du genou',
      service: 'Orthopédie',
      planificationDate: 'Démarré à',
      planificationTime: '08:00',
      chirurgien: 'Dr. Sarah Jenkins',
      paiement: 'En attente'
    },
    {
      id: 'PX-7742',
      fullname: 'Clara Beaumont',
      age: 51,
      status: 'PLANIFIÉ',
      intervention: 'Cholecystectomie',
      service: 'Chirurgie viscérale',
      planificationDate: 'Demain, 25 oct.',
      planificationTime: '11:30',
      chirurgien: 'Dr. Henri Lavoie',
      paiement: 'Financé'
    },
    {
      id: 'PX-6612',
      fullname: 'Albert Fischer',
      age: 79,
      status: 'TERMINÉ',
      intervention: 'Cure de hernie',
      service: 'Chirurgie viscérale',
      planificationDate: 'Hier, 23 oct.',
      planificationTime: '14:00',
      chirurgien: 'Dr. Marcus Thorne',
      paiement: 'Financé'
    },
    {
      id: 'PX-3305',
      fullname: 'Sophie Durand',
      age: 44,
      status: 'PLANIFIÉ',
      intervention: 'Thyroïdectomie',
      service: 'Chirurgie endocrinienne',
      planificationDate: '26 oct.',
      planificationTime: '10:00',
      chirurgien: 'Dr. Sarah Jenkins',
      paiement: 'Partiellement'
    },
    {
      id: 'PX-1190',
      fullname: 'Omar Diallo',
      age: 60,
      status: 'URGENT',
      intervention: 'Laparotomie exploratrice',
      service: 'Chirurgie viscérale',
      planificationDate: "Aujourd'hui, 24 oct.",
      planificationTime: '11:45',
      chirurgien: 'Dr. Henri Lavoie',
      paiement: 'En attente'
    }
  ];

  constructor(private router: Router) {}

  openDetail(id: string): void {
    this.router.navigate(['/chirurgie', id]);
  }

  get filtered(): ChirurgieCard[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.interventions.filter(c => {
      const matchSearch = !q ||
        c.fullname.toLowerCase().includes(q) ||
        c.intervention.toLowerCase().includes(q) ||
        c.chirurgien.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchService = this.serviceFilter === 'Tous les services' || c.service === this.serviceFilter;
      return matchSearch && matchService;
    });
  }

  statusBadgeClass(status: ChirurgieStatus): string {
    switch (status) {
      case 'URGENT':        return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'EN PRÉPARATION': return 'bg-[#DBEAFE] text-[#2563EB]';
      case 'PLANIFIÉ':      return 'bg-[#F1F5F9] text-[#475569]';
      case 'TERMINÉ':       return 'bg-[#DCFCE7] text-[#16A34A]';
    }
  }

  paiementClass(p: PaiementStatus): string {
    switch (p) {
      case 'Financé':        return 'text-[#16A34A]';
      case 'En attente':     return 'text-[#DC2626]';
      case 'Partiellement':  return 'text-[#D97706]';
    }
  }

  paiementIcon(p: PaiementStatus): 'check' | 'warning' {
    return p === 'Financé' ? 'check' : 'warning';
  }
}
