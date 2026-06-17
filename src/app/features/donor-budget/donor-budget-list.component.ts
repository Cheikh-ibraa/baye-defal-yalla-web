import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../../environments/environment';
interface Budget {
  id: string;
  name: string;
  amount: number;
  usedAmount: number;
  status: 'ACTIF' | 'TERMINÉ';
  region?: string;
  pathologies?: string[];
  beneficiaryTypes?: string[];
  urgencyLevel?: string;
  endDate?: string;
  createdAt: string;
}

@Component({
  selector: 'app-donor-budget-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './donor-budget-list.component.html',
})
export class DonorBudgetListComponent implements OnInit {
  budgets: Budget[] = [];
  isLoading = true;
  error: string | null = null;

  totalBudgets = 0;
  totalEngaged = 0;
  totalRestant = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadBudgets();
  }

  private loadBudgets(): void {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`${environment.baseUrl}/donor/budgets`, { headers }).subscribe({
      next: (res) => {
        this.budgets      = res.budgets ?? [];
        this.totalBudgets = this.budgets.length;
        this.totalEngaged = res.totalAllocated ?? 0;
        this.totalRestant = this.totalEngaged - (res.totalUsed ?? 0);
        this.isLoading    = false;
      },
      error: () => {
        this.budgets = STATIC_BUDGETS;
        this.computeStats();
        this.isLoading = false;
      },
    });
  }

  private computeStats(): void {
    this.totalBudgets = this.budgets.length;
    this.totalEngaged = this.budgets.reduce((s, b) => s + b.amount, 0);
    this.totalRestant = this.budgets.reduce((s, b) => s + (b.amount - b.usedAmount), 0);
  }

  usagePercent(b: Budget): number {
    return b.amount > 0 ? Math.round((b.usedAmount / b.amount) * 100) : 0;
  }

  formatAmount(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  openDetail(id: string): void {
    this.router.navigate(['/donor/budget', id]);
  }

  createBudget(): void {
    this.router.navigate(['/donor/budget/new']);
  }
}

const STATIC_BUDGETS: Budget[] = [
  {
    id: '1',
    name: 'Budget Solidarité Cancer – Dakar',
    amount: 500000,
    usedAmount: 200000,
    status: 'ACTIF',
    region: 'Dakar',
    pathologies: ['Cancer', 'Diabète', 'Cardiologie'],
    beneficiaryTypes: ['Enfants', 'Femmes'],
    urgencyLevel: 'Élevé',
    endDate: '2026-12-31',
    createdAt: '2026-01-01',
  },
  {
    id: '2',
    name: 'Soutien Diabète – Saint-Louis',
    amount: 450000,
    usedAmount: 100000,
    status: 'ACTIF',
    region: 'Saint-Louis',
    pathologies: ['Diabète'],
    beneficiaryTypes: ['Jeunes'],
    urgencyLevel: 'Moyen',
    endDate: '2026-09-30',
    createdAt: '2026-02-01',
  },
  {
    id: '3',
    name: 'Urgence Cardio – Thiès',
    amount: 300000,
    usedAmount: 300000,
    status: 'TERMINÉ',
    region: 'Thiès',
    pathologies: ['Cardiologie'],
    beneficiaryTypes: ['Séniors'],
    urgencyLevel: 'Critique',
    createdAt: '2025-10-01',
  },
];
