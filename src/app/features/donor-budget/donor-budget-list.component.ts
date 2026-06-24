import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

  paymentStatus: 'success' | 'error' | null = null;
  paymentMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.handlePaymentReturn();
    this.loadBudgets();
  }

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  private handlePaymentReturn(): void {
    const params    = this.route.snapshot.queryParamMap;
    const errorCode = params.get('errorCode');
    const reference = params.get('reference');

    if (!errorCode && !reference) return;

    this.router.navigate([], { replaceUrl: true, queryParams: {} });

    if (errorCode === '200' && reference) {
      sessionStorage.removeItem('bdy_pending_ref');
      const transactionId = params.get('num_transaction_from_gu')
        ?? params.get('num_command') ?? '';
      this.http.post(
        `${environment.baseUrl}/payments/confirm`,
        { reference, transactionId },
        { headers: this.authHeaders },
      ).subscribe({
        next: () => {
          this.paymentStatus  = 'success';
          this.paymentMessage = 'Votre budget solidaire a été activé avec succès !';
          this.loadBudgets();
        },
        error: () => {
          this.paymentStatus  = 'success';
          this.paymentMessage = 'Paiement reçu. Votre budget sera activé sous peu.';
        },
      });
    } else if (errorCode && errorCode !== '200') {
      sessionStorage.removeItem('bdy_pending_ref');
      if (reference) {
        this.http.post(
          `${environment.baseUrl}/payments/cancel`,
          { reference },
          { headers: this.authHeaders },
        ).subscribe();
      }
      this.paymentStatus  = 'error';
      this.paymentMessage = 'Paiement annulé ou refusé. Veuillez réessayer.';
    }
  }

  loadBudgets(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<any>(`${environment.baseUrl}/donor/budgets`, { headers: this.authHeaders }).subscribe({
      next: (res) => {
        this.budgets      = res.budgets ?? [];
        this.totalBudgets = this.budgets.length;
        this.totalEngaged = Number(res.totalAllocated ?? 0);
        this.totalRestant = this.totalEngaged - Number(res.totalUsed ?? 0);
        this.isLoading    = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos budgets. Veuillez réessayer.';
        this.isLoading = false;
      },
    });
  }

  usagePercent(b: Budget): number {
    return b.amount > 0 ? Math.round((b.usedAmount / b.amount) * 100) : 0;
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR');
  }

  openDetail(id: string): void {
    this.router.navigate(['/donor/budget', id]);
  }

  createBudget(): void {
    this.router.navigate(['/donor/budget/new']);
  }
}
