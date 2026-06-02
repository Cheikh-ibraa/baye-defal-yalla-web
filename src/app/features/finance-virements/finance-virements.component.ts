import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DemandeVirement {
  id: string;
  initial: string;
  pharmacie: string;
  adresse: string;
  date: string;
  montant: string;
  statut: 'En attente' | 'Validé' | 'Rejeté';
}

@Component({
  selector: 'app-finance-virements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-virements.component.html',
  styleUrls: ['./finance-virements.component.css']
})
export class FinanceVirementsComponent implements OnInit {
  Math = Math;
  searchTerm: string = '';
  selectedStatut: string = 'all';
  itemsPerPage: number = 10;
  currentPage: number = 1;

  allDemandes: DemandeVirement[] = [
    {
      id: '1',
      initial: 'PC',
      pharmacie: 'Pharmacie Centrale',
      adresse: 'Dakar, 123 Rue Principale',
      date: '2025-01-15',
      montant: '150 000 FCFA',
      statut: 'En attente'
    },
    {
      id: '2',
      initial: 'PG',
      pharmacie: 'Pharmacie de la Gare',
      adresse: 'Dakar, 45 Avenue du Nord',
      date: '2025-01-15',
      montant: '65 000 FCFA',
      statut: 'En attente'
    },
    {
      id: '3',
      initial: 'PC',
      pharmacie: 'Pharmacie Centrale',
      adresse: 'Dakar, 78 Boulevard Saint-Michel',
      date: '2025-01-15',
      montant: '25 000 FCFA',
      statut: 'Validé'
    },
    {
      id: '4',
      initial: 'PG',
      pharmacie: 'Pharmacie de la Gare',
      adresse: 'Dakar, 12 Place de la Gare',
      date: '2025-01-15',
      montant: '25 000 FCFA',
      statut: 'Validé'
    },
    {
      id: '5',
      initial: 'PM',
      pharmacie: 'Pharmacie du marché',
      adresse: 'Dakar, 56 Avenue Victor Hugo',
      date: '2025-01-15',
      montant: '25 000 FCFA',
      statut: 'Rejeté'
    },
    {
      id: '6',
      initial: 'PP',
      pharmacie: 'Pharmacie de la Paix',
      adresse: 'Dakar, Avenue de la Paix',
      date: '2025-01-14',
      montant: '180 000 FCFA',
      statut: 'En attente'
    },
    {
      id: '7',
      initial: 'PO',
      pharmacie: 'Pharmacie OUEDION',
      adresse: 'Dakar, Quartier OUEDION',
      date: '2025-01-14',
      montant: '95 000 FCFA',
      statut: 'Validé'
    },
    {
      id: '8',
      initial: 'PD',
      pharmacie: 'Pharmacie Diamal',
      adresse: 'Dakar, Rue du Commerce',
      date: '2025-01-13',
      montant: '120 000 FCFA',
      statut: 'En attente'
    }
  ];

  filteredDemandes: DemandeVirement[] = [];
  paginatedDemandes: DemandeVirement[] = [];
  totalPages: number = 1;

  ngOnInit() {
    this.filterDemandes();
  }

  filterDemandes() {
    this.filteredDemandes = this.allDemandes.filter(demande => {
      const matchesSearch =
        demande.pharmacie.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        demande.adresse.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatut = this.selectedStatut === 'all' || demande.statut === this.selectedStatut;
      return matchesSearch && matchesStatut;
    });

    this.totalPages = Math.ceil(this.filteredDemandes.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDemandes = this.filteredDemandes.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.filterDemandes();
  }

  onStatutChange() {
    this.filterDemandes();
  }

  onItemsPerPageChange() {
    this.filterDemandes();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  voirDemande(demande: DemandeVirement) {
    console.log('Voir demande:', demande);
    // Implémenter la navigation vers les détails de la demande
  }

  validerDemande(demande: DemandeVirement) {
    // Mettre à jour le statut
    demande.statut = 'Validé';
    console.log(`Demande de ${demande.pharmacie} validée`);

    // Rafraîchir l'affichage
    this.updatePagination();

    // Ici, vous devriez normalement faire un appel API
    // this.virementService.valider(demande.id).subscribe(...)
  }

  rejeterDemande(demande: DemandeVirement) {
    // Mettre à jour le statut
    demande.statut = 'Rejeté';
    console.log(`Demande de ${demande.pharmacie} rejetée`);

    // Rafraîchir l'affichage
    this.updatePagination();

    // Ici, vous devriez normalement faire un appel API
    // this.virementService.rejeter(demande.id).subscribe(...)
  }
}