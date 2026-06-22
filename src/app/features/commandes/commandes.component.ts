import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderItem {
  medicationName: string;
  dosage:         string;
  quantity:       number;
  duration:       string;
  available:      boolean | null;
  unitPrice:      number;
}

interface Order {
  id:              string;
  prescriptionId:  string;
  patientId:       string;
  pharmacistId:    string;   // pharmacien qui a TRAITÉ la commande (validatedBy)
  pharmacyId:      string;
  campaignId:      string;   // 'direct' = sans donation, 'pending' = donation en cours, UUID = donation complète
  parentOrderId?:  string | null;
  items:           OrderItem[];
  status:          string;
  timeline:        { status: string; changedAt: string; pharmacistId?: string }[];
  createdAt:       string;
  updatedAt:       string;
  validatedBy?:    string;   // ID du pharmacien qui a validé en premier
  validatedByName?: string;  // nom résolu (optionnel selon le backend)
}

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.css'],
})
export class CommandesComponent implements OnInit, OnDestroy {

  private http     = inject(HttpClient);
  private destroy$ = new Subject<void>();
  private readonly api = environment.baseUrl;

  // ── Data ──────────────────────────────────────────────────────────────────────
  orders:           Order[] = [];
  selectedOrder:    Order | null = null;
  filteredOrders:   Order[] = [];
  paginatedOrders:  Order[] = [];

  // ── UI ────────────────────────────────────────────────────────────────────────
  activeTab          = 'medicaments';
  loading            = false;
  error              = '';
  showMobileDetails  = false;
  isMobileView       = false;
  isTabletView       = false;
  searchTerm         = '';
  showFilter         = false;
  showDemandeModal   = false;
  priorite: 'Normal' | 'Prioritaire' | 'Urgent' = 'Urgent';
  messageOptionnel   = '';

  // availability: keyed by medicationName
  medicationAvailability: Map<string, boolean> = new Map();

  private pollInterval: any = null;

  // patient names cache: patientId → "Prénom Nom"
  patientNames: Record<string, string> = {};

  // ── Pagination ────────────────────────────────────────────────────────────────
  currentPage   = 1;
  itemsPerPage  = 10;
  totalItems    = 0;
  totalPages    = 0;

  Math = Math;

  constructor() { this.checkScreenSize(); }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void { this.checkScreenSize(); }

  // ── Screen size ───────────────────────────────────────────────────────────────
  private checkScreenSize(): void {
    const w = window.innerWidth;
    this.isMobileView = w < 768;
    this.isTabletView = w >= 768 && w < 1024;
    if (w >= 1024) this.showMobileDetails = false;
  }

  toggleMobileView(): void { this.showMobileDetails = !this.showMobileDetails; }

  // ── Load ──────────────────────────────────────────────────────────────────────
  loadOrders(reselectId?: string): void {
    this.loading = true;
    this.error   = '';
    this.http.get<Order[]>(`${this.api}/pharmacy/orders`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          if (err.status === 404) return of([] as Order[]);
          this.error = 'Impossible de charger les commandes.';
          return of([] as Order[]);
        }),
      )
      .subscribe(data => {
        this.orders = data
          .filter(o => !o.parentOrderId)
          .map(o => ({
            ...o,
            items: o.items.map(i => ({ ...i, unitPrice: i.unitPrice ?? 0 })),
          }));
        this.filteredOrders = [...this.orders];
        this.totalItems     = this.orders.length;
        this.updatePagination();
        this.loading = false;
        this.loadPatientNames(this.orders);
        // Reselectionner la commande après reload si demandé
        if (reselectId) {
          const refreshed = this.orders.find(o => o.id === reselectId);
          if (refreshed) this.selectOrder(refreshed);
        }
      });
  }

  refreshData(): void { this.loadOrders(this.selectedOrder?.id); }

  // ── Selection ─────────────────────────────────────────────────────────────────
  selectOrder(order: Order): void {
    this.selectedOrder = { ...order, items: order.items.map(i => ({ ...i })) };
    this.activeTab     = 'medicaments';
    // Initialise depuis la donnée API : available=true → coché, null/false → décoché
    this.medicationAvailability = new Map(
      order.items.map(i => [i.medicationName, i.available === true]),
    );
    if (this.isMobileView || this.isTabletView) this.showMobileDetails = true;
    this.resetPolling();
  }

  // ── Auto-refresh polling ──────────────────────────────────────────────────────
  private resetPolling(): void {
    this.stopPolling();
    const s = this.selectedOrder?.status;
    if (s === 'PENDING' || s === 'IN_PREPARATION') {
      this.startPolling();
    }
  }

  private startPolling(): void {
    this.pollInterval = setInterval(() => this.silentRefresh(), 8000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private silentRefresh(): void {
    if (!this.selectedOrder) { this.stopPolling(); return; }
    const id = this.selectedOrder.id;

    this.http.get<Order[]>(`${this.api}/pharmacy/orders`)
      .pipe(catchError(() => of([] as Order[])))
      .subscribe(data => {
        if (!data.length) return;
        this.orders = data.filter(o => !o.parentOrderId).map(o => ({ ...o, items: o.items.map(i => ({ ...i, unitPrice: i.unitPrice ?? 0 })) }));
        this.filteredOrders = [...this.orders];
        this.totalItems = this.orders.length;
        this.updatePagination();

        const updated = this.orders.find(o => o.id === id);
        if (!updated || updated.status === this.selectedOrder?.status) return;

        // Statut changé → mettre à jour sans réinitialiser l'onglet actif
        const prevTab = this.activeTab;
        this.selectedOrder = { ...updated, items: updated.items.map(i => ({ ...i })) };
        this.activeTab = prevTab;
        this.medicationAvailability = new Map(
          updated.items.map(i => [i.medicationName, i.available === true]),
        );
        if (updated.status !== 'PENDING' && updated.status !== 'IN_PREPARATION') {
          this.stopPolling();
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  getOrderRef(order: Order): string {
    return `CMD-${order.id.substring(0, 8).toUpperCase()}`;
  }

  getPatientDisplay(order: Order): string {
    return this.patientNames[order.patientId] || `Patient #${order.patientId.substring(0, 6).toUpperCase()}`;
  }

  private loadPatientNames(orders: Order[]): void {
    const ids = [...new Set(orders.map(o => o.patientId))];
    ids.forEach(id => {
      if (this.patientNames[id]) return;
      this.http.get<{ firstName?: string; lastName?: string }>(`${this.api}/internal/patients/${id}`)
        .pipe(catchError(() => of<{ firstName?: string; lastName?: string }>({})), takeUntil(this.destroy$))
        .subscribe(data => {
          const name = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();
          if (name) this.patientNames = { ...this.patientNames, [id]: name };
        });
    });
  }

  // ── Availability ──────────────────────────────────────────────────────────────
  toggleAvailability(name: string): void {
    this.medicationAvailability.set(name, !(this.medicationAvailability.get(name) ?? false));
  }

  isMedAvailable(name: string): boolean {
    return this.medicationAvailability.get(name) ?? false;
  }

  // ── Item filters ─────────────────────────────────────────────────────────────
  // Items disponibles (available=true ou null = non vérifié → considéré présent)
  get availableItems(): OrderItem[] {
    return (this.selectedOrder?.items ?? []).filter(i => i.available !== false);
  }

  // Items transférés à une autre pharmacie (available=false)
  get transferredItems(): OrderItem[] {
    return (this.selectedOrder?.items ?? []).filter(i => i.available === false);
  }

  // ── Totals ────────────────────────────────────────────────────────────────────
  calculerTotal(): number {
    if (!this.selectedOrder) return 0;
    return this.selectedOrder.items.reduce((s, m) => s + (m.unitPrice ?? 0) * m.quantity, 0);
  }

  updateUnitPrice(index: number, event: Event): void {
    if (!this.selectedOrder) return;
    this.selectedOrder.items[index].unitPrice = parseFloat((event.target as HTMLInputElement).value) || 0;
  }

  // ── Swal helpers ──────────────────────────────────────────────────────────────
  private swalConfirm(html: string, confirmText: string, confirmColor: string): Promise<any> {
    return Swal.fire({
      html,
      showCancelButton:  true,
      showConfirmButton: true,
      confirmButtonText: confirmText,
      cancelButtonText:  'Annuler',
      buttonsStyling:    false,
      customClass: {
        popup:         'rounded-2xl px-6 py-2',
        actions:       'flex items-center justify-center gap-4 mt-2 mb-4',
        confirmButton: `${confirmColor} text-white rounded-lg px-6 py-2.5 text-sm font-medium`,
        cancelButton:  'text-[#FF5A5F] px-3 py-2.5 text-sm font-medium',
      },
      allowOutsideClick: false,
    });
  }

  private swalSuccess(title: string, body: string): void {
    Swal.fire({
      html: `
        <div class="flex flex-col items-center py-4">
          <svg class="mb-4" width="80" height="80" viewBox="0 0 95 95" fill="none">
            <circle cx="47.5" cy="47.5" r="44.5" stroke="#00B894" stroke-width="4"/>
            <path d="M28 48l14 14 26-26" stroke="#00B894" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3 class="text-xl font-bold text-[#1E293B] mb-2">${title}</h3>
          <p class="text-sm text-[#475569] text-center">${body}</p>
        </div>`,
      showConfirmButton: false,
      timer:  2500,
      customClass: { popup: 'rounded-2xl px-6' },
    });
  }

  private swalConfirmHtml(body: string): string {
    return `
      <div class="flex flex-col items-center py-4">
        <div class="w-20 h-20 border-[5px] border-[#F5A623] rounded-full flex items-center justify-center mb-5">
          <span class="text-4xl font-bold text-[#F5A623]">!</span>
        </div>
        ${body}
      </div>`;
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  accepterCommande(): void {
    if (!this.selectedOrder) return;
    const ref     = this.getOrderRef(this.selectedOrder);
    const orderId = this.selectedOrder.id;

    this.swalConfirm(
      this.swalConfirmHtml(`<h3 class="text-2xl font-semibold text-[#2B2B33] mb-3">Confirmation</h3>
        <p class="text-base text-[#3E3E47]">Souhaitez-vous <strong>accepter</strong> cette commande&nbsp;?</p>`),
      'Oui, accepter',
      'bg-[#54B796] hover:bg-[#45A688]',
    ).then(r => {
      if (!r.isConfirmed) return;
      this.loading = true;
      this.http.patch(`${this.api}/pharmacy/orders/${orderId}/start`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:  () => { this.loading = false; this.swalSuccess('Commande acceptée&nbsp;!', `Commande <strong>${ref}</strong> est en préparation pour une livraison.`); this.loadOrders(); },
          error: () => { this.loading = false; this.showAlert('Erreur', 'Impossible d\'accepter la commande.', 'error'); },
        });
    });
  }

  refuserCommande(): void {
    if (!this.selectedOrder) return;
    const ref     = this.getOrderRef(this.selectedOrder);
    const orderId = this.selectedOrder.id;

    this.swalConfirm(
      this.swalConfirmHtml(`<h3 class="text-2xl font-semibold text-[#2B2B33] mb-3">Confirmation</h3>
        <p class="text-base text-[#3E3E47]">Souhaitez-vous <strong>refuser</strong> cette commande&nbsp;?</p>`),
      'Oui, refuser',
      'bg-[#FF6B6B] hover:bg-[#ff5252]',
    ).then(r => {
      if (!r.isConfirmed) return;
      this.loading = true;
      this.http.patch(`${this.api}/pharmacy/orders/${orderId}/refuse`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:  () => { this.loading = false; this.swalSuccess('Commande refusée', `La commande <strong>${ref}</strong> a été refusée.`); this.loadOrders(); },
          error: () => { this.loading = false; this.showAlert('Erreur', 'Impossible de refuser la commande.', 'error'); },
        });
    });
  }

  marquerCommandePretePourLivraison(): void {
    if (!this.selectedOrder || this.selectedOrder.status !== 'IN_PREPARATION') return;
    const orderId = this.selectedOrder.id;

    this.swalConfirm(
      this.swalConfirmHtml(`<h3 class="text-2xl font-semibold text-[#2B2B33] mb-3">Confirmer la réception</h3>
        <p class="text-base text-[#3E3E47] text-center">Êtes-vous sûr de vouloir marquer cette commande<br>comme <strong>prête à être récupérée</strong>&nbsp;?</p>`),
      'Oui, confirmer',
      'bg-[#54B796] hover:bg-[#45A688]',
    ).then(r => {
      if (!r.isConfirmed) return;
      this.loading = true;
      this.http.patch(`${this.api}/pharmacy/orders/${orderId}/ready`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:  () => { this.loading = false; this.swalSuccess('Commande mise à jour', 'La commande est maintenant prête à être récupérée.<br>Une notification a été envoyée au patient.'); this.loadOrders(); },
          error: () => { this.loading = false; this.showAlert('Erreur', 'Impossible de mettre à jour la commande.', 'error'); },
        });
    });
  }

  // ── Demande de complément ─────────────────────────────────────────────────────
  ouvrirDemandeComplement(): void {
    this.priorite        = 'Urgent';
    this.messageOptionnel = '';
    this.showDemandeModal = true;
  }

  fermerDemandeModal(): void { this.showDemandeModal = false; }

  publierDemande(): void {
    if (!this.selectedOrder) return;
    this.showDemandeModal = false;
    this.loading = true;

    const items = this.selectedOrder.items.map(m => ({
      medicationName: m.medicationName,
      available:      this.isMedAvailable(m.medicationName),
    }));

    this.http.patch(`${this.api}/pharmacy/orders/${this.selectedOrder.id}/items-availability`, { items })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.loading = false; this.swalSuccess('Demande publiée avec succès', ''); this.loadOrders(this.selectedOrder?.id); },
        error: () => { this.loading = false; this.showAlert('Erreur', 'Impossible de publier la demande.', 'error'); },
      });
  }

  // ── QR Code ───────────────────────────────────────────────────────────────────
  downloadQrCode(): void { this.showAlert('Info', 'Téléchargement du QR code...', 'info'); }
  printQrCode(): void { window.print(); }

  scanQrCode(): void {
    if (!this.selectedOrder || this.selectedOrder.status !== 'READY') return;
    const orderId  = this.selectedOrder.id;
    const ref      = this.getOrderRef(this.selectedOrder);
    const qrData   = encodeURIComponent(JSON.stringify({
      orderId,
      prescriptionId: this.selectedOrder.prescriptionId,
      patientId:      this.selectedOrder.patientId,
    }));

    Swal.fire({
      title: 'Simulation scan QR Code',
      html: `
        <style>
          @keyframes scanLine { 0%{top:0%} 100%{top:97%} }
          @keyframes beep     { 0%,100%{opacity:0} 50%{opacity:1} }
        </style>
        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:4px 0">
          <div style="position:relative;width:210px;height:210px;border-radius:10px;overflow:hidden;background:#111;box-shadow:0 0 0 2px #4FBFA5">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=210x210&data=${qrData}"
                 style="width:100%;height:100%;display:block;opacity:0.9" />
            <div style="position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent 0%,#4FBFA5 40%,#fff 50%,#4FBFA5 60%,transparent 100%);animation:scanLine 1.6s ease-in-out infinite"></div>
            <div style="position:absolute;top:6px;left:6px;width:22px;height:22px;border-top:3px solid #4FBFA5;border-left:3px solid #4FBFA5;border-radius:3px 0 0 0"></div>
            <div style="position:absolute;top:6px;right:6px;width:22px;height:22px;border-top:3px solid #4FBFA5;border-right:3px solid #4FBFA5;border-radius:0 3px 0 0"></div>
            <div style="position:absolute;bottom:6px;left:6px;width:22px;height:22px;border-bottom:3px solid #4FBFA5;border-left:3px solid #4FBFA5;border-radius:0 0 0 3px"></div>
            <div style="position:absolute;bottom:6px;right:6px;width:22px;height:22px;border-bottom:3px solid #4FBFA5;border-right:3px solid #4FBFA5;border-radius:0 0 3px 0"></div>
          </div>
          <div id="qr-sim-status" style="font-size:12px;color:#9CA3AF;text-align:center">Détection en cours…</div>
          <p style="font-size:13px;color:#6B7280;text-align:center;margin:0">
            Commande <strong style="color:#104382">${ref}</strong>
          </p>
        </div>`,
      showCancelButton: true,
      showConfirmButton: false,
      cancelButtonText: 'Annuler',
      customClass: {
        popup:        'rounded-2xl',
        cancelButton: 'text-gray-700 px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium',
      },
      allowOutsideClick: false,
      didOpen: () => {
        // Simulation : détection automatique après 2 s
        setTimeout(() => {
          if (!Swal.isVisible()) return;
          const statusEl = document.getElementById('qr-sim-status');
          if (statusEl) {
            statusEl.style.color   = '#16A34A';
            statusEl.textContent   = '✓ QR code détecté !';
          }
          setTimeout(() => {
            Swal.close();
            setTimeout(() => this.processScannedQr(JSON.stringify({ orderId }), orderId, ref), 150);
          }, 600);
        }, 2000);
      },
    });
  }

  private processScannedQr(decoded: string, orderId: string, ref: string): void {
    let scannedId = '';
    try { scannedId = (JSON.parse(decoded) as { orderId: string }).orderId; }
    catch { scannedId = decoded; }

    if (scannedId !== orderId) {
      Swal.fire({
        icon: 'warning',
        title: 'QR invalide',
        text: `Ce QR code ne correspond pas à la commande ${ref}.`,
        confirmButtonColor: '#104382',
      });
      return;
    }

    this.swalConfirm(
      this.swalConfirmHtml(`
        <h3 class="text-2xl font-semibold text-[#2B2B33] mb-3">Confirmer la remise</h3>
        <p class="text-base text-[#3E3E47] text-center">QR code validé.<br>Confirmez la remise des médicaments au patient pour la commande <strong>${ref}</strong>.</p>`),
      'Confirmer la remise',
      'bg-[#16A34A] hover:bg-[#15803D]',
    ).then(r => {
      if (!r.isConfirmed) return;
      this.loading = true;
      this.http.patch(`${this.api}/pharmacy/orders/${orderId}/delivered`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.swalSuccess('Remise confirmée !', `Les médicaments de la commande <strong>${ref}</strong> ont été remis au patient.`);
            this.loadOrders();
          },
          error: () => { this.loading = false; this.showAlert('Erreur', 'Impossible de confirmer la remise.', 'error'); },
        });
    });
  }

  // ── Search / Filter ───────────────────────────────────────────────────────────
  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredOrders = !term
      ? [...this.orders]
      : this.orders.filter(o =>
          this.getOrderRef(o).toLowerCase().includes(term) ||
          o.status.toLowerCase().includes(term) ||
          o.patientId.toLowerCase().includes(term),
        );
    this.totalItems  = this.filteredOrders.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  toggleFilter(): void { this.showFilter = !this.showFilter; }

  filterByStatus(status: string): void {
    this.filteredOrders = status === 'all'
      ? [...this.orders]
      : this.orders.filter(o => o.status === status);
    this.totalItems  = this.filteredOrders.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  onItemsPerPageChange(): void { this.currentPage = 1; this.updatePagination(); }

  previousPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); }
  }

  private updatePagination(): void {
    this.totalItems  = this.filteredOrders.length;
    this.totalPages  = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(): number  { return this.totalPages; }
  getStartIndex(): number  { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  getEndIndex(): number    { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }

  // ── Donation helpers ──────────────────────────────────────────────────────
  isDonationPending(order: Order | null): boolean {
    return order?.campaignId === 'pending';
  }

  // ── Status helpers ────────────────────────────────────────────────────────────
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:        'bg-[#FEF3C7] text-[#D97706]',
      IN_PREPARATION: 'bg-blue-100 text-blue-700',
      READY:          'bg-purple-100 text-purple-700',
      DELIVERED:      'bg-teal-100 text-teal-700',
      CANCELLED:      'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      PENDING:        'En attente',
      IN_PREPARATION: 'En préparation',
      READY:          'Prêt à récupérer',
      DELIVERED:      'Livré',
      CANCELLED:      'Refusée',
    };
    return map[status] ?? status;
  }

  // ── Utility ───────────────────────────────────────────────────────────────────
  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR');
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
  }

  trackByOrderId(_i: number, o: Order): string { return o.id; }

  getValidatorDisplay(order: Order): string {
    if (order.validatedByName) return order.validatedByName;
    if (order.validatedBy) return `#${order.validatedBy.substring(0, 6).toUpperCase()}`;
    // Fallback : pharmacistId = celui qui a pris en charge
    if (order.pharmacistId && order.status !== 'PENDING') {
      return this.patientNames['pharmacist_' + order.pharmacistId]
        || `Pharmacien #${order.pharmacistId.substring(0, 6).toUpperCase()}`;
    }
    return '';
  }

  private showAlert(title: string, text: string, icon: any): void {
    Swal.fire({ title, text, icon, confirmButtonColor: '#104382' });
  }
}
