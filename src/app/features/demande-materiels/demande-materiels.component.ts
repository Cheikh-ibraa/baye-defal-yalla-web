import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

type DemandeStatus = 'En attente' | 'Devis reçus';

interface KpiItem {
  id: 'total' | 'attente' | 'devis';
  label: string;
  value: string;
  dark: boolean;
  sub: string | null;
  subClass: string;
}

interface DemandeMateriel {
  ref: string;
  titre: string;
  dateEmission: string;
  fournisseurs: number;
  status: DemandeStatus;
  devisCount?: number;
}

@Component({
  selector: 'app-demande-materiels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demande-materiels.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeMaterielComponent {

  readonly kpis: KpiItem[] = [
    {
      id: 'total',
      label: 'TOTAL DEMANDES',
      value: '24',
      dark: true,
      sub: null,
      subClass: ''
    },
    {
      id: 'attente',
      label: 'EN ATTENTE',
      value: '08',
      dark: false,
      sub: '+12% vs mois dernier',
      subClass: 'text-[#16A34A]'
    },
    {
      id: 'devis',
      label: 'DEVIS REÇUS',
      value: '16',
      dark: false,
      sub: 'Prêt pour décision',
      subClass: 'text-[#2563EB]'
    }
  ];

  readonly demandes: DemandeMateriel[] = [
    {
      ref: 'REQ-2024-001',
      titre: 'Gants stériles en latex',
      dateEmission: '12 Oct 2023',
      fournisseurs: 4,
      status: 'En attente'
    },
    {
      ref: 'REQ-2024-042',
      titre: 'Equipement blocs opératoires',
      dateEmission: '08 Oct 2023',
      fournisseurs: 6,
      status: 'Devis reçus',
      devisCount: 3
    },
    {
      ref: 'REQ-2024-015',
      titre: 'Kits de perfusion standard',
      dateEmission: '05 Oct 2023',
      fournisseurs: 3,
      status: 'Devis reçus',
      devisCount: 3
    },
    {
      ref: 'REQ-2024-112',
      titre: 'Sondes urinaires silicone',
      dateEmission: '01 Oct 2023',
      fournisseurs: 5,
      status: 'Devis reçus',
      devisCount: 3
    },
    {
      ref: 'REQ-2024-088',
      titre: 'Pansements hydrocellulaires',
      dateEmission: '28 Sep 2023',
      fournisseurs: 2,
      status: 'Devis reçus',
      devisCount: 3
    }
  ];

  constructor(private router: Router) {}

  openDetail(ref: string): void {
    this.router.navigate(['/demande-materiels', ref]);
  }

  statusClass(status: DemandeStatus): string {
    return status === 'En attente'
      ? 'bg-[#FFF7ED] text-[#D97706]'
      : 'bg-[#ECFDF5] text-[#0D9488]';
  }

  statusLabel(d: DemandeMateriel): string {
    return d.status === 'Devis reçus' ? `Devis reçus (${d.devisCount})` : d.status;
  }
}
