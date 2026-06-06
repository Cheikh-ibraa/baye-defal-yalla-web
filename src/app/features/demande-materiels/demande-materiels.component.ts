import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-materiels.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeMaterielComponent {

  showModal = false;
  nomDemande = 'Commande médicaux';
  nomProduit = 'Gants';
  quantite = 50;
  unite = 'Boites';
  description = '';
  urgencyLevel = 'Urgent';
  selectedFournisseurs: string[] = ['medtech', 'santelogix'];

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
      subClass: 'text-[#00339E]'
    }
  ];

  demandes: DemandeMateriel[] = [
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

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  openDetail(ref: string): void {
    this.router.navigate(['/demande-materiels', ref]);
  }

  statusClass(status: DemandeStatus): string {
    return status === 'En attente'
      ? 'bg-[#F39C121A] text-[#F39C12]'
      : 'bg-[#00B8941A] text-[#00B894]';
  }

  statusLabel(d: DemandeMateriel): string {
    return d.status === 'Devis reçus' ? `Devis reçus (${d.devisCount})` : d.status;
  }

  openModal(): void {
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  toggleFournisseur(id: string): void {
    if (this.selectedFournisseurs.includes(id)) {
      this.selectedFournisseurs = this.selectedFournisseurs.filter(f => f !== id);
    } else {
      this.selectedFournisseurs = [...this.selectedFournisseurs, id];
    }
    this.cdr.markForCheck();
  }

  submitDemande(): void {
    const nextRef = `REQ-2024-0${this.demandes.length + 1}`;
    const newDemande: DemandeMateriel = {
      ref: nextRef,
      titre: this.nomDemande || 'Demande sans nom',
      dateEmission: '05 Juin 2026',
      fournisseurs: this.selectedFournisseurs.length,
      status: 'En attente',
      devisCount: 0
    };
    this.demandes = [newDemande, ...this.demandes];
    this.closeModal();
  }
}
