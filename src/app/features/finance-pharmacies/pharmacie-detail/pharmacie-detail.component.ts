// src/app/features/finance-pharmacies/pharmacie-detail/pharmacie-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Transaction {
  reference: string;
  date: string;
  type: 'Vente' | 'Virement';
  montant: string;
  statut: string;
}

interface VenteMensuelle {
  mois: string;
  montant: number;
}

@Component({
  selector: 'app-pharmacie-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pharmacie-detail.component.html',
  styleUrls: ['./pharmacie-detail.component.css']
})
export class PharmacieDetailComponent implements OnInit {
  pharmacie: any = null;
  activeTab: 'ventes' | 'virements' | 'transactions' = 'ventes';

  // ========================================
  // PROPRIÉTÉS POUR LES MODALS
  // ========================================
  showRecrediterModal: boolean = false;
  showRecrediterSuccessModal: boolean = false;
  showGelerModal: boolean = false;
  showGelerSuccessModal: boolean = false;

  // Valeur max du graphique (pour calculer les %)
  maxMontant = 160000;

  ventesMensuelles: VenteMensuelle[] = [
    { mois: 'Jan', montant: 85000 },
    { mois: 'Fév', montant: 92000 },
    { mois: 'Mar', montant: 105000 },
    { mois: 'Avr', montant: 110000 },
    { mois: 'Mai', montant: 115000 },
    { mois: 'Juin', montant: 120000 },
    { mois: 'Juil', montant: 125000 },
    { mois: 'Août', montant: 130000 },
    { mois: 'Sept', montant: 135000 },
    { mois: 'Oct', montant: 140000 },
    { mois: 'Nov', montant: 150000 },
    { mois: 'Déc', montant: 160000 },
  ];

  transactions: Transaction[] = [
    { reference: 'VIR-2025-089', date: '15/01/2025', type: 'Virement', montant: '-25 000 FCFA', statut: 'Effectué' },
    { reference: 'VTE-2025-124', date: '10/01/2025', type: 'Vente', montant: '+42 500 FCFA', statut: 'Complétée' },
    { reference: 'VIR-2025-077', date: '03/01/2025', type: 'Virement', montant: '-15 000 FCFA', statut: 'Effectué' },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    // Données mock (à remplacer par un service plus tard)
    this.pharmacie = {
      id,
      nom: 'Pharmacie Centrale',
      initial: 'PC',
      adresse: 'Dakar, 10 Rue de la République',
      proprietaire: 'Moussa Ndiaye',
      email: 'contact@pharmacie-centrale.sn',
      telephone: '77 123 45 67',
      dateInscription: '11 octobre 2024',
      soldeDisponible: '25 000 FCFA',
      totalVentes: '1 520 000 FCFA',
      statut: 'Normal'
    };
  }

  setTab(tab: 'ventes' | 'virements' | 'transactions'): void {
    this.activeTab = tab;
  }

  // Calcul du pourcentage de hauteur de la barre
  getBarHeight(montant: number): number {
    return (montant / this.maxMontant) * 100;
  }

  // ========================================
  // GESTION DU RECALCUL
  // ========================================
  recalculerSolde(): void {
    this.showRecrediterModal = true;
  }

  confirmerRecalcul(): void {
    console.log(`Solde recalculé pour ${this.pharmacie.nom}`);
    
    // Fermer le modal de confirmation
    this.showRecrediterModal = false;
    
    // Afficher le modal de succès
    this.showRecrediterSuccessModal = true;
    
    // Fermer automatiquement après 3 secondes
    setTimeout(() => {
      this.showRecrediterSuccessModal = false;
    }, 3000);
  }

  annulerRecalcul(): void {
    this.showRecrediterModal = false;
  }

  fermerSuccessRecalcul(): void {
    this.showRecrediterSuccessModal = false;
  }

  // ========================================
  // GESTION DU GEL
  // ========================================
  gelerCompte(): void {
    this.showGelerModal = true;
  }

  confirmerGel(): void {
    if (this.pharmacie) {
      this.pharmacie.statut = 'Gelé';
      console.log(`Compte ${this.pharmacie.nom} gelé`);
    }
    
    // Fermer le modal de confirmation
    this.showGelerModal = false;
    
    // Afficher le modal de succès
    this.showGelerSuccessModal = true;
    
    // Fermer automatiquement après 3 secondes
    setTimeout(() => {
      this.showGelerSuccessModal = false;
    }, 3000);
  }

  annulerGel(): void {
    this.showGelerModal = false;
  }

  fermerSuccessGel(): void {
    this.showGelerSuccessModal = false;
  }
}