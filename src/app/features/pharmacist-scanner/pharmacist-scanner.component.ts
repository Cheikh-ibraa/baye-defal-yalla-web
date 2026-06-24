import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, NgZone, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

declare const Html5Qrcode: any;

interface OrderItem {
  medicationName: string;
  dosage:         string;
  quantity:       number;
  duration:       string;
  available:      boolean | null;
}

interface ScannedOrder {
  id:            string;
  prescriptionId: string;
  patientId:     string;
  status:        string;
  items:         OrderItem[];
  createdAt:     string;
  pharmacy?:     { name: string; address: string; phone: string } | null;
}

interface ReadyOrder {
  id:       string;
  patientId: string;
  status:   string;
  items:    OrderItem[];
  createdAt: string;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-pharmacist-scanner',
  templateUrl: './pharmacist-scanner.component.html',
  styleUrls: ['./pharmacist-scanner.component.css'],
})
export class PharmacistScannerComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('qrRegion') qrRegion!: ElementRef<HTMLDivElement>;

  private http     = inject(HttpClient);
  private zone     = inject(NgZone);
  private destroy$ = new Subject<void>();
  private readonly api = environment.baseUrl;

  private scanner: any = null;
  private scannerRunning = false;

  // ── UI state ──────────────────────────────────────────────────────────────────
  view: 'scanning' | 'result' | 'delivered' = 'scanning';
  loading       = false;
  scanError     = '';
  deliverError  = '';

  scannedOrder: ScannedOrder | null = null;
  patientName   = '';

  // Liste des commandes READY (panneau gauche)
  readyOrders:      ReadyOrder[] = [];
  readyLoading      = false;
  patientNames: Record<string, string> = {};

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadReadyOrders();
  }

  ngAfterViewInit(): void {
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Scanner ───────────────────────────────────────────────────────────────────

  private startScanner(): void {
    if (this.scannerRunning || typeof Html5Qrcode === 'undefined') return;

    this.scanner = new Html5Qrcode('qr-region');
    this.scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (qrData: string) => this.zone.run(() => this.onQrScanned(qrData)),
      (_err: any) => { /* frame errors silencieux */ },
    ).then(() => {
      this.scannerRunning = true;
    }).catch((err: any) => {
      this.zone.run(() => {
        this.scanError = `Caméra inaccessible : ${err?.message ?? err}`;
      });
    });
  }

  private stopScanner(): void {
    if (this.scanner && this.scannerRunning) {
      this.scanner.stop().catch(() => {});
      this.scannerRunning = false;
    }
  }

  private onQrScanned(qrData: string): void {
    this.stopScanner();
    this.loading   = true;
    this.scanError = '';

    this.http.post<ScannedOrder>(`${this.api}/pharmacy/orders/scan-qr`, { qrData })
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.loading   = false;
          this.scanError = err?.error?.message ?? 'Commande introuvable pour ce QR code.';
          this.startScanner();
          return of(null);
        }),
      )
      .subscribe(order => {
        if (!order) return;
        this.loading      = false;
        this.scannedOrder = order;
        this.view         = 'result';
        this.deliverError = '';
        this.loadPatientName(order.patientId);
      });
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  confirmerRemise(): void {
    if (!this.scannedOrder) return;
    this.loading      = true;
    this.deliverError = '';

    this.http.patch(`${this.api}/pharmacy/orders/${this.scannedOrder.id}/deliver`, {})
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.loading      = false;
          this.deliverError = err?.error?.message ?? 'Impossible de confirmer la remise.';
          return of(null);
        }),
      )
      .subscribe(res => {
        if (res === null) return;
        this.loading = false;
        this.view    = 'delivered';
        this.loadReadyOrders();
      });
  }

  resetScanner(): void {
    this.view         = 'scanning';
    this.scannedOrder = null;
    this.patientName  = '';
    this.scanError    = '';
    this.deliverError = '';
    setTimeout(() => this.startScanner(), 100);
  }

  // Sélectionner une commande READY depuis la liste (sans scanner)
  selectReadyOrder(order: ReadyOrder): void {
    this.stopScanner();
    this.loading   = true;
    this.scanError = '';

    this.http.get<ScannedOrder>(`${this.api}/pharmacy/orders/${order.id}`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.loading   = false;
          this.scanError = err?.error?.message ?? 'Impossible de charger la commande.';
          return of(null);
        }),
      )
      .subscribe(o => {
        if (!o) return;
        this.loading      = false;
        this.scannedOrder = o;
        this.view         = 'result';
        this.deliverError = '';
        this.loadPatientName(o.patientId);
      });
  }

  // ── Data ──────────────────────────────────────────────────────────────────────

  private loadReadyOrders(): void {
    this.readyLoading = true;
    this.http.get<ReadyOrder[]>(`${this.api}/pharmacy/orders?status=READY`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([] as ReadyOrder[])),
      )
      .subscribe(data => {
        this.readyLoading = false;
        this.readyOrders  = data;
        data.forEach(o => this.loadPatientName(o.patientId));
      });
  }

  private loadPatientName(patientId: string): void {
    if (!patientId || this.patientNames[patientId]) return;
    this.http.get<any>(`${this.api}/internal/patients/${patientId}`)
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(u => {
        if (!u) return;
        const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
        this.patientNames = { ...this.patientNames, [patientId]: name };
        if (this.scannedOrder?.patientId === patientId) {
          this.patientName = name;
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  getRef(id: string): string {
    return `CMD-${id.slice(0, 8).toUpperCase()}`;
  }

  getPatientDisplay(patientId: string): string {
    return this.patientNames[patientId] || `Patient #${patientId.slice(0, 6).toUpperCase()}`;
  }

  formatDate(d: string): string {
    return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      READY:          'bg-purple-100 text-purple-700',
      IN_PREPARATION: 'bg-blue-100 text-blue-700',
      DELIVERED:      'bg-teal-100 text-teal-700',
      PENDING:        'bg-yellow-100 text-yellow-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      READY:          'Prête',
      IN_PREPARATION: 'En préparation',
      DELIVERED:      'Livrée',
      PENDING:        'En attente',
    };
    return map[status] ?? status;
  }
}
