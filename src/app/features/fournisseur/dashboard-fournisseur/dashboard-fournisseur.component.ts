import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard-fournisseur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFournisseurComponent implements OnInit {
  isLoading = true;

  totalDemandes  = 0;
  totalDevis     = 0;
  devisAccepted  = 0;
  devisRejected  = 0;
  devisPending   = 0;
  devisDraft     = 0;

  recentRequests: any[] = [];
  recentQuotes:   any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const h = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
    forkJoin({
      requests: this.http.get<any>(`${environment.baseUrl}/supplier/requests`, { headers: h, params: { limit: 5 } }),
      quotes:   this.http.get<any[]>(`${environment.baseUrl}/supplier/quotes`,  { headers: h }),
    }).subscribe({
      next: ({ requests, quotes }) => {
        const reqs = requests.data ?? requests ?? [];
        this.totalDemandes  = requests.total ?? reqs.length;
        this.totalDevis     = quotes.length;
        this.devisAccepted  = quotes.filter((q: any) => q.status === 'ACCEPTED').length;
        this.devisRejected  = quotes.filter((q: any) => q.status === 'REJECTED').length;
        this.devisPending   = quotes.filter((q: any) => q.status === 'PENDING').length;
        this.devisDraft     = quotes.filter((q: any) => q.isDraft || q.status === 'DRAFT').length;
        this.recentRequests = reqs.slice(0, 3);
        this.recentQuotes   = quotes.slice(0, 3);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  formatDate(d: string): string {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR');
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'ACCEPTED': return 'bg-[#E6F4EA] text-[#137333]';
      case 'PENDING':  return 'bg-[#DBEAFE] text-[#104382]';
      case 'REJECTED': return 'bg-[#FCE8E6] text-[#C5221F]';
      case 'DRAFT':    return 'bg-[#F1F3F5] text-[#4E5166]';
      default:         return 'bg-slate-100 text-slate-600';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { ACCEPTED: 'Retenu', PENDING: 'En attente', REJECTED: 'Non retenu', DRAFT: 'Brouillon' };
    return map[status] ?? status;
  }

  goToDemandes(): void { this.router.navigate(['/fournisseur/demandes']); }
  goToDevis():    void { this.router.navigate(['/fournisseur/devis']); }
  goToDevisDetail(id: string): void { this.router.navigate(['/fournisseur/devis', id]); }
  goToDemandeDetail(id: string): void { this.router.navigate(['/fournisseur/demandes', id]); }
}
