import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardImagerieResponse {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  urgentRequests: number;
  youngPatients: number;

  monthlyRequests: {
    [month: string]: number;
  };

  requestsByStatus: {
    CANCELLED: number;
    COMPLETED: number;
    ACCEPTED: number;
    PENDING: number;
  };

  requestsByType: {
    [type: string]: number;
  };

  requestsByRegion: {
    [region: string]: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardImagerieService {

  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * 🔥 Dashboard Imagerie
   * ⚠️ TEMP : on utilise userId à la place de imagingCenterId
   */
  getDashboard(userId: number, year?: number): Observable<DashboardImagerieResponse> {

    let params: any = {};
    if (year) params.year = year;

    return this.http.get<DashboardImagerieResponse>(
      `${this.apiUrl}/imaging/dashboard/${userId}`,
      { params }
    );
  }

  getAllImagingRequests() {
  return this.http.get<any>(`${this.apiUrl}/imaging/requests`);
}

}
