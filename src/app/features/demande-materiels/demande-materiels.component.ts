import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SENEGAL_REGIONS, SenegalDepartement } from '../../shared/data/senegal-admin.data';

const BASE = environment.baseUrl;

type DemandeStatus = 'EN_ATTENTE' | 'VALIDÉ' | 'URGENT';

interface DemandeMateriel {
  id: string;
  title: string;
  createdAt: string;
  quotesCount: number;
  status: DemandeStatus;
}

interface Fournisseur {
  keycloakId: string;
  companyName: string;
  city?: string;
  rating?: number;
  productType?: string;
}

interface ProductItem {
  nom: string;
  quantite: number;
  unite: string;
}

@Component({
  selector: 'app-demande-materiels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-materiels.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemandeMaterielComponent implements OnInit {

  loading    = false;
  submitting = false;
  showModal  = false;
  submitError   = '';
  submitSuccess = false;

  demandes: DemandeMateriel[] = [];
  totalDemandes = 0;

  fournisseurs: Fournisseur[] = [];
  selectedSupplierIds: string[] = [];

  // Form fields
  institutionName = '';
  nomDemande   = '';
  description  = '';
  urgencyLevel = 'Urgent';

  // Lieu de livraison — cascading autocomplete
  lieuRegion      = '';
  lieuDepartement = '';
  lieuCommune     = '';

  // Autocomplete state
  regionSearch    = '';
  deptSearch      = '';
  communeSearch   = '';
  showRegionDD    = false;
  showDeptDD      = false;
  showCommuneDD   = false;

  readonly allRegions = SENEGAL_REGIONS;

  get filteredRegions() {
    const q = this.regionSearch.toLowerCase();
    return this.allRegions.filter(r => r.nom.toLowerCase().includes(q));
  }

  get currentDepts(): SenegalDepartement[] {
    const reg = this.allRegions.find(r => r.nom === this.lieuRegion);
    return reg?.departements ?? [];
  }

  get filteredDepts(): SenegalDepartement[] {
    const q = this.deptSearch.toLowerCase();
    return this.currentDepts.filter(d => d.nom.toLowerCase().includes(q));
  }

  get currentCommunes(): string[] {
    const dept = this.currentDepts.find(d => d.nom === this.lieuDepartement);
    return dept?.communes ?? [];
  }

  get filteredCommunes(): string[] {
    const q = this.communeSearch.toLowerCase();
    return this.currentCommunes.filter(c => c.toLowerCase().includes(q));
  }

  selectRegion(nom: string): void {
    this.lieuRegion      = nom;
    this.regionSearch    = nom;
    this.lieuDepartement = '';
    this.deptSearch      = '';
    this.lieuCommune     = '';
    this.communeSearch   = '';
    this.showRegionDD    = false;
    this.cdr.markForCheck();
  }

  selectDept(nom: string): void {
    this.lieuDepartement = nom;
    this.deptSearch      = nom;
    this.lieuCommune     = '';
    this.communeSearch   = '';
    this.showDeptDD      = false;
    this.cdr.markForCheck();
  }

  selectCommune(nom: string): void {
    this.lieuCommune    = nom;
    this.communeSearch  = nom;
    this.showCommuneDD  = false;
    this.cdr.markForCheck();
  }

  onRegionInput(): void {
    this.lieuRegion      = '';
    this.lieuDepartement = '';
    this.deptSearch      = '';
    this.lieuCommune     = '';
    this.communeSearch   = '';
    this.showRegionDD    = true;
    this.cdr.markForCheck();
  }

  onDeptInput(): void {
    this.lieuDepartement = '';
    this.lieuCommune     = '';
    this.communeSearch   = '';
    this.showDeptDD      = true;
    this.cdr.markForCheck();
  }

  onCommuneInput(): void {
    this.lieuCommune   = '';
    this.showCommuneDD = true;
    this.cdr.markForCheck();
  }

  closeAllDropdowns(): void {
    setTimeout(() => {
      this.showRegionDD  = false;
      this.showDeptDD    = false;
      this.showCommuneDD = false;
      this.cdr.markForCheck();
    }, 180);
  }

  products: ProductItem[] = [{ nom: '', quantite: 50, unite: 'Boites' }];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFromProfile();
    this.loadAll();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private loadFromProfile(): void {
    const raw = localStorage.getItem('user_profile');
    if (raw) {
      try {
        const p = JSON.parse(raw);
        this.institutionName = p.institutionName ?? p.organizationName ?? p.name ?? '';
      } catch { /* ignore */ }
    }
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      demandes: this.http.get<{ data: DemandeMateriel[]; total: number }>(
        `${BASE}/hospital/material-requests`, { headers: this.headers() }),
      suppliers: this.http.get<Fournisseur[]>(
        `${BASE}/hospital/suppliers`, { headers: this.headers() }),
    }).subscribe({
      next: ({ demandes, suppliers }) => {
        this.demandes      = demandes.data;
        this.totalDemandes = demandes.total;
        this.fournisseurs  = suppliers;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  get totalCount()  { return this.totalDemandes; }
  get attenteCount(){ return this.demandes.filter(d => d.status === 'EN_ATTENTE').length; }
  get devisCount()  { return this.demandes.filter(d => d.status === 'VALIDÉ' || d.quotesCount > 0).length; }

  openDetail(id: string): void {
    this.router.navigate(['/hospital/demande-materiels', id]);
  }

  statusClass(status: DemandeStatus): string {
    if (status === 'EN_ATTENTE') return 'bg-[#F39C121A] text-[#F39C12]';
    if (status === 'URGENT')     return 'bg-red-100 text-red-600';
    return 'bg-[#00B8941A] text-[#00B894]';
  }

  statusLabel(d: DemandeMateriel): string {
    if (d.status === 'VALIDÉ') return `Devis reçus (${d.quotesCount})`;
    if (d.status === 'URGENT') return 'Urgent';
    return 'En attente';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  openModal(): void {
    this.nomDemande          = 'Commande médicaux';
    this.description         = '';
    this.urgencyLevel        = 'Urgent';
    this.lieuRegion          = '';
    this.lieuDepartement     = '';
    this.lieuCommune         = '';
    this.regionSearch        = '';
    this.deptSearch          = '';
    this.communeSearch       = '';
    this.showRegionDD        = false;
    this.showDeptDD          = false;
    this.showCommuneDD       = false;
    this.products            = [{ nom: 'Gants', quantite: 50, unite: 'Boites' }];
    this.selectedSupplierIds = this.fournisseurs.slice(0, 2).map(f => f.keycloakId);
    this.submitError         = '';
    this.submitSuccess       = false;
    this.showModal           = true;
    this.cdr.markForCheck();
  }

  closeModal(): void { this.showModal = false; this.cdr.markForCheck(); }

  toggleSupplier(id: string): void {
    if (this.selectedSupplierIds.includes(id)) {
      this.selectedSupplierIds = this.selectedSupplierIds.filter(s => s !== id);
    } else {
      this.selectedSupplierIds = [...this.selectedSupplierIds, id];
    }
    this.cdr.markForCheck();
  }

  isSelected(id: string): boolean {
    return this.selectedSupplierIds.includes(id);
  }

  addProduct(): void {
    this.products = [...this.products, { nom: '', quantite: 1, unite: 'Boites' }];
    this.cdr.markForCheck();
  }

  removeProduct(i: number): void {
    this.products = this.products.filter((_, idx) => idx !== i);
    this.cdr.markForCheck();
  }

  submitDemande(): void {
    if (!this.nomDemande.trim()) {
      this.submitError = 'Veuillez saisir un nom pour la demande.';
      this.cdr.markForCheck();
      return;
    }
    this.submitting  = true;
    this.submitError = '';

    const urgencyMap: Record<string, string> = {
      Normal: 'NORMAL', Urgent: 'URGENT', Critique: 'URGENT',
    };

    const deliveryAddress: any = {};
    if (this.lieuRegion.trim())      deliveryAddress.region      = this.lieuRegion.trim();
    if (this.lieuDepartement.trim()) deliveryAddress.departement = this.lieuDepartement.trim();
    if (this.lieuCommune.trim())     deliveryAddress.commune     = this.lieuCommune.trim();

    const body: any = {
      institutionName: this.institutionName || 'Hôpital',
      title:           this.nomDemande.trim(),
      description:     this.description.trim() || undefined,
      urgencyLevel:    urgencyMap[this.urgencyLevel] ?? 'NORMAL',
      items: this.products
        .filter(p => p.nom.trim())
        .map(p => ({ articleName: `${p.nom.trim()} (${p.unite})`, quantity: Number(p.quantite) || 1 })),
      invitedSupplierIds: this.selectedSupplierIds,
    };
    if (Object.keys(deliveryAddress).length > 0) body.deliveryAddress = deliveryAddress;

    this.http.post<DemandeMateriel>(
      `${BASE}/hospital/material-requests`,
      body,
      { headers: this.headers() },
    ).subscribe({
      next: created => {
        this.submitting = false;
        this.submitSuccess = true;
        this.demandes = [created, ...this.demandes];
        this.totalDemandes++;
        setTimeout(() => this.closeModal(), 1200);
        this.cdr.markForCheck();
      },
      error: err => {
        this.submitting = false;
        this.submitError = err?.error?.message ?? 'Une erreur est survenue.';
        this.cdr.markForCheck();
      },
    });
  }

  supplierScore(f: Fournisseur): string {
    return f.rating ? `${f.rating}/5` : '—';
  }

  supplierLocation(f: Fournisseur): string {
    return f.city ?? f.productType ?? '';
  }
}
