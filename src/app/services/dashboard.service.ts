import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour typer les réponses
export interface PharmacyCounter {
inPreparation: any;
pending: any;
  pendingCount: number;
  inPreparationCount: number;
  readyCount: number;
  deliveredCount: number;
  averagePrepTime: string;
  pendingPercentage: number;
  inPreparationPercentage: number;
  readyPercentage: number;
  deliveredPercentage: number;
}

export interface DeliveryEvolution {
  label: string;
  count: number;
}

export interface PaymentStats {
  todayTotal: number;
  yesterdayTotal: number;
  last7DaysTotal: number;
  last30DaysTotal: number;
}

export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'https://wakana.online/pharma-delivery/api/';

  constructor(private http: HttpClient) {}

  /**
   * Récupère les compteurs de pharmacie
   * @param pharmacyId - ID de la pharmacie
   * @returns Observable<PharmacyCounter>
   */
  getPharmatieCounter(pharmacyId: number): Observable<PharmacyCounter> {
    const url = `${this.apiUrl}pharmacies/counter/${pharmacyId}`;
    return this.http.get<PharmacyCounter>(url);
  }

  /**
   * Récupère l'évolution des livraisons
   * @param pharmacyId - ID de la pharmacie
   * @param periodType - Type de période (DAILY, WEEKLY, MONTHLY)
   * @returns Observable<DeliveryEvolution[]>
   */
  getEvolution(pharmacyId: number, periodType: PeriodType = 'DAILY'): Observable<DeliveryEvolution[]> {
    const url = `${this.apiUrl}pharmacies/delivery/evolution`;
    const params = new HttpParams()
      .set('pharmacyId', pharmacyId.toString())
      .set('periodType', periodType);
    
    return this.http.get<DeliveryEvolution[]>(url, { params });
  }

  /**
   * Récupère les statistiques de paiement
   * @param pharmacyId - ID de la pharmacie
   * @returns Observable<PaymentStats>
   */
  getPaymentState(pharmacyId: number): Observable<PaymentStats> {
    const url = `${this.apiUrl}payments/payments/stats/${pharmacyId}`;
    return this.http.get<PaymentStats>(url);
  }
}