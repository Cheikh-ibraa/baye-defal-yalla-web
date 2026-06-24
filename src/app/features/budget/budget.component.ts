import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface BudgetEngagement {
  id: string;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  status: 'ACTIF' | 'TERMINÉ';
  createdDate: string;
  type: string;
  beneficiaries: string[];
  needs: string[];
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit {
  engagements: BudgetEngagement[] = [];
  isLoading = true;
  error: string | null = null;
  isSaving = false;

  totalAllocated = 0;
  totalUsed      = 0;
  livesImpacted  = 0;

  // Modal
  isModalOpen = false;
  modalStep: 'form' | 'summary' = 'form';

  // Form fields
  newAmount: number | null = null;
  newType: 'MENSUEL' | 'ANNUEL' = 'MENSUEL';
  newBeneficiaries: { [key: string]: boolean } = {
    'Tous': true,
    'Nouveau-nés': false,
    'Enfants': false,
    'Adultes': false,
    'Personnes âgées': false,
  };
  newNeeds: { [key: string]: boolean } = {
    'Analyses': true,
    'Imagerie': true,
    'Ordonnances': false,
  };

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;
    this.http.get<any>(
      `${environment.baseUrl}/organization/budgets`,
      { headers: this.authHeaders }
    ).subscribe({
      next: (res) => {
        this.totalAllocated = Number(res.totalAllocated ?? 0);
        this.totalUsed      = Number(res.totalUsed      ?? 0);
        this.livesImpacted  = Number(res.livesImpacted  ?? 0);
        this.engagements    = (res.budgets ?? []).map((b: any) => this.mapBudget(b));
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les engagements.';
        this.isLoading = false;
      },
    });
  }

  private mapBudget(b: any): BudgetEngagement {
    const amount  = Number(b.amount ?? 0);
    const used    = Number(b.usedAmount ?? 0);
    const date    = new Date(b.createdAt);
    const dd      = date.getDate().toString().padStart(2, '0');
    const mm      = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy    = date.getFullYear();
    return {
      id:              b.id,
      amount,
      usedAmount:      used,
      remainingAmount: Math.max(0, amount - used),
      status:          b.status === 'ACTIF' ? 'ACTIF' : 'TERMINÉ',
      createdDate:     `${dd}/${mm}/${yyyy}`,
      type:            b.type === 'ANNUEL' ? 'Annuel' : 'Mensuel',
      beneficiaries:   b.beneficiaryTypes  ?? [],
      needs:           (b.medicalNeedTypes ?? []).map((n: string) => this.needLabel(n)),
    };
  }

  private needLabel(n: string): string {
    const map: Record<string, string> = {
      ANALYSE:     'Analyses',
      IMAGERIE:    'Imagerie',
      ORDONNANCE:  'Ordonnances',
      EQUIPEMENT:  'Équipements',
    };
    return map[n] ?? n;
  }

  // ── Modal ────────────────────────────────────────────────────────────────────

  openModal(): void {
    this.newAmount = null;
    this.newType   = 'MENSUEL';
    this.newBeneficiaries = { 'Tous': true, 'Nouveau-nés': false, 'Enfants': false, 'Adultes': false, 'Personnes âgées': false };
    this.newNeeds         = { 'Analyses': true, 'Imagerie': true, 'Ordonnances': false };
    this.modalStep = 'form';
    this.isModalOpen = true;
  }

  closeModal(): void { this.isModalOpen = false; }

  goToSummary(): void {
    if (!this.newAmount || this.newAmount <= 0) {
      alert('Veuillez entrer un montant valide supérieur à 0.');
      return;
    }
    this.modalStep = 'summary';
  }

  confirmBudget(): void {
    if (!this.newAmount || this.newAmount <= 0) return;
    this.isSaving = true;

    const medicalNeedTypes = this.getNeedKeys().map(n => {
      const map: Record<string, string> = {
        'Analyses':    'ANALYSE',
        'Imagerie':    'IMAGERIE',
        'Ordonnances': 'ORDONNANCE',
      };
      return map[n] ?? n.toUpperCase();
    });

    const dto = {
      amount:           this.newAmount,
      type:             this.newType,
      beneficiaryTypes: this.getBeneficiaryKeys(),
      medicalNeedTypes,
    };

    this.http.post<any>(
      `${environment.baseUrl}/organization/budgets`,
      dto,
      { headers: this.authHeaders }
    ).subscribe({
      next: (created) => {
        this.engagements = [this.mapBudget(created), ...this.engagements];
        this.totalAllocated += this.newAmount!;
        this.isSaving = false;
        this.closeModal();
      },
      error: () => {
        alert("Erreur lors de la création du budget. Veuillez réessayer.");
        this.isSaving = false;
      },
    });
  }

  getBeneficiaryKeys(): string[] {
    return Object.keys(this.newBeneficiaries).filter(k => this.newBeneficiaries[k]);
  }

  getNeedKeys(): string[] {
    return Object.keys(this.newNeeds).filter(k => this.newNeeds[k]);
  }

  // ── Display helpers ──────────────────────────────────────────────────────────

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR');
  }

  getTotalImpact(): string {
    return this.formatAmount(this.totalAllocated) + ' FCFA';
  }

  getActiveCount(): number {
    return this.engagements.filter(e => e.status === 'ACTIF').length;
  }
}
