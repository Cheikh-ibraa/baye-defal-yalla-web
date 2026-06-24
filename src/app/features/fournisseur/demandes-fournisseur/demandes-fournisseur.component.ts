import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type FilterOption = 'Toutes' | 'EN_ATTENTE' | 'VALIDÉ' | 'URGENT';

interface DemandeFournisseur {
  id: string;
  hopital: string;
  categorie: string;
  status: string;
  createdAt: string;
  produitsCount: number;
  quotesCount: number;
  urgencyLevel: string;
  hasMyQuote: boolean;
}

@Component({
  selector: 'app-demandes-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demandes-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandesFournisseurComponent implements OnInit {
  isLoading = true;
  error = '';
  activeFilter: FilterOption = 'Toutes';
  demandes: DemandeFournisseur[] = [];

  readonly filters: FilterOption[] = ['Toutes', 'EN_ATTENTE', 'VALIDÉ', 'URGENT'];

  readonly filterLabels: Record<FilterOption, string> = {
    'Toutes':     'Toutes',
    'EN_ATTENTE': 'En attente',
    'VALIDÉ':     'Validé',
    'URGENT':     'Urgent',
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private get headers() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    const params: any = { limit: 50 };
    if (this.activeFilter !== 'Toutes') params.status = this.activeFilter;

    this.http.get<any>(`${environment.baseUrl}/supplier/requests`, {
      headers: this.headers,
      params,
    }).subscribe({
      next: (res) => {
        this.demandes = (res.data ?? []).map((r: any) => this.mapRequest(r));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger les demandes.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapRequest(r: any): DemandeFournisseur {
    return {
      id:           r.id,
      hopital:      r.institutionName ?? 'Établissement',
      categorie:    r.title ?? this.needTypeLabel(r.needType),
      status:       r.status,
      createdAt:    r.createdAt,
      produitsCount:(r.items ?? []).length,
      quotesCount:  r.quotesCount ?? 0,
      urgencyLevel: r.urgencyLevel,
      hasMyQuote:   !!r.myQuote,
    };
  }

  private needTypeLabel(type: string): string {
    const map: Record<string, string> = {
      ANALYSES:   'Analyses médicales',
      IMAGERIE:   'Imagerie',
      ORDONNANCE: 'Ordonnances',
      EQUIPEMENT: 'Équipement médical',
    };
    return map[type] ?? type;
  }

  setFilter(filter: FilterOption): void {
    this.activeFilter = filter;
    this.load();
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'VALIDÉ':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'EN_ATTENTE': return 'bg-[#DBEAFE] text-[#104382]';
      case 'URGENT':     return 'bg-[#FCE8E6] text-[#C5221F]';
      default:           return 'bg-[#F1F3F5] text-[#4E5166]';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      VALIDÉ:     'Validé',
      URGENT:     'Urgent',
    };
    return map[status] ?? status;
  }

  urgencyLabel(level: string): string {
    return level === 'URGENT' ? 'Urgent' : 'Normal';
  }

  formatDate(d: string): string {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  openDetail(id: string): void {
    this.router.navigate(['/fournisseur/demandes', id]);
  }
}
