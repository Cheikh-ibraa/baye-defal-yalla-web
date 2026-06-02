import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StockKPI {
  outOfStock: number;
  totalStock: number;
  belowCriticalThreshold: number;
  totalMedications: number;
}

export interface PrescriptionsKPI {
  doctorId: number;
  totalPrescriptions: number;
  todayPrescriptions: number;
  todayVsYesterdayPercent: number;
  pendingPrescriptions: number;
  validatedLast7Days: number;
  validationRate: number;
}

export interface PrescriptionsStats {
  [key: string]: number; // Pour accommoder différentes clés comme "ACCEPTED", "PENDING", etc.
}

@Injectable({
  providedIn: 'root'
})
export class DashboardMedService {
  private baseUrl = 'https://wakana.online/pharma-delivery';

  constructor(private http: HttpClient) { }

  getTotalStock(pharmacyId: number): Observable<StockKPI> {
    return this.http.get<StockKPI>(
      `${this.baseUrl}/api/stock/pharmacy/${pharmacyId}/kpi`
    );
  }

  getPrescriptionsKpi(doctorId: number): Observable<PrescriptionsKPI> {
    return this.http.get<PrescriptionsKPI>(
      `${this.baseUrl}/api/prescriptions/doctor/${doctorId}/kpi`
    );
  }

  getStat(doctorId: number): Observable<PrescriptionsStats> {
    return this.http.get<PrescriptionsStats>(
      `${this.baseUrl}/api/prescriptions/stats/prescriptions/doctor/${doctorId}`
    );
  }
}