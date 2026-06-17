import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type FilterOption = 'Toutes' | 'En attente' | 'Validé' | 'Urgent';

interface DemandeCard {
  id: string;
  hopital: string;
  categorie: string;
  status: 'En attente' | 'Validé' | 'Urgent';
  budgetEstime: number;
  devisRecus: number;
  iconKey: 'hospital' | 'star' | 'lab';
}

@Component({
  selector: 'app-demande-organisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandeOrganisationComponent implements OnInit {
  activeFilter: FilterOption = 'Toutes';
  readonly filters: FilterOption[] = ['Toutes', 'En attente', 'Validé', 'Urgent'];

  allDemandes: DemandeCard[] = [];
  isLoading = true;
  error: string | null = null;

  totalDemandes = 0;
  totalDevis    = 0;
  devisValides  = 0;

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  constructor(
    private router: Router,
    private http:   HttpClient,
    private cdr:    ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.isLoading = true;
    this.http.get<any>(
      `${environment.baseUrl}/organization/requests?limit=50`,
      { headers: this.authHeaders }
    ).subscribe({
      next: (res) => {
        const data: any[] = res.data ?? res ?? [];
        this.allDemandes  = data.map(r => this.mapRequest(r));
        this.totalDemandes = res.total ?? data.length;
        this.totalDevis    = data.reduce((s, r) => s + (Number(r.quotesCount) || 0), 0);
        this.devisValides  = data.filter(r => r.status === 'VALIDÉ').length;
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

  private mapRequest(r: any): DemandeCard {
    const statusMap: Record<string, 'En attente' | 'Validé' | 'Urgent'> = {
      EN_ATTENTE: 'En attente',
      VALIDÉ:     'Validé',
      URGENT:     'Urgent',
    };
    const iconMap: Record<string, 'hospital' | 'star' | 'lab'> = {
      EQUIPEMENT: 'hospital',
      IMAGERIE:   'star',
      ANALYSES:   'lab',
      ORDONNANCE: 'hospital',
    };
    return {
      id:          r.id,
      hopital:     r.institutionName ?? 'Institution',
      categorie:   this.needLabel(r.needType),
      status:      statusMap[r.status] ?? 'En attente',
      budgetEstime: Number(r.estimatedBudget ?? 0),
      devisRecus:  Number(r.quotesCount ?? 0),
      iconKey:     iconMap[r.needType] ?? 'hospital',
    };
  }

  private needLabel(t: string): string {
    const m: Record<string, string> = {
      EQUIPEMENT: 'Équipement médical',
      IMAGERIE:   'Imagerie médicale',
      ANALYSES:   'Analyses de laboratoire',
      ORDONNANCE: 'Ordonnances',
    };
    return m[t] ?? t ?? '—';
  }

  get filteredDemandes(): DemandeCard[] {
    if (this.activeFilter === 'Toutes') return this.allDemandes;
    return this.allDemandes.filter(d => d.status === this.activeFilter);
  }

  setFilter(f: FilterOption): void { this.activeFilter = f; }

  statusBadgeClass(s: string): string {
    switch (s) {
      case 'Validé':      return 'bg-[#E6F4EA] text-[#137333]';
      case 'En attente':  return 'bg-[#EEF4FF] text-[#104382]';
      case 'Urgent':      return 'bg-[#FCE8E6] text-[#C5221F]';
      default:            return 'bg-gray-100 text-gray-600';
    }
  }

  iconBgClass(k: string): string {
    switch (k) {
      case 'hospital': return 'bg-[#EEF4FF] text-[#104382]';
      case 'star':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'lab':      return 'bg-[#FCE8E6] text-[#C5221F]';
      default:         return 'bg-[#EEF4FF] text-[#104382]';
    }
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' FCFA';
  }

  openDetail(id: string): void {
    this.router.navigate(['/organization/demande', id]);
  }

  openDevis(id: string): void {
    this.router.navigate(['/organization/demande', id]);
  }
}
