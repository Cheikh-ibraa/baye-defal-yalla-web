import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  iconColor: string;
}

interface Transaction {
  date: string;
  id: string;
  montant: string;
  patient: string;
  modePaiement: string;
  statut: string;
  statutColor: string;
  statutBg: string;
}

@Component({
  selector: 'app-finance-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-transactions.component.html',
  styleUrls: ['./finance-transactions.component.css']
})
export class FinanceTransactionsComponent implements OnInit {
  selectedPeriod: string = 'Ce mois';
  searchQuery: string = '';
  selectedStatut: string = 'Tous les statuts';
  selectedModePaiement: string = 'Mode de paiement';
  
  itemsPerPage: number = 10;
  currentPage: number = 1;

  statsCards: StatCard[] = [
    {
      title: 'Transactions',
      value: '32',
      subtitle: 'Total',
      iconColor: '#6B7280'
    },
    {
      title: 'Transactions réussies',
      value: '24',
      subtitle: 'Total',
      iconColor: '#10B981'
    },
    {
      title: 'Transactions en attente',
      value: '06',
      subtitle: 'Total',
      iconColor: '#F59E0B'
    },
    {
      title: 'Transactions échouées',
      value: '02',
      subtitle: 'Total',
      iconColor: '#EF4444'
    }
  ];

  transactions: Transaction[] = [
    {
      date: '07/11/2025 14:30',
      id: 'TXN-2025-145',
      montant: '32 500 F',
      patient: 'Rama Tall',
      modePaiement: 'Carte Bancaire',
      statut: 'Réussie',
      statutColor: '#10B981',
      statutBg: '#D1FAE5'
    },
    {
      date: '07/11/2025 13:15',
      id: 'TXN-2025-144',
      montant: '7 000 F',
      patient: 'Sire Ndiaye',
      modePaiement: 'Mobile Money',
      statut: 'Réussie',
      statutColor: '#10B981',
      statutBg: '#D1FAE5'
    },
    {
      date: '07/11/2025 11:45',
      id: 'TXN-2025-143',
      montant: '12 900 F',
      patient: 'Cheikh Wade',
      modePaiement: 'Carte Bancaire',
      statut: 'En attente',
      statutColor: '#F59E0B',
      statutBg: '#FEF3C7'
    },
    {
      date: '07/11/2025 10:20',
      id: 'TXN-2025-142',
      montant: '15 750 F',
      patient: 'Ablaye Sy',
      modePaiement: 'Espèces',
      statut: 'Échouée',
      statutColor: '#EF4444',
      statutBg: '#FEE2E2'
    },
    {
      date: '07/11/2025 09:30',
      id: 'TXN-2025-141',
      montant: '15 750 F',
      patient: 'Ablaye Sy',
      modePaiement: 'Carte Bancaire',
      statut: 'Réussie',
      statutColor: '#10B981',
      statutBg: '#D1FAE5'
    },
    {
      date: '06/11/2025 16:45',
      id: 'TXN-2025-140',
      montant: '8 500 F',
      patient: 'Fatou Diop',
      modePaiement: 'Mobile Money',
      statut: 'Réussie',
      statutColor: '#10B981',
      statutBg: '#D1FAE5'
    },
    {
      date: '06/11/2025 15:20',
      id: 'TXN-2025-139',
      montant: '25 000 F',
      patient: 'Moussa Seck',
      modePaiement: 'Carte Bancaire',
      statut: 'Réussie',
      statutColor: '#10B981',
      statutBg: '#D1FAE5'
    },
    {
      date: '06/11/2025 14:10',
      id: 'TXN-2025-138',
      montant: '18 900 F',
      patient: 'Awa Diallo',
      modePaiement: 'Espèces',
      statut: 'En attente',
      statutColor: '#F59E0B',
      statutBg: '#FEF3C7'
    },
    {
      date: '06/11/2025 11:30',
      id: 'TXN-2025-137',
      montant: '42 000 F',
      patient: 'Ousmane Fall',
      modePaiement: 'Carte Bancaire',
      statut: 'Réussie',
      statutColor: '#10B981',
      statutBg: '#D1FAE5'
    },
    {
      date: '06/11/2025 09:15',
      id: 'TXN-2025-136',
      montant: '9 500 F',
      patient: 'Khady Sarr',
      modePaiement: 'Mobile Money',
      statut: 'Échouée',
      statutColor: '#EF4444',
      statutBg: '#FEE2E2'
    }
  ];

  transactionsFiltrees: Transaction[] = [];

  ngOnInit() {
    this.transactionsFiltrees = [...this.transactions];
  }

  onPeriodChange() {
    console.log('Période changée:', this.selectedPeriod);
    // Logique de filtrage par période
  }

  rechercherTransaction() {
    this.transactionsFiltrees = this.transactions.filter(t => 
      t.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      t.patient.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  filtrerParStatut() {
    console.log('Filtrer par statut:', this.selectedStatut);
    // Logique de filtrage par statut
  }

  filtrerParModePaiement() {
    console.log('Filtrer par mode de paiement:', this.selectedModePaiement);
    // Logique de filtrage par mode de paiement
  }

  exportData() {
    console.log('Export des transactions...');
    // Logique d'export
  }

  get totalPages(): number {
    return Math.ceil(this.transactionsFiltrees.length / this.itemsPerPage);
  }

  get paginatedTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.transactionsFiltrees.slice(start, end);
  }

  get displayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.transactionsFiltrees.length);
    return `${start} - ${end} sur ${this.transactionsFiltrees.length}`;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}