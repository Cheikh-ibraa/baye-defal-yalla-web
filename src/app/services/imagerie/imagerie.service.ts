import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Examen, ImagerieCreate, ImagerieResponse, PacsViewerResponse } from '../../modele/imagerie.model';


@Injectable({
  providedIn: 'root'
})
export class ImagerieService {

  private apiUrl = environment.baseUrl;
  public baseImageUrl = `${environment.baseUrl}/imaging/files`;

  constructor(private http: HttpClient) { }

  // 🔥 APPEL API IMAGING REQUESTS
  getImageries(
    page: number = 0,
    size: number = 10,
    search?: string,
    status?: string,
    priority?: string,
    imagingCenterId?: number
  ): Observable<ImagerieResponse> {

    let params: any = {
      page,
      size
    };

    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.urgencyLevel = priority;
    if (imagingCenterId) params.centerId = imagingCenterId;

    return this.http.get<ImagerieResponse>(
      `${this.apiUrl}/imaging/requests`,
      { params }
    );
  }
  // 🔥 GET IMAGERIES PAR TÉLÉPHONE PATIENT
  getImageriesByPatientPhone(
    telephone: string,
    page: number = 0,
    size: number = 10
  ): Observable<ImagerieResponse> {
    return this.http.get<ImagerieResponse>(
      `${this.apiUrl}/imaging/requests`,
      {
        params: {
          telephone,
          page: page.toString(),
          size: size.toString()
        }
      }
    );
  }

  // 🆕 CRÉER UNE DEMANDE D’IMAGERIE
  createImagerie(payload: ImagerieCreate): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/imaging/requests`,
      payload
    );
  }

  // =========================
  // TYPES D’EXAMEN
  // =========================
  getImagingTypes(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/imaging/types`
    );
  }

  createImagingType(label: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/imaging/types`,
      null,
      { params: { label } }
    );
  }

  // =========================
  // RÉGIONS
  // =========================
  getImagingRegions(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/imaging/regions`
    );
  }

  createImagingRegion(label: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/imaging/regions`,
      null,
      { params: { label } }
    );
  }

  // =========================
  // CENTRES D'IMAGERIE (AUTOCOMPLETE)
  // =========================
  searchImagingCenters(keyword: string): Observable<any[]> {
    console.log('🔍 [IMAGERIE] SEARCH imaging centers with keyword:', keyword);

    return this.http.get<any>(
      `${this.apiUrl}/v1/user/imaging-centers`,
      { params: { keyword } }
    ).pipe(
      map((response: any) => response.content || [])
    );
  }

  // =========================
  // VALIDER UNE DEMANDE D’IMAGERIE
  // =========================
  acceptImagerie(payload: {
    requestId: number;
    date: string;
    time: string;
  }): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/imaging/accept`,
      payload,
      { responseType: 'text' }
    );
  }

  // =========================
  // DÉTAIL D’UN EXAMEN
  // =========================
  getImagerieById(id: number): Observable<Examen> {
    return this.http.get<Examen>(
      `${this.apiUrl}/imaging/requests/${id}`
    );
  }

  // =========================
  // PUBLIER COMPTE RENDU
  // =========================
  submitImagingReport(payload: {
    requestId: number;
    report: string;
    reportFile?: File;
  }): Observable<string> {

    const formData = new FormData();
    formData.append('requestId', payload.requestId.toString());
    formData.append('report', payload.report);

    if (payload.reportFile) {
      formData.append('reportFile', payload.reportFile);
    }

    return this.http.post(
      `${this.apiUrl}/imaging/report`,
      formData,
      { responseType: 'text' }
    );
  }






  // =========================
  // UPLOAD MULTIPLE IMAGES
  // =========================
  uploadMultiplePictures(
    requestId: number,
    formData: FormData
  ): Observable<string> { // 🔄 Change "any" en "string"
    return this.http.post(
      `${this.apiUrl}/imaging/requests/${requestId}/pictures`,
      formData,
      { responseType: 'text' } // 🔥 Ajoute cette ligne
    );
  }

  // Dans imagerie.service.ts
  getImageBlob(filename: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/imaging/files/${filename}`,
      { responseType: 'blob' }
    );
  }




  // =========================
  // SUPPRIMER IMAGE MÉDICALE
  // =========================
  deleteImagingPicture(
    requestId: number,
    pictureName: string
  ): Observable<string> {

    return this.http.delete(
      `${this.apiUrl}/imaging/requests/${requestId}/pictures`,
      {
        params: { url: pictureName },
        responseType: 'text'
      }
    );
  }

  // =========================
  // UPLOAD DICOM (PACS)
  // =========================
  uploadDicomFile(accessionNumber: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('accessionNumber', accessionNumber);
    formData.append('file', file);

    return this.http.post(
      `${this.apiUrl}/pacs/upload`,
      formData,
      { responseType: 'text' }
    );
  }

  // =========================
  // VIEWER DICOM (PACS)
  // =========================
  getDicomViewer(accessionNumber: string): Observable<PacsViewerResponse> {
    return this.http.get<PacsViewerResponse>(
      `${this.apiUrl}/imaging/viewers/${accessionNumber}`
    );
  }

}
