import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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

  // Retour paiement
  paymentStatus: 'success' | 'error' | null = null;
  paymentMessage = '';

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

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.handlePaymentReturn();
    this.load();
  }

  private handlePaymentReturn(): void {
    const params    = this.route.snapshot.queryParamMap;
    const errorCode = params.get('errorCode');
    const reference = params.get('reference');

    if (!errorCode && !reference) return;

    // Nettoyage de l'URL
    this.router.navigate([], { replaceUrl: true, queryParams: {} });

    if (errorCode === '200' && reference) {
      sessionStorage.removeItem('bdy_budget_ref');
      const transactionId = params.get('num_transaction_from_gu')
        ?? params.get('num_command') ?? '';
      this.http.post(
        `${environment.baseUrl}/payments/confirm`,
        { reference, transactionId },
        { headers: this.authHeaders },
      ).subscribe({
        next: () => {
          this.paymentStatus  = 'success';
          this.paymentMessage = 'Votre budget a été activé avec succès.';
        },
        error: () => {
          this.paymentStatus  = 'success';
          this.paymentMessage = 'Paiement reçu. Votre budget sera activé sous peu.';
        },
      });
    } else if (errorCode && errorCode !== '200') {
      sessionStorage.removeItem('bdy_budget_ref');
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

  payBudget(): void {
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

    const returnUrl = `${window.location.origin}/organization/budget`;

    const body = {
      amount:           this.newAmount,
      type:             this.newType,
      beneficiaryTypes: this.getBeneficiaryKeys(),
      medicalNeedTypes,
      returnUrl,
    };

    this.http.post<{ transactionId: string; paymentUrl: string }>(
      `${environment.baseUrl}/payments/initiate-budget`,
      body,
      { headers: this.authHeaders },
    ).subscribe({
      next: ({ transactionId, paymentUrl }) => {
        this.isSaving = false;
        sessionStorage.setItem('bdy_budget_ref', transactionId);
        window.location.href = paymentUrl;
      },
      error: (err: any) => {
        this.isSaving = false;
        const msg = err?.error?.message;
        alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la préparation du paiement.'));
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

  dismissPaymentStatus(): void {
    this.paymentStatus = null;
    this.paymentMessage = '';
    if (this.paymentStatus === 'success') this.load();
  }
}
