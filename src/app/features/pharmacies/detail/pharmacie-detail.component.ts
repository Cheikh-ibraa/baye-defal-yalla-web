import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const ORDER_LABEL: Record<string, string> = {
  PENDING:        'En attente',
  IN_PREPARATION: 'En préparation',
  READY:          'Prête',
  DELIVERED:      'Livrée',
  CANCELLED:      'Annulée',
};

const ORDER_CLASS: Record<string, string> = {
  PENDING:        'text-yellow-600 bg-yellow-50',
  IN_PREPARATION: 'text-blue-600 bg-blue-50',
  READY:          'text-teal-600 bg-teal-50',
  DELIVERED:      'text-green-600 bg-green-50',
  CANCELLED:      'text-red-500 bg-red-50',
};

@Component({
  selector: 'app-pharmacie-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacie-detail.component.html',
})
export class PharmacieDetailComponent implements OnInit {
  loading          = true;
  loadError        = '';
  saving           = false;
  deleting         = false;
  addingPharmacist = false;

  pharmacyRow:     any   = null;
  pharmacistUsers: any[] = [];   // liste de tous les pharmaciens liés
  recentOrders:    any[] = [];
  paginatedOrders: any[] = [];
  itemsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  Math = Math;

  initials    = '';
  displayName = '';
  isActive    = false;
  activeTab: 'commandes' | 'performances' = 'commandes';

  // Modal ajout pharmacien
  showAddModal            = false;
  addPharmacistEmail      = '';
  addPharmacistFirstName  = '';
  addPharmacistLastName   = '';
  addError                = '';

  private pharmacyId = '';
  private readonly api = environment.baseUrl;

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
  ) {}

  ngOnInit(): void {
    this.pharmacyId = this.route.snapshot.paramMap.get('id') ?? '';

    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;
    if (state?.pharmacyRow) {
      this.pharmacyRow = state.pharmacyRow;
      this.applyRow();
    }

    this.load();
  }

  private load(): void {
    this.loading = true;

    this.http.get<any>(`${this.api}/admin/pharmacies/detail/${this.pharmacyId}`)
      .pipe(catchError(() => of(null)))
      .subscribe(detail => {
        if (detail) {
          this.pharmacyRow  = { ...this.pharmacyRow, ...detail.pharmacy, ...detail.stats };
          this.recentOrders = detail.recentOrders ?? [];
          if (detail.pharmacistUsers && Array.isArray(detail.pharmacistUsers)) {
            this.pharmacistUsers = detail.pharmacistUsers;
          } else if (detail.pharmacistUser) {
            this.pharmacistUsers = [detail.pharmacistUser];
          }
          this.applyRow();
          this.currentPage = 1;
          this.updatePagination();
          this.loading = false;
        } else {
          this.loadPharmacistList();
        }
      });
  }

  private loadPharmacistList(): void {
    // Essayer l'endpoint liste pharmaciens de la pharmacie
    this.http.get<any[]>(`${this.api}/admin/pharmacies/${this.pharmacyId}/pharmacists`)
      .pipe(catchError(() => of(null)))
      .subscribe(list => {
        if (list && Array.isArray(list)) {
          this.pharmacistUsers = list;
          this.loading = false;
        } else {
          this.loadSinglePharmacistFallback();
        }
      });
  }

  private loadSinglePharmacistFallback(): void {
    const pharmacistId = this.pharmacyRow?.pharmacistId;
    if (!pharmacistId) {
      this.loading = false;
      return;
    }
    this.http.get<any>(`${this.api}/admin/pharmacies/${pharmacistId}`)
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        if (data) {
          this.pharmacistUsers = [data];
          this.isActive = data.user?.isActive ?? this.isActive;
        }
        this.loading = false;
      });
  }

  private applyRow(): void {
    const r = this.pharmacyRow;
    if (!r) return;
    const name = r.name ?? r.pharmacyName ?? '';
    const words = name.trim().split(/\s+/);
    this.initials    = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
    this.displayName = name;
    this.isActive    = r.isActive ?? r.isOpen ?? false;
  }

  private updatePagination(): void {
    const total = this.recentOrders.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.itemsPerPage));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedOrders = this.recentOrders.slice(start, start + this.itemsPerPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  // ── Gestion des pharmaciens liés ─────────────────────────────────────────────

  openAddModal(): void {
    this.showAddModal           = true;
    this.addPharmacistEmail     = '';
    this.addPharmacistFirstName = '';
    this.addPharmacistLastName  = '';
    this.addError               = '';
  }

  closeAddModal(): void { this.showAddModal = false; }

  confirmAddPharmacist(): void {
    if (!this.addPharmacistEmail.trim()) return;
    this.addingPharmacist = true;
    this.addError         = '';
    const body: any = { email: this.addPharmacistEmail.trim() };
    if (this.addPharmacistFirstName.trim()) body.firstName = this.addPharmacistFirstName.trim();
    if (this.addPharmacistLastName.trim())  body.lastName  = this.addPharmacistLastName.trim();
    this.http.post(
      `${this.api}/admin/pharmacies/${this.pharmacyId}/pharmacists`,
      body
    ).pipe(
      catchError(err => {
        this.addError         = err.error?.message ?? 'Pharmacien introuvable ou déjà lié.';
        this.addingPharmacist = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.addingPharmacist = false;
        this.showAddModal     = false;
        this.loadPharmacistList();
      }
    });
  }

  removePharmacist(pharmacist: any): void {
    const name = this.getPharmacistName(pharmacist);
    if (!confirm(`Retirer ${name} de cette pharmacie ?`)) return;
    const pid = pharmacist.keycloakId ?? pharmacist.id ?? pharmacist.user?.id;
    this.http.delete(`${this.api}/admin/pharmacies/${this.pharmacyId}/pharmacists/${pid}`)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.pharmacistUsers = this.pharmacistUsers.filter(p => p !== pharmacist);
      });
  }

  // ── Helpers pharmacien ───────────────────────────────────────────────────────

  getPharmacistName(p: any): string {
    const u = p?.user ?? p;
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.email || '—';
  }

  getPharmacistEmail(p: any): string {
    return p?.user?.email ?? p?.email ?? '—';
  }

  getPharmacistInitials(p: any): string {
    const u = p?.user ?? p;
    return ((u?.firstName?.[0] ?? '') + (u?.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  // ── Actions pharmacie ────────────────────────────────────────────────────────

  activerPharmacie(): void {
    if (this.saving) return;
    const id = this.pharmacistUsers[0]?.keycloakId ?? this.pharmacyRow?.pharmacistId;
    if (!id) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/pharmacies/${id}/activate`, {}).subscribe({
      next:  () => { this.isActive = true;  this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  desactiverPharmacie(): void {
    if (this.saving) return;
    const id = this.pharmacistUsers[0]?.keycloakId ?? this.pharmacyRow?.pharmacistId;
    if (!id) return;
    this.saving = true;
    this.http.patch(`${this.api}/admin/users/${id}/deactivate`, {}).subscribe({
      next:  () => { this.isActive = false; this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  supprimerPharmacie(): void {
    if (!confirm(`Supprimer définitivement "${this.displayName}" ?`)) return;
    this.deleting = true;
    const id = this.pharmacistUsers[0]?.keycloakId ?? this.pharmacyRow?.pharmacistId ?? this.pharmacyId;
    this.http.delete(`${this.api}/admin/pharmacies/${id}`).subscribe({
      next:  () => this.router.navigate(['/admin/pharmacies']),
      error: () => { this.deleting = false; },
    });
  }

  goBack(): void { this.router.navigate(['/admin/pharmacies']); }

  // ── Getters ──────────────────────────────────────────────────────────────────

  get hasPharmacist(): boolean {
    return this.pharmacistUsers.length > 0 || !!(this.pharmacyRow?.pharmacistId);
  }

  get pharmacyRef(): string {
    return (this.pharmacyId ?? '').substring(0, 4).toUpperCase();
  }

  get stats() {
    return {
      total:         this.pharmacyRow?.total          ?? this.pharmacyRow?.ordresTraites ?? 0,
      delivered:     this.pharmacyRow?.delivered       ?? this.pharmacyRow?.ordresTraites ?? 0,
      pending:       this.pharmacyRow?.pending         ?? 0,
      cancelled:     this.pharmacyRow?.cancelled       ?? 0,
      disponibilite: this.pharmacyRow?.disponibilite   ?? 0,
      delaiMoyen:    this.pharmacyRow?.delaiMoyen      ?? 0,
    };
  }

  get disponibiliteClass(): string {
    const d = this.stats.disponibilite;
    return d >= 90 ? 'text-green-600' : d >= 70 ? 'text-yellow-600' : 'text-red-500';
  }

  // ── Helpers commandes ────────────────────────────────────────────────────────

  orderLabel(status: string): string { return ORDER_LABEL[status] ?? status; }
  orderClass(status: string): string { return ORDER_CLASS[status] ?? 'text-gray-500 bg-gray-100'; }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
