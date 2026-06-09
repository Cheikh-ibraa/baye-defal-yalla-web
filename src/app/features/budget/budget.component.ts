import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface BudgetEngagement {
  id: number;
  amount: string;
  status: 'Actif' | 'Terminé';
  createdDate: string;
  type: string;
  beneficiaries: string[];
  needs: string[];
  usedAmount?: string | null;
  remainingAmount?: string | null;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit {
  engagements: BudgetEngagement[] = [
    {
      id: 1,
      amount: '10 000 000 FCFA',
      status: 'Actif',
      createdDate: '15/01/2026',
      type: 'Mensuel',
      beneficiaries: ['Nouveau-nés', 'Personnes âgées'],
      needs: ['Analyses', 'Imagerie', 'Ordonnances'],
      usedAmount: '1 250 000 FCFA',
      remainingAmount: '3 750 000 FCFA'
    },
    {
      id: 2,
      amount: '5 000 000 FCFA',
      status: 'Actif',
      createdDate: '30/11/2025',
      type: 'Mensuel',
      beneficiaries: ['Nouveau-nés', 'Personnes âgées'],
      needs: ['Analyses', 'Imagerie', 'Ordonnances'],
      usedAmount: '1 250 000 FCFA',
      remainingAmount: '3 750 000 FCFA'
    },
    {
      id: 3,
      amount: '2 000 000 FCFA',
      status: 'Terminé',
      createdDate: '10/06/2025',
      type: 'Annuel',
      beneficiaries: ['Personnes âgées'],
      needs: ['Ordonnances'],
      usedAmount: null,
      remainingAmount: null
    }
  ];

  // Modal display states
  isModalOpen = false;
  modalStep: 'form' | 'summary' = 'form';

  // Form fields
  newAmount: number | null = null;
  newType: 'Mensuel' | 'Annuel' = 'Mensuel';
  newBeneficiaries: { [key: string]: boolean } = {
    'Nouveau-nés': true,
    'Personnes âgées': true
  };
  newNeeds: { [key: string]: boolean } = {
    'Analyses': true,
    'Imagerie': true,
    'Ordonnances': false
  };

  constructor() {}

  ngOnInit(): void {}

  openModal(): void {
    this.newAmount = null;
    this.newType = 'Mensuel';
    this.newBeneficiaries = {
      'Nouveau-nés': true,
      'Personnes âgées': true
    };
    this.newNeeds = {
      'Analyses': true,
      'Imagerie': true,
      'Ordonnances': false
    };
    this.modalStep = 'form';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  goToSummary(): void {
    if (!this.newAmount || this.newAmount <= 0) {
      alert('Veuillez entrer un montant valide supérieur à 0.');
      return;
    }
    this.modalStep = 'summary';
  }

  confirmBudget(): void {
    if (!this.newAmount || this.newAmount <= 0) return;

    const today = new Date();
    const formattedDate = this.formatDate(today);

    const newEngagement: BudgetEngagement = {
      id: Date.now(),
      amount: this.formatNumber(this.newAmount) + ' FCFA',
      status: 'Actif',
      createdDate: formattedDate,
      type: this.newType,
      beneficiaries: this.getBeneficiaryKeys(),
      needs: this.getNeedKeys(),
      usedAmount: '0 FCFA',
      remainingAmount: this.formatNumber(this.newAmount) + ' FCFA'
    };

    this.engagements = [newEngagement, ...this.engagements];
    this.closeModal();
  }

  getBeneficiaryKeys(): string[] {
    return Object.keys(this.newBeneficiaries).filter(k => this.newBeneficiaries[k]);
  }

  getNeedKeys(): string[] {
    return Object.keys(this.newNeeds).filter(k => this.newNeeds[k]);
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  formatNumber(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  parseAmount(amountStr: string): number {
    const cleaned = amountStr.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  }

  getTotalImpact(): string {
    const total = this.engagements
      .filter(e => e.status === 'Actif')
      .reduce((sum, e) => sum + this.parseAmount(e.amount), 0);
    return this.formatNumber(total) + ' FCFA';
  }

  getActiveEngagementsCount(): number {
    return this.engagements.filter(e => e.status === 'Actif').length;
  }
}

