import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-detail-devis-organisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-devis-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDevisOrganisationComponent implements OnInit {
  requestId: string | null = null;
  quoteId:   string | null = null;
  quote:     any = null;

  isLoading   = true;
  error:      string | null = null;
  isValidating = false;
  validated   = false;

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
    private cdr:    ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id');
    this.quoteId   = this.route.snapshot.paramMap.get('quoteId');
    if (this.requestId && this.quoteId) this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.http.get<any>(
      `${environment.baseUrl}/organization/requests/${this.requestId}/quotes/${this.quoteId}`,
      { headers: this.authHeaders }
    ).subscribe({
      next: (res) => {
        this.quote = res;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger ce devis.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  validate(): void {
    if (!this.requestId || !this.quoteId) return;
    this.isValidating = true;
    this.http.post<any>(
      `${environment.baseUrl}/organization/requests/${this.requestId}/quotes/${this.quoteId}/validate`,
      {},
      { headers: this.authHeaders }
    ).subscribe({
      next: () => {
        this.validated   = true;
        this.isValidating = false;
        this.cdr.markForCheck();
      },
      error: () => {
        alert('Erreur lors de la validation. Veuillez réessayer.');
        this.isValidating = false;
        this.cdr.markForCheck();
      },
    });
  }

  get timeline() {
    const q = this.quote;
    if (!q) return [];
    const d   = new Date(q.receivedAt);
    const rec = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    const steps: { label: string; date: string; status: 'done' | 'active' | 'upcoming'; icon: 'check' | 'user' | 'doc' }[] = [
      { label: 'Demande envoyée', date: '—',  status: 'done',   icon: 'check' },
      { label: 'Devis reçu',     date: rec,  status: 'done',   icon: 'check' },
    ];

    if (q.status === 'VALIDÉ') {
      steps.push({ label: 'Validé',                date: '—', status: 'done',     icon: 'check' });
    } else if (q.status === 'VALIDÉ_TECHNIQUE') {
      steps.push({ label: 'Validation Technique',  date: '—', status: 'active',   icon: 'user'  });
      steps.push({ label: 'Signature',             date: '',  status: 'upcoming', icon: 'doc'   });
    } else if (q.status === 'ATTENTE_SIGNATURE') {
      steps.push({ label: 'Validé Technique',      date: '—', status: 'done',     icon: 'check' });
      steps.push({ label: 'En attente signature',  date: '',  status: 'active',   icon: 'user'  });
    } else if (q.status === 'REJETÉ') {
      steps.push({ label: 'Rejeté',                date: '—', status: 'done',     icon: 'check' });
    } else {
      steps.push({ label: 'Validation',            date: '',  status: 'active',   icon: 'user'  });
      steps.push({ label: 'Organisation',          date: '',  status: 'upcoming', icon: 'doc'   });
    }
    return steps;
  }

  get collab() {
    const c = this.quote?.collaborationHistory;
    if (!c) return null;
    const amount = c.lastOrderAmount ? ' — ' + this.formatAmount(c.lastOrderAmount) : '';
    return {
      derniereCommande: c.lastOrderDate ? `${c.lastOrderDate}${amount}` : '—',
      tauxLivraison:    c.onTimeDeliveryRate != null ? `${c.onTimeDeliveryRate}%` : '—',
      evaluation:       Number(c.qualityRating ?? 0),
    };
  }

  stars(n: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(n ?? 0));
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' FCFA';
  }

  stepIconBg(status: 'done' | 'active' | 'upcoming'): string {
    switch (status) {
      case 'done':     return 'bg-[#059669] text-white';
      case 'active':   return 'bg-[#1E3A6E] text-white';
      case 'upcoming': return 'bg-[#E2E8F0] text-[#94A3B8]';
    }
  }

  back(): void {
    this.router.navigate(['/organization/demande', this.requestId]);
  }
}
