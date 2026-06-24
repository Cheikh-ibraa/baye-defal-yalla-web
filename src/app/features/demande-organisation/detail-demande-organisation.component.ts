import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface FournisseurCard {
  id:              string;
  nom:             string;
  note:            number;
  avis:            number;
  prixTotal:       number;
  delaiLivraison:  string;
  dateReception:   string;
  statut:          string;
}

type KpiId = 'devis' | 'prix' | 'delai' | 'echeance';

interface KpiDetail {
  id:        KpiId;
  label:     string;
  value:     string | number;
  iconBg:    string;
  iconColor: string;
}

@Component({
  selector: 'app-detail-demande-organisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-demande-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDemandeOrganisationComponent implements OnInit {
  requestId: string | null = null;

  titre       = '—';
  description = '';
  fournisseurs: FournisseurCard[] = [];
  kpis: KpiDetail[] = [];

  isLoading = true;
  error: string | null = null;

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
    if (this.requestId) this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.http.get<any>(
      `${environment.baseUrl}/organization/requests/${this.requestId}/quotes`,
      { headers: this.authHeaders }
    ).subscribe({
      next: (res) => {
        const req = res.request ?? {};
        this.titre       = req.institutionName ?? 'Demande de matériels';
        this.description = req.description     ?? '';

        const bestPrice   = Number(res.bestPrice   ?? 0);
        const avgDelivery = Number(res.avgDelivery ?? 0);
        const quotesCount = Number(res.quotesCount ?? 0);

        let echeance = '—';
        if (res.deadline) {
          const d = new Date(res.deadline);
          echeance = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        }

        this.kpis = [
          { id: 'devis',    label: 'Devis reçus',    value: quotesCount,                    iconBg: 'bg-[#DCE1FF]',    iconColor: 'text-[#00339E]' },
          { id: 'prix',     label: 'Meilleur prix',  value: this.formatAmount(bestPrice),   iconBg: 'bg-[#00B894]',    iconColor: 'text-white'     },
          { id: 'delai',    label: 'Délai moyen',    value: avgDelivery ? `${avgDelivery}j` : '—', iconBg: 'bg-[#F39C121A]', iconColor: 'text-[#F39C12]' },
          { id: 'echeance', label: 'Échéance',       value: echeance,                       iconBg: 'bg-[#E2E1ED]',    iconColor: 'text-[#747686]' },
        ];

        this.fournisseurs = (res.quotes ?? []).map((q: any) => this.mapQuote(q));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger les devis.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapQuote(q: any): FournisseurCard {
    const d   = new Date(q.receivedAt);
    const rec = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    return {
      id:             q.id,
      nom:            q.supplierName,
      note:           Number(q.rating      ?? 0),
      avis:           Number(q.reviewCount ?? 0),
      prixTotal:      Number(q.totalPrice  ?? 0),
      delaiLivraison: q.deliveryDays ? `${q.deliveryDays} jour${q.deliveryDays > 1 ? 's' : ''}` : '—',
      dateReception:  rec,
      statut:         q.status,
    };
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' FCFA';
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      EN_REVISION:       'En révision',
      VALIDÉ_TECHNIQUE:  'Validé Technique',
      ATTENTE_SIGNATURE: 'Attente Signature',
      VALIDÉ:            'Validé',
      REJETÉ:            'Rejeté',
    };
    return m[s] ?? s;
  }

  statutClass(s: string): string {
    switch (s) {
      case 'VALIDÉ':
      case 'VALIDÉ_TECHNIQUE': return 'text-[#16A34A]';
      case 'EN_REVISION':      return 'text-[#475569]';
      case 'ATTENTE_SIGNATURE':return 'text-[#791C00]';
      case 'REJETÉ':           return 'text-[#DC2626]';
      default:                 return 'text-[#475569]';
    }
  }

  statutIconType(s: string): 'check' | 'clock' | 'warning' {
    if (s === 'VALIDÉ' || s === 'VALIDÉ_TECHNIQUE') return 'check';
    if (s === 'EN_REVISION') return 'clock';
    return 'warning';
  }

  openDevis(quoteId: string): void {
    if (!this.requestId) return;
    this.router.navigate(['/organization/demande', this.requestId, 'devis', quoteId]);
  }

  back(): void {
    this.router.navigate(['/organization/demande']);
  }
}
