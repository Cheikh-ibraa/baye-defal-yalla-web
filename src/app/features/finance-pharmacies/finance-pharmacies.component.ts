// src/app/features/finance-pharmacies/finance-pharmacies.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Pharmacie {
  id: string;
  initial: string;
  nom: string;
  adresse: string;
  soldeDisponible: string;
  totalVentes: string;
  dernierVersement: string;
  statut: 'Normal' | 'Gelé';
}

@Component({
  selector: 'app-finance-pharmacies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-pharmacies.component.html',
  styleUrls: ['./finance-pharmacies.component.css']
})
export class FinancePharmaciesComponent implements OnInit {
  Math = Math;
  searchTerm: string = '';
  selectedStatut: string = 'all';
  itemsPerPage: number = 10;
  currentPage: number = 1;

  // ========================================
  // PROPRIÉTÉS POUR LES MODALS
  // ========================================
  showGelerModal: boolean = false;
  showDegelerModal: boolean = false;
  showRecrediterModal: boolean = false;
  showRecrediterSuccessModal: boolean = false;
  selectedPharmacie: Pharmacie | null = null;

  // Données mock
  allPharmacies: Pharmacie[] = [
    { id: '1', initial: 'PC', nom: 'Pharmacie Centrale', adresse: 'Dakar, 10 Rue de la République', soldeDisponible: '25 000 FCFA', totalVentes: '516 000 FCFA', dernierVersement: '2025-01-15', statut: 'Normal' },
    { id: '2', initial: 'PG', nom: 'Pharmacie de la Gare', adresse: 'Dakar, Avenue du Chemin de Fer', soldeDisponible: '65 000 FCFA', totalVentes: '276 000 FCFA', dernierVersement: '2025-01-15', statut: 'Normal' },
    { id: '3', initial: 'PC', nom: 'Pharmacie Centrale', adresse: 'Dakar, 15 boulevard Saint-Michel', soldeDisponible: '226 000 FCFA', totalVentes: '451 971 FCFA', dernierVersement: '2025-01-15', statut: 'Gelé' },
    { id: '4', initial: 'PF', nom: 'Pharmacie de la Paix', adresse: 'Dakar, 56 Avenue Victor Hugo', soldeDisponible: '276 000 FCFA', totalVentes: '451 971 FCFA', dernierVersement: '2025-01-15', statut: 'Normal' },
    { id: '5', initial: 'PG', nom: 'Pharmacie de la Gare', adresse: 'Dakar, 12 Place de la Gare', soldeDisponible: '276 000 FCFA', totalVentes: '451 971 FCFA', dernierVersement: '2025-01-15', statut: 'Gelé' },
    { id: '6', initial: 'PO', nom: 'Pharmacie OUEDION', adresse: 'Dakar, Quartier OUEDION', soldeDisponible: '150 000 FCFA', totalVentes: '380 000 FCFA', dernierVersement: '2025-01-14', statut: 'Normal' },
    { id: '7', initial: 'PF', nom: 'Pharmacie S Fatou', adresse: 'Dakar, Avenue Fatou Sow', soldeDisponible: '95 000 FCFA', totalVentes: '290 000 FCFA', dernierVersement: '2025-01-13', statut: 'Normal' },
    { id: '8', initial: 'PD', nom: 'Pharmacie Diamal', adresse: 'Dakar, Rue du Commerce', soldeDisponible: '180 000 FCFA', totalVentes: '420 000 FCFA', dernierVersement: '2025-01-15', statut: 'Gelé' }
  ];

  filteredPharmacies: Pharmacie[] = [];
  paginatedPharmacies: Pharmacie[] = [];
  totalPages: number = 1;

  constructor(private router: Router) {}

  ngOnInit() {
    this.filterPharmacies();
  }

  // ========================================
  // FILTRAGE & PAGINATION
  // ========================================
  filterPharmacies() {
    this.filteredPharmacies = this.allPharmacies.filter(pharmacie => {
      const matchesSearch =
        pharmacie.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pharmacie.adresse.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatut = this.selectedStatut === 'all' || pharmacie.statut === this.selectedStatut;
      return matchesSearch && matchesStatut;
    });

    this.totalPages = Math.ceil(this.filteredPharmacies.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedPharmacies = this.filteredPharmacies.slice(start, end);
  }

  onSearchChange() { this.filterPharmacies(); }
  onStatutChange() { this.filterPharmacies(); }
  onItemsPerPageChange() { this.filterPharmacies(); }

  previousPage() {
    if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); }
  }

  // ========================================
  // ACTIONS
  // ========================================
  voirPharmacie(pharmacie: Pharmacie) {
    this.router.navigate(['/finance-pharmacies/detail', pharmacie.id]);
  }

  recrediterPharmacie(pharmacie: Pharmacie) {
    this.selectedPharmacie = pharmacie;
    this.showRecrediterModal = true;
  }

  confirmerRecrediter() {
    if (this.selectedPharmacie) {
      console.log(`Solde recalculé pour ${this.selectedPharmacie.nom}`);
      
      // Fermer le modal de confirmation
      this.showRecrediterModal = false;
      
      // Afficher le modal de succès
      this.showRecrediterSuccessModal = true;
      
      // Fermer automatiquement le modal de succès après 3 secondes
      setTimeout(() => {
        this.showRecrediterSuccessModal = false;
        this.selectedPharmacie = null;
      }, 3000);
    }
  }

  annulerRecrediter() {
    this.showRecrediterModal = false;
    this.selectedPharmacie = null;
  }

  fermerSuccessModal() {
    this.showRecrediterSuccessModal = false;
    this.selectedPharmacie = null;
  }

  // ========================================
  // GEL / DÉGEL
  // ========================================
  gelerDegelerPharmacie(pharmacie: Pharmacie) {
    this.selectedPharmacie = pharmacie;
    if (pharmacie.statut === 'Normal') {
      this.showGelerModal = true;
    } else {
      this.showDegelerModal = true;
    }
  }

  confirmerGeler() {
    if (this.selectedPharmacie) {
      this.selectedPharmacie.statut = 'Gelé';
      console.log(`Pharmacie ${this.selectedPharmacie.nom} gelée`);
    }
    this.annulerAction();
  }

  confirmerDegeler() {
    if (this.selectedPharmacie) {
      this.selectedPharmacie.statut = 'Normal';
      console.log(`Pharmacie ${this.selectedPharmacie.nom} dégelée`);
    }
    this.annulerAction();
  }

  annulerAction() {
    this.showGelerModal = false;
    this.showDegelerModal = false;
    this.selectedPharmacie = null;
  }
}