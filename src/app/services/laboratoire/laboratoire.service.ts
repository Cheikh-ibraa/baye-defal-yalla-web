import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Laboratoire,
  LaboratoireResponse
} from '../../modele/laboratoir';

@Injectable({
  providedIn: 'root'
})
export class LaboratoireService {

  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  // =========================
  // 📋 LISTE DES EXAMENS LAB (PAGINÉE)
  // =========================
  getLaboratoires(
    page: number = 0,
    size: number = 10,
    search?: string,
    status?: string,
    priority?: string
  ): Observable<LaboratoireResponse> {

    const params: any = { page, size };

    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.urgencyLevel = priority;

    console.log('📡 [LABO] GET analysis requests', params);

    return this.http.get<LaboratoireResponse>(
      `${this.apiUrl}/analysis/requests`,
      { params }
    );
  }

  // =========================
  // 📋 LISTE DES ANALYSES PAR PATIENT (TÉLÉPHONE)
  // =========================
  getAnalysesByPatientPhone(
    telephone: string,
    page: number = 0,
    size: number = 10,
    search?: string,
    status?: string,
    priority?: string
  ): Observable<LaboratoireResponse> {

    const params: any = { telephone, page, size };

    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.urgencyLevel = priority;

    console.log('📡 [LABO] GET analysis requests by patient phone', params);

    return this.http.get<LaboratoireResponse>(
      `${this.apiUrl}/analysis/requests/patient`,
      { params }
    );
  }

  // =========================
  // 🆕 CRÉER UNE DEMANDE D'ANALYSE
  // =========================
  createLaboratoire(payload: Partial<Laboratoire>): Observable<any> {
    console.log('🧪 [LABO] CREATE analysis request', payload);

    return this.http.post<any>(
      `${this.apiUrl}/analysis/requests`,
      payload
    );
  }

  // =========================
  // 🧪 TYPES D'ANALYSES
  // =========================
  getAnalysisTypes(): Observable<any[]> {
    console.log('📡 [LABO] GET analysis types');

    return this.http.get<any[]>(
      `${this.apiUrl}/analysis/types`
    );
  }

  // =========================
  // 🔍 RECHERCHE LABORATOIRES
  // =========================
  searchLaboratories(keyword: string): Observable<any[]> {
    console.log('🔍 [LABO] SEARCH laboratories with keyword:', keyword);

    return this.http.get<any>(
      `${this.apiUrl}/v1/user/laboratories`,
      { params: { keyword } }
    ).pipe(
      map((response: any) => response.content || [])
    );
  }

  // =========================
  // ➕ CRÉER UN TYPE D'ANALYSE
  // =========================
  createAnalysisType(label: string): Observable<any> {
    console.log('➕ [LABO] CREATE analysis type:', label);

    return this.http.post(
      `${this.apiUrl}/analysis/types`,
      null,
      { params: { label } }
    );
  }

  // =========================
  // ✅ ACCEPTER / VALIDER UN EXAMEN LAB
  // =========================
  acceptLaboratoire(payload: {
    requestId: number;
    date: string;
    time: string;
  }): Observable<string> {

    console.log('✅ [LABO] ACCEPT analysis request', payload);

    return this.http.post(
      `${this.apiUrl}/analysis/requests/accept`,
      payload,
      { responseType: 'text' }
    );
  }

  // =========================
  // 📊 DÉTAIL D'UN EXAMEN
  // =========================
  getLaboratoireById(id: number): Observable<Laboratoire> {
    console.log('📡 [LABO] GET analysis request by ID:', id);

    return this.http.get<Laboratoire>(
      `${this.apiUrl}/analysis/requests/${id}`
    );
  }

  // =========================
  // 📄 PUBLIER COMPTE RENDU
  // =========================
  submitAnalysisReport(payload: {
    requestId: number;
    report: string;
    reportFile?: File;
    pdfPassword?: string;
  }): Observable<string> {

    const formData = new FormData();
    formData.append('requestId', payload.requestId.toString());
    formData.append('report', payload.report);

    if (payload.reportFile) {
      formData.append('reportFile', payload.reportFile);
    }

    if (payload.pdfPassword) {
      formData.append('pdfPassword', payload.pdfPassword);
    }

    console.log('📤 [LABO] SUBMIT analysis report');

    return this.http.post(
      `${this.apiUrl}/analysis/report`,
      formData,
      { responseType: 'text' }
    );
  }

  // =========================
  // 🖼️ UPLOAD MULTIPLE PICTURES (si nécessaire)
  // =========================
  uploadMultiplePictures(
    requestId: number,
    formData: FormData
  ): Observable<string> {
    console.log('📤 [LABO] UPLOAD pictures for request:', requestId);

    return this.http.post(
      `${this.apiUrl}/analysis/requests/${requestId}/pictures`,
      formData,
      { responseType: 'text' }
    );
  }

  // =========================
  // 🗑️ SUPPRIMER UNE PICTURE
  // =========================
  deleteAnalysisPicture(
    requestId: number,
    pictureName: string
  ): Observable<string> {

    console.log('🗑️ [LABO] DELETE picture:', pictureName);

    return this.http.delete(
      `${this.apiUrl}/analysis/requests/${requestId}/pictures`,
      {
        params: { url: pictureName },
        responseType: 'text'
      }
    );
  }
}
