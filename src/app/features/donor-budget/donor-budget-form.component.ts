import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare function sendPaymentInfos(
  timestamp: number, agencyCode: string, token: string, serviceId: string,
  callbackUrl: string, returnUrl: string, amount: number, city: string,
  p1: string, p2: string, p3: string, p4: string,
): void;

@Component({
  selector: 'app-donor-budget-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './donor-budget-form.component.html',
})
export class DonorBudgetFormComponent implements OnInit {
  isEdit = false;
  budgetId = '';
  isLoading = false;
  isSaving = false;
  error = '';
  success = false;

  existingAmount = 0;
  existingUsed   = 0;

  name         = '';
  amount       = 0;
  region       = '';
  department   = '';
  commune      = '';
  urgencyLevel = '';
  duration     = '';
  selectedPathologies: string[] = [];
  selectedBeneficiaries: string[] = [];

  regions = ['Dakar', 'Thiès', 'Saint-Louis', 'Louga', 'Kaolack', 'Ziguinchor',
             'Diourbel', 'Fatick', 'Kolda', 'Tambacounda', 'Kaffrine', 'Kédougou', 'Matam', 'Sédhiou'];

  pathologiesOptions = ['Cancer', 'Diabète', 'Cardiologie', 'Néphrologie', 'Pédiatrie', 'Hypertension', 'Paludisme', 'Tuberculose'];

  beneficiariesOptions = [
    { key: 'Tous',    icon: '👥' },
    { key: 'Enfants', icon: '🧒' },
    { key: 'Hommes',  icon: '👨' },
    { key: 'Femmes',  icon: '👩' },
    { key: 'Aînés',   icon: '👴' },
  ];

  urgencyLevels = ['Faible', 'Moyen', 'Élevé', 'Critique'];
  durations     = ['1 mois', '3 mois', '6 mois', 'Illimité'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.budgetId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit   = !!this.budgetId;
    if (this.isEdit) this.loadExisting();
    else this.handlePaymentReturn();
  }

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  private handlePaymentReturn(): void {
    const params    = this.route.snapshot.queryParamMap;
    const errorCode = params.get('errorCode');
    const reference = params.get('reference');

    if (!reference && !errorCode) return;

    if (errorCode === '200' && reference) {
      sessionStorage.removeItem('bdy_pending_ref');
      const transactionId = params.get('num_transaction_from_gu')
        ?? params.get('num_command') ?? '';
      this.http.post(
        `${environment.baseUrl}/payments/confirm`,
        { reference, transactionId },
        { headers: this.authHeaders },
      ).subscribe({
        next:  () => this.router.navigate(['/donor/budget']),
        error: () => this.router.navigate(['/donor/budget']),
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
      this.error = 'Paiement annulé ou refusé. Veuillez réessayer.';
    }
  }

  private loadExisting(): void {
    this.isLoading = true;
    this.http.get<any>(`${environment.baseUrl}/donor/budgets/${this.budgetId}`, { headers: this.authHeaders }).subscribe({
      next: (b) => {
        this.name          = b.name ?? '';
        this.amount        = Number(b.amount);
        this.region        = b.region ?? '';
        this.department    = b.department ?? '';
        this.commune       = b.commune ?? '';
        this.urgencyLevel  = b.urgencyLevel ?? '';
        this.selectedPathologies   = b.pathologies ?? [];
        this.selectedBeneficiaries = b.beneficiaryTypes ?? [];
        this.existingAmount = Number(b.amount);
        this.existingUsed   = Number(b.usedAmount);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  togglePathologie(p: string): void {
    const idx = this.selectedPathologies.indexOf(p);
    idx >= 0 ? this.selectedPathologies.splice(idx, 1) : this.selectedPathologies.push(p);
  }

  toggleBeneficiary(b: string): void {
    if (b === 'Tous') { this.selectedBeneficiaries = ['Tous']; return; }
    const idx = this.selectedBeneficiaries.indexOf(b);
    this.selectedBeneficiaries = this.selectedBeneficiaries.filter(x => x !== 'Tous');
    idx >= 0 ? this.selectedBeneficiaries.splice(idx, 1) : this.selectedBeneficiaries.push(b);
  }

  isPSelected(p: string): boolean { return this.selectedPathologies.includes(p); }
  isBSelected(b: string): boolean { return this.selectedBeneficiaries.includes(b); }

  addAmount(n: number): void { this.amount = (this.amount || 0) + n; }

  get estimatedImpact() {
    const a = this.amount || 0;
    return {
      beneficiaires: a > 200000 ? '8–12' : a > 100000 ? '4–6' : '1–3',
      ordonnances:   Math.floor(a / 30000),
      analyses:      Math.floor(a / 40000),
      structures:    Math.floor(a / 150000) || 1,
    };
  }

  get usagePercent(): number {
    return this.existingAmount > 0 ? Math.round((this.existingUsed / this.existingAmount) * 100) : 0;
  }

  canSubmit(): boolean {
    return this.amount > 0 && this.region.length > 0 && this.urgencyLevel.length > 0;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.isSaving = true;
    this.error    = '';

    // Mode édition : mise à jour simple sans paiement
    if (this.isEdit) {
      const payload = {
        name:             this.name || undefined,
        amount:           this.amount,
        region:           this.region || undefined,
        department:       this.department || undefined,
        commune:          this.commune || undefined,
        urgencyLevel:     this.urgencyLevel || undefined,
        pathologies:      this.selectedPathologies.length ? this.selectedPathologies : undefined,
        beneficiaryTypes: this.selectedBeneficiaries.length ? this.selectedBeneficiaries : undefined,
      };
      this.http.patch(`${environment.baseUrl}/donor/budgets/${this.budgetId}`, payload, { headers: this.authHeaders })
        .subscribe({
          next: () => { this.isSaving = false; this.router.navigate(['/donor/budget']); },
          error: (err: any) => {
            this.isSaving = false;
            const msg = err?.error?.message;
            this.error = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Une erreur est survenue.');
          },
        });
      return;
    }

    // Mode création : préparer le paiement TouchPay puis ouvrir le widget
    if (typeof sendPaymentInfos !== 'function') {
      this.isSaving = false;
      this.error = 'Le module de paiement n\'est pas chargé. Rechargez la page.';
      return;
    }

    const budgetData = {
      name:             this.name || undefined,
      amount:           this.amount,
      region:           this.region || undefined,
      department:       this.department || undefined,
      commune:          this.commune || undefined,
      urgencyLevel:     this.urgencyLevel || undefined,
      pathologies:      this.selectedPathologies.length ? this.selectedPathologies : undefined,
      beneficiaryTypes: this.selectedBeneficiaries.length ? this.selectedBeneficiaries : undefined,
    };

    this.http.post<{ reference: string }>(
      `${environment.baseUrl}/payments/prepare-budget`,
      budgetData,
      { headers: this.authHeaders },
    ).subscribe({
      next: ({ reference }) => {
        this.isSaving = false;
        const tp        = environment.touchpay;
        const returnUrl = `${window.location.origin}/donor/budget/new?reference=${encodeURIComponent(reference)}`;
        sessionStorage.setItem('bdy_pending_ref', reference);
        try {
          sendPaymentInfos(
            Date.now(), tp.agencyCode, tp.token, tp.serviceId,
            returnUrl, returnUrl,
            this.amount, 'Dakar',
            reference, '', '', '',
          );
        } catch (e: any) {
          this.error = `Erreur TouchPay : ${e?.message ?? 'inconnu'}`;
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        const msg = err?.error?.message;
        this.error = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la préparation du paiement.');
      },
    });
  }

  goBack(): void {
    this.isEdit
      ? this.router.navigate(['/donor/budget', this.budgetId])
      : this.router.navigate(['/donor/budget']);
  }
}
