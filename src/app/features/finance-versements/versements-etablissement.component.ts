import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const BASE = environment.baseUrl;

interface Balance {
  allocation: { allocatedAmount: number; period?: string; note?: string } | null;
  totalAlloue: number;
  totalPaid: number;
  remaining: number;
  versements: {
    id: string;
    amount: number;
    paymentDate: string;
    documentUrl?: string;
    note?: string;
    adminName?: string;
    createdAt: string;
  }[];
}

@Component({
  selector: 'app-versements-etablissement',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="bg-white rounded-xl shadow-sm">
  <div class="p-5 border-b border-gray-100 flex items-center justify-between">
    <h2 class="text-base font-semibold text-[#343A40]">Mon Financement</h2>
    <span class="text-xs text-gray-400">Source : fonds de donations</span>
  </div>

  <div *ngIf="loading" class="flex justify-center py-8">
    <div class="animate-spin rounded-full h-7 w-7 border-b-2 border-[#1A3C6E]"></div>
  </div>

  <div *ngIf="!loading && balance" class="p-5">
    <!-- 3 chiffres clés -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="text-center">
        <p class="text-xs text-gray-400 mb-1">Montant alloué</p>
        <p class="text-xl font-bold text-[#1A3C6E]">{{ fmt(balance.totalAlloue) }}</p>
      </div>
      <div class="text-center border-x border-gray-100">
        <p class="text-xs text-gray-400 mb-1">Reçu</p>
        <p class="text-xl font-bold text-green-600">{{ fmt(balance.totalPaid) }}</p>
      </div>
      <div class="text-center">
        <p class="text-xs text-gray-400 mb-1">Restant</p>
        <p class="text-xl font-bold text-amber-600">{{ fmt(balance.remaining) }}</p>
      </div>
    </div>

    <!-- Barre de progression -->
    <div class="w-full bg-gray-100 rounded-full h-2 mb-6">
      <div class="h-2 rounded-full bg-[#1A3C6E] transition-all duration-500"
        [style.width]="balance.totalAlloue > 0 ? (balance.totalPaid / balance.totalAlloue * 100) + '%' : '0%'"></div>
    </div>

    <!-- Historique versements -->
    <h3 class="text-sm font-medium text-[#343A40] mb-3">Versements reçus</h3>
    <div *ngIf="balance.versements.length === 0" class="text-sm text-gray-400 text-center py-4">
      Aucun versement reçu pour le moment.
    </div>
    <div class="space-y-2">
      <div *ngFor="let v of balance.versements"
        class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <div>
          <p class="text-sm font-medium text-[#343A40]">{{ fmt(v.amount) }}</p>
          <p class="text-xs text-gray-400">{{ v.paymentDate | date:'dd/MM/yyyy' }}
            <span *ngIf="v.note"> · {{ v.note }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a *ngIf="v.documentUrl" [href]="v.documentUrl" target="_blank"
            class="text-xs text-[#1A3C6E] hover:underline flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Justificatif
          </a>
          <span class="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Reçu</span>
        </div>
      </div>
    </div>
  </div>

  <div *ngIf="!loading && !balance" class="p-5 text-sm text-gray-400 text-center py-8">
    Aucune allocation définie pour cet établissement.
  </div>
</div>
  `,
})
export class VersementsEtablissementComponent implements OnInit {
  balance: Balance | null = null;
  loading = false;

  @Input() establishmentId = '';
  @Input() establishmentType = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.establishmentId) {
      this.load();
    } else if (this.establishmentType === 'PHARMACY') {
      this.resolvePharmacyThenLoad();
    }
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private resolvePharmacyThenLoad() {
    this.loading = true;
    this.http.get<{ id: string }>(`${BASE}/pharmacies/me`, { headers: this.headers() }).subscribe({
      next: p => { this.establishmentId = p.id; this.load(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  load() {
    if (!this.establishmentId || !this.establishmentType) return;
    this.loading = true;
    this.http.get<Balance>(`${BASE}/versements/balance`, {
      headers: this.headers(),
      params: { establishmentId: this.establishmentId, type: this.establishmentType },
    }).subscribe({
      next: b => {
        this.balance = b.totalAlloue === 0 && b.versements.length === 0 ? null : b;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n) + ' F';
  }
}
