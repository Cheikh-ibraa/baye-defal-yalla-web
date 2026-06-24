import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-donor-budget-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './donor-budget-detail.component.html',
})
export class DonorBudgetDetailComponent implements OnInit {
  budget: any = null;
  isLoading = true;
  id = '';

  get stats() {
    const used = Number(this.budget?.usedAmount ?? 0);
    return {
      distribues:    used,
      ordonnances:   this.budget?.countOrdonnances  ?? Math.floor(used / 30000),
      analysesLabo:  this.budget?.countAnalyses     ?? Math.floor(used / 40000),
      patientsAides: this.budget?.patientsAides     ?? (Math.floor(used / 50000) || (used > 0 ? 1 : 0)),
    };
  }

  get repartitionGeo(): { commune: string; montant: number; pourcentage: number }[] {
    return this.budget?.repartitionGeographique ?? [];
  }

  get repartitionType(): { type: string; montant: number; count: number; pourcentage: number }[] {
    return this.budget?.repartitionParType ?? [];
  }

  get beneficiairesRecents(): any[] {
    return this.budget?.bénéficiairesRecents ?? [];
  }

  typeLabel(t: string): string {
    const map: Record<string, string> = {
      ORDONNANCE: 'Ordonnance', ANALYSE: 'Analyse', IMAGERIE: 'Imagerie', HOSPITALISATION: 'Hospitalisation',
    };
    return map[t] ?? t;
  }

  typeColor(t: string): string {
    const map: Record<string, string> = {
      ORDONNANCE: '#11458B', ANALYSE: '#2AB396', IMAGERIE: '#93C5FD', HOSPITALISATION: '#F59E0B',
    };
    return map[t] ?? '#6B7280';
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  private load(): void {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`${environment.baseUrl}/donor/budgets/${this.id}`, { headers }).subscribe({
      next: (res) => { this.budget = res; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  get usagePercent(): number {
    if (!this.budget) return 0;
    return this.budget.usagePercent ??
      (this.budget.amount > 0 ? Math.round((this.budget.usedAmount / this.budget.amount) * 100) : 0);
  }

  get remaining(): number {
    if (!this.budget) return 0;
    return this.budget.remaining ?? (this.budget.amount - this.budget.usedAmount);
  }

  formatAmount(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  formatDate(d: string): string {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  goBack(): void { this.router.navigate(['/donor/budget']); }

  editBudget(): void { this.router.navigate(['/donor/budget', this.id, 'edit']); }

  downloadReport(): void { alert('Fonctionnalité de téléchargement disponible prochainement.'); }
}
