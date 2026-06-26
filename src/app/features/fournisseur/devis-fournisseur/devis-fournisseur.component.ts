import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type DevisStatus = 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'DRAFT';

interface DevisCard {
  id: string;
  reference: string;
  requestId: string;
  institutionName: string;
  totalPrice: number;
  status: DevisStatus;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  items: any[];
  deliveryDays?: number;
  guarantee?: string;
  additionalNotes?: string;
  shippingCost?: number;
}

@Component({
  selector: 'app-devis-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devis-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevisFournisseurComponent implements OnInit {
  searchQuery = '';
  activeFilter: 'Tous' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DRAFT' = 'Tous';
  
  isLoading = true;
  error = '';
  allDevis: DevisCard[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDevis();
  }

  private get headers() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  loadDevis(): void {
    this.isLoading = true;
    this.error = '';
    
    this.http.get<DevisCard[]>(`${environment.baseUrl}/supplier/quotes`, {
      headers: this.headers
    }).subscribe({
      next: (devis) => {
        this.allDevis = devis;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des devis:', err);
        this.error = 'Impossible de charger les devis.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openDetail(id: string): void {
    this.router.navigate(['/fournisseur/devis', id]);
  }

  setFilter(filter: 'Tous' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DRAFT'): void {
    this.activeFilter = filter;
    this.cdr.markForCheck();
  }

  get filteredDevis(): DevisCard[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.allDevis.filter(d => {
      const matchesSearch = !q || 
        d.institutionName.toLowerCase().includes(q) || 
        d.reference.toLowerCase().includes(q);
      const matchesFilter = this.activeFilter === 'Tous' || d.status === this.activeFilter;
      return matchesSearch && matchesFilter;
    });
  }

  get countPending(): number {
    return this.allDevis.filter(d => d.status === 'PENDING').length;
  }

  get countAccepted(): number {
    return this.allDevis.filter(d => d.status === 'ACCEPTED').length;
  }

  get countRejected(): number {
    return this.allDevis.filter(d => d.status === 'REJECTED').length;
  }

  get countDraft(): number {
    return this.allDevis.filter(d => d.status === 'DRAFT').length;
  }

  statusBadgeClass(status: DevisStatus): string {
    switch (status) {
      case 'ACCEPTED': return 'bg-[#E6F4EA] text-[#137333]';
      case 'PENDING':  return 'bg-[#DBEAFE] text-[#104382]';
      case 'REJECTED': return 'bg-[#FCE8E6] text-[#C5221F]';
      case 'DRAFT':    return 'bg-[#F1F3F5] text-[#4E5166]';
    }
  }

  getStatusLabel(status: DevisStatus): string {
    switch (status) {
      case 'ACCEPTED': return 'Retenu';
      case 'PENDING':  return 'En attente';
      case 'REJECTED': return 'Non retenu';
      case 'DRAFT':    return 'Brouillon';
    }
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('fr-FR');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  }
}
