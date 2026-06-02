import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardLaboratoireResponse {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  urgentRequests: number;
  youngPatients: number;

  monthlyRequests: {
    [month: string]: number;
  };

  requestsByStatus: {
    PENDING: number;
    ACCEPTED: number;
    COMPLETED: number;
    CANCELLED: number;
  };

  requestsByType: {
    [type: string]: number;
  };

  requestsByUrgency: {
    [urgency: string]: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardLaboratoireService {

  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * 📊 Dashboard Laboratoire
   * GET /api/analysis/dashboard/{laboratoryId}
   */
getDashboard(laboratoryId: number, year?: number): Observable<DashboardLaboratoireResponse> {
  let params: any = {};
  if (year) params.year = year;

  const url = `${this.apiUrl}/analysis/dashbord/${laboratoryId}`;
  console.log('🌐 Dashboard Laboratoire URL =', url);

  return this.http.get<DashboardLaboratoireResponse>(url, { params });
}


  /**
   * 📋 Toutes les demandes d’analyses
   * GET /api/analysis/requests
   */
  getAllAnalysisRequests() {
    return this.http.get<any>(
      `${this.apiUrl}/analysis/requests`
    );
  }
}
