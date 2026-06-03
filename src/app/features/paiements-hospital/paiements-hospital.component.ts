import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type PaiementStatut = 'Payé' | 'Partiel' | 'Non payé';
type FilterTab = 'Tous' | PaiementStatut;
type KpiId = 'recu' | 'attente' | 'valides' | 'factures';

interface KpiItem {
  id: KpiId;
  label: string;
  value: string;
  badge?: string;
  badgeClass?: string;
}

interface PaiementCard {
  id: string;
  nom: string;
  statut: PaiementStatut;
  service: string;
  sousService: string;
  date: string;
  montantTotal: string;
  montantPaye: string;
  resteAPayer: string;
}

@Component({
  selector: 'app-paiements-hospital',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paiements-hospital.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaiementsHospitalComponent {

  activeTab: FilterTab = 'Tous';
  readonly tabs: FilterTab[] = ['Tous', 'Payé', 'Partiel', 'Non payé'];

  readonly kpis: KpiItem[] = [
    { id: 'recu',     label: 'Total reçu',            value: '145 750 000 FCFA', badge: '+12.5%',        badgeClass: 'bg-[#ECFDF5] text-[#16A34A]' },
    { id: 'attente',  label: 'Paiements en attente',  value: '12',               badge: 'Action requise', badgeClass: 'bg-[#FFF7ED] text-[#D97706]' },
    { id: 'valides',  label: 'Paiements validés',      value: '156',              badge: 'Validés',        badgeClass: 'bg-[#ECFDF5] text-[#16A34A]' },
    { id: 'factures', label: 'Factures générées',      value: '168',              badge: undefined,        badgeClass: '' }
  ];

  private readonly allPaiements: PaiementCard[] = [
    {
      id: 'PX-8821',
      nom: 'Jean-Pierre Lambert',
      statut: 'Payé',
      service: 'Chirurgie',
      sousService: 'Cardiologie',
      date: '12 Oct. 2023',
      montantTotal: '1 250 000 FCFA',
      montantPaye: '1 250 000 FCFA',
      resteAPayer: '0 FCFA'
    },
    {
      id: 'PX-4429',
      nom: 'Marie-Claire Diop',
      statut: 'Partiel',
      service: 'Hospitalisation',
      sousService: 'Maternité',
      date: '14 Oct. 2023',
      montantTotal: '450 000 FCFA',
      montantPaye: '200 000 FCFA',
      resteAPayer: '250 000 FCFA'
    },
    {
      id: 'PX-9102',
      nom: 'Abdoulaye Wade',
      statut: 'Non payé',
      service: 'Examen',
      sousService: 'Scanner IRM',
      date: '15 Oct. 2023',
      montantTotal: '85 000 FCFA',
      montantPaye: '0 FCFA',
      resteAPayer: '85 000 FCFA'
    },
    {
      id: 'PX-3301',
      nom: 'Aïssatou Diallo',
      statut: 'Payé',
      service: 'Consultation',
      sousService: 'Gynécologie',
      date: '16 Oct. 2023',
      montantTotal: '35 000 FCFA',
      montantPaye: '35 000 FCFA',
      resteAPayer: '0 FCFA'
    },
    {
      id: 'PX-5522',
      nom: 'Ousmane Sarr',
      statut: 'Partiel',
      service: 'Hospitalisation',
      sousService: 'Neurologie',
      date: '17 Oct. 2023',
      montantTotal: '320 000 FCFA',
      montantPaye: '160 000 FCFA',
      resteAPayer: '160 000 FCFA'
    },
    {
      id: 'PX-7741',
      nom: 'Amadou M\'Baye',
      statut: 'Non payé',
      service: 'Chirurgie',
      sousService: 'Orthopédie',
      date: '18 Oct. 2023',
      montantTotal: '780 000 FCFA',
      montantPaye: '0 FCFA',
      resteAPayer: '780 000 FCFA'
    }
  ];

  constructor(private router: Router) {}

  openDetail(id: string): void {
    this.router.navigate(['/paiements-hospital', id]);
  }

  get filteredPaiements(): PaiementCard[] {
    if (this.activeTab === 'Tous') return this.allPaiements;
    return this.allPaiements.filter(p => p.statut === this.activeTab);
  }

  statutBadgeClass(s: PaiementStatut): string {
    switch (s) {
      case 'Payé':     return 'bg-[#ECFDF5] text-[#16A34A]';
      case 'Partiel':  return 'bg-[#FFF7ED] text-[#D97706]';
      case 'Non payé': return 'bg-[#FEF2F2] text-[#DC2626]';
    }
  }

  montantPayeClass(s: PaiementStatut): string {
    switch (s) {
      case 'Payé':     return 'text-[#16A34A]';
      case 'Partiel':  return 'text-[#2563EB]';
      case 'Non payé': return 'text-[#94A3B8]';
    }
  }

  resteClass(s: PaiementStatut): string {
    return s === 'Payé' ? 'text-[#0F172A]' : 'text-[#DC2626]';
  }
}
