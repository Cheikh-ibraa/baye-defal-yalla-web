import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface FournisseurRow {
  id: string;
  nom: string;
  responsable: string;
  email: string;
  telephone: string;
  adresse: string;
  typeProduits: string;
  isActive: boolean;
  initials: string;
}

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseurs.component.html',
})
export class FournisseursComponent implements OnInit {
  private readonly api = environment.baseUrl;

  loading = false;
  loadError = '';
  searchTerm = '';
  itemsPerPage = 10;
  currentPage = 1;

  allFournisseurs: FournisseurRow[] = [];
  filteredFournisseurs: FournisseurRow[] = [];
  paginatedFournisseurs: FournisseurRow[] = [];
  totalPages = 1;

  togglingId: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.api}/admin/suppliers`).subscribe({
      next: (data) => {
        this.allFournisseurs = (data || []).map(f => this.mapRow(f));
        this.loading = false;
        this.filter();
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Impossible de charger les fournisseurs.';
      },
    });
  }

  private mapRow(f: any): FournisseurRow {
    const nom = f.companyName || f.nom || f.name || '';
    const words = nom.trim().split(/\s+/);
    const initials = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : nom.substring(0, 2).toUpperCase() || 'FO';
    return {
      id: f.id ?? f.keycloakId ?? '',
      nom,
      responsable: f.contactPerson || f.responsable || '',
      email: f.email || '',
      telephone: f.phone || f.telephone || '',
      adresse: f.address || f.adresse || '',
      typeProduits: f.productType || f.typeProduits || '',
      isActive: f.isActive ?? true,
      initials,
    };
  }

  filter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filteredFournisseurs = this.allFournisseurs.filter(f =>
      !q || f.nom.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.telephone.includes(q)
    );
    this.totalPages = Math.max(1, Math.ceil(this.filteredFournisseurs.length / this.itemsPerPage));
    this.currentPage = 1;
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedFournisseurs = this.filteredFournisseurs.slice(start, start + this.itemsPerPage);
  }

  get startItem(): number { return this.filteredFournisseurs.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem(): number   { return Math.min(this.currentPage * this.itemsPerPage, this.filteredFournisseurs.length); }

  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.paginate(); } }
  nextPage(): void     { if (this.currentPage < this.totalPages) { this.currentPage++; this.paginate(); } }

  toggleActive(f: FournisseurRow): void {
    if (this.togglingId) return;
    this.togglingId = f.id;
    const url = f.isActive
      ? `${this.api}/admin/suppliers/${f.id}/deactivate`
      : `${this.api}/admin/suppliers/${f.id}/activate`;
    this.http.patch(url, {}).subscribe({
      next: () => { f.isActive = !f.isActive; this.togglingId = null; },
      error: () => { this.togglingId = null; },
    });
  }

  goNew(): void { this.router.navigate(['/admin/fournisseurs/new']); }
}
