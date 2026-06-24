import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

interface OrderItem {
  medicationName: string;
  dosage: string;
  quantity: number;
  duration: string;
  available: boolean | null;
  unitPrice: number;
}

interface Order {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacistId: string;
  pharmacyId: string;
  items: OrderItem[];
  status: string;
  timeline: { status: string; changedAt: string }[];
  createdAt: string;
  updatedAt: string;
  parentOrderId?: string | null;
}

interface PharmacyInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  logoUrl?: string | null;
}

@Component({
  selector: 'app-demande-complement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-complement.component.html',
  styleUrls: ['./demande-complement.component.css'],
})
export class DemandeComplementComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();
  private readonly api = environment.baseUrl;

  orders: Order[] = [];
  selectedOrder: Order | null = null;
  emittingPharmacy: PharmacyInfo | null = null;
  pharmacies: PharmacyInfo[] = [];
  patientNames: Record<string, string> = {};

  loading = true;
  loadingPharmacy = false;
  error = '';

  searchQuery = '';
  selectedStatus = '';
  activeTab = 'medicaments';

  currentPage = 0;
  itemsPerPage = 5;

  ngOnInit(): void {
    this.loadPharmacies();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPharmacies(): void {
    this.http.get<PharmacyInfo[]>(`${this.api}/pharmacy/pharmacies`)
      .pipe(catchError(() => of([])), takeUntil(this.destroy$))
      .subscribe(list => this.pharmacies = list);
  }

  loadOrders(reselectId?: string): void {
    this.loading = true;
    this.error = '';
    this.http.get<Order[]>(`${this.api}/pharmacy/orders`)
      .pipe(
        catchError(err => {
          if (err.status === 404) return of([]);
          this.error = 'Impossible de charger les demandes.';
          return of([]);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(all => {
        this.orders = all.filter(o => o.parentOrderId != null);
        this.loading = false;
        this.loadPatientNames(this.orders);
        if (reselectId) {
          const refreshed = this.orders.find(o => o.id === reselectId);
          if (refreshed) { this.selectOrder(refreshed); return; }
        }
        if (!this.selectedOrder && this.filteredOrders.length > 0) {
          this.selectOrder(this.filteredOrders[0]);
        }
      });
  }

  get filteredOrders(): Order[] {
    let list = this.orders;
    if (this.selectedStatus) list = list.filter(o => o.status === this.selectedStatus);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o =>
        this.getOrderRef(o).toLowerCase().includes(q) ||
        this.getPatientDisplay(o).toLowerCase().includes(q),
      );
    }
    return list;
  }

  get paginatedOrders(): Order[] {
    const start = this.currentPage * this.itemsPerPage;
    return this.filteredOrders.slice(start, start + this.itemsPerPage);
  }

  get totalItems(): number { return this.filteredOrders.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage)); }
  get startIndex(): number { return this.totalItems === 0 ? 0 : this.currentPage * this.itemsPerPage + 1; }
  get endIndex(): number { return Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems); }

  selectOrder(order: Order): void {
    this.selectedOrder = order;
    this.activeTab = 'medicaments';
    this.emittingPharmacy = null;
    this.loadEmittingPharmacy(order);
  }

  private loadEmittingPharmacy(order: Order): void {
    if (!order.parentOrderId) return;
    this.loadingPharmacy = true;
    this.http.get<Order>(`${this.api}/pharmacy/orders/${order.parentOrderId}`)
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(parent => {
        if (parent?.pharmacyId) {
          this.emittingPharmacy = this.pharmacies.find(p => p.id === parent.pharmacyId) ?? null;
        }
        this.loadingPharmacy = false;
      });
  }

  getOrderRef(order: Order): string {
    return `D-${order.id.substring(0, 8).toUpperCase()}`;
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

  previousPage(): void { if (this.currentPage > 0) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) this.currentPage++; }
  onItemsPerPageChange(): void { this.currentPage = 0; }
  onStatusChange(): void { this.currentPage = 0; this.selectedOrder = null; this.emittingPharmacy = null; }
  refreshData(): void { this.loadOrders(this.selectedOrder?.id); }
  trackById(_: number, order: Order): string { return order.id; }

  getStatusColorClass(status: string): string {
    switch (status) {
      case 'PENDING':        return 'bg-[#FFF3CD] text-[#B8860B]';
      case 'IN_PREPARATION': return 'bg-blue-100 text-blue-800';
      case 'READY':          return 'bg-green-100 text-green-800';
      case 'DELIVERED':      return 'bg-teal-100 text-teal-800';
      case 'CANCELLED':      return 'bg-red-100 text-red-800';
      default:               return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':        return 'En attente';
      case 'IN_PREPARATION': return 'En préparation';
      case 'READY':          return 'Prête';
      case 'DELIVERED':      return 'Livrée';
      case 'CANCELLED':      return 'Annulée';
      default:               return status || 'Inconnu';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  accepterDemande(): void {
    if (!this.selectedOrder) return;
    const ref = this.getOrderRef(this.selectedOrder);
    Swal.fire({
      title: 'Confirmer l\'acceptation',
      html: this.swalHtml(`Accepter la demande <strong>${ref}</strong> et démarrer la préparation ?`),
      iconHtml: '<div style="width:60px;height:60px;border-radius:50%;border:3px solid #4FBFA5;display:flex;align-items:center;justify-content:center;font-size:28px;color:#4FBFA5">✓</div>',
      customClass: { icon: 'border-0' },
      showCancelButton: true,
      confirmButtonColor: '#4FBFA5',
      cancelButtonColor: 'transparent',
      confirmButtonText: 'Oui, accepter',
      cancelButtonText: 'Annuler',
    }).then(r => {
      if (!r.isConfirmed || !this.selectedOrder) return;
      const id = this.selectedOrder.id;
      this.http.patch(`${this.api}/pharmacy/orders/${id}/start`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({ title: 'Acceptée !', text: `La demande ${ref} est en cours de préparation.`, icon: 'success', confirmButtonColor: '#4FBFA5' });
            this.loadOrders(id);
          },
          error: () => Swal.fire('Erreur', 'Impossible d\'accepter cette demande.', 'error'),
        });
    });
  }

  refuserDemande(): void {
    if (!this.selectedOrder) return;
    const ref = this.getOrderRef(this.selectedOrder);
    Swal.fire({
      title: 'Confirmation',
      html: this.swalHtml(`Souhaitez-vous <strong>refuser</strong> cette demande ?`),
      iconHtml: '<div style="width:60px;height:60px;border-radius:50%;border:3px solid #F5A623;display:flex;align-items:center;justify-content:center;font-size:28px;color:#F5A623;font-weight:bold">!</div>',
      customClass: { icon: 'border-0' },
      showCancelButton: true,
      confirmButtonColor: '#F36B6B',
      cancelButtonColor: 'transparent',
      confirmButtonText: 'Oui, refuser',
      cancelButtonText: 'Annuler',
    }).then(r => {
      if (!r.isConfirmed || !this.selectedOrder) return;
      this.http.patch(`${this.api}/pharmacy/orders/${this.selectedOrder.id}/refuse`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({ title: 'Refusée', text: `La demande ${ref} a été refusée.`, icon: 'success', confirmButtonColor: '#4FBFA5' });
            this.loadOrders();
          },
          error: () => Swal.fire('Erreur', 'Impossible de refuser cette demande.', 'error'),
        });
    });
  }

  marquerPrete(): void {
    if (!this.selectedOrder) return;
    const ref = this.getOrderRef(this.selectedOrder);
    const id  = this.selectedOrder.id;
    Swal.fire({
      title: 'Prête à être récupérée',
      html: this.swalHtml(`Confirmer que la demande <strong>${ref}</strong> est prête à être récupérée ?`),
      iconHtml: '<div style="width:60px;height:60px;border-radius:50%;background:#4FBFA5;display:flex;align-items:center;justify-content:center"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>',
      customClass: { icon: 'border-0' },
      showCancelButton: true,
      confirmButtonColor: '#104382',
      cancelButtonColor: 'transparent',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
    }).then(r => {
      if (!r.isConfirmed) return;
      this.http.patch(`${this.api}/pharmacy/orders/${id}/ready`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({ title: 'Prête !', text: `La demande ${ref} est prête à être récupérée.`, icon: 'success', confirmButtonColor: '#4FBFA5' });
            this.loadOrders(id);
          },
          error: () => Swal.fire('Erreur', 'Impossible de marquer cette demande comme prête.', 'error'),
        });
    });
  }

  scannerQr(): void {
    if (!this.selectedOrder) return;
    const ref = this.getOrderRef(this.selectedOrder);
    const id  = this.selectedOrder.id;
    const qrData = encodeURIComponent(JSON.stringify({ orderId: id, ref }));

    Swal.fire({
      title: 'Scanner le QR Code',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:8px 0">
          <div style="background:#2d2d2d;border-radius:12px;padding:20px;display:flex;align-items:center;justify-content:center;width:220px;height:220px">
            <div style="position:relative;width:180px;height:180px">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}"
                style="width:100%;height:100%;border-radius:4px" />
              <div style="position:absolute;inset:0;pointer-events:none">
                <div style="position:absolute;top:0;left:0;width:28px;height:28px;border-top:3px solid #2C7BE5;border-left:3px solid #2C7BE5;border-radius:2px 0 0 0"></div>
                <div style="position:absolute;top:0;right:0;width:28px;height:28px;border-top:3px solid #2C7BE5;border-right:3px solid #2C7BE5;border-radius:0 2px 0 0"></div>
                <div style="position:absolute;bottom:0;left:0;width:28px;height:28px;border-bottom:3px solid #2C7BE5;border-left:3px solid #2C7BE5;border-radius:0 0 0 2px"></div>
                <div style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-bottom:3px solid #2C7BE5;border-right:3px solid #2C7BE5;border-radius:0 0 2px 0"></div>
              </div>
            </div>
          </div>
          <p style="font-size:13px;color:#6B7280;text-align:center;max-width:280px;line-height:1.5">
            Scannez le QR Code du patient pour confirmer la remise des médicaments de la demande <strong>${ref}</strong>
          </p>
        </div>`,
      showCancelButton: true,
      confirmButtonColor: '#14B8A6',
      cancelButtonColor: '#E5E7EB',
      confirmButtonText: 'Confirmer la remise',
      cancelButtonText: 'Fermer',
      showCloseButton: true,
      customClass: {
        confirmButton: 'text-white font-medium px-6 py-2.5 rounded-lg',
        cancelButton: 'text-gray-700 font-medium px-6 py-2.5 rounded-lg',
        popup: 'rounded-2xl',
      },
    }).then(r => {
      if (!r.isConfirmed) return;
      this.http.patch(`${this.api}/pharmacy/orders/${id}/delivered`, {})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Remise confirmée !',
              text: `Les médicaments de la demande ${ref} ont été remis au patient.`,
              icon: 'success',
              confirmButtonColor: '#4FBFA5',
            });
            this.loadOrders();
          },
          error: () => Swal.fire('Erreur', 'Impossible de confirmer la remise.', 'error'),
        });
    });
  }

  private swalHtml(body: string): string {
    return `<div style="text-align:left;font-size:14px;color:#374151;line-height:1.6">${body}</div>`;
  }
}
