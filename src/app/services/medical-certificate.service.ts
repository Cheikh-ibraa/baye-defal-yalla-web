import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour la création d'un certificat
export interface CreateCertificateRequest {
    doctorId: number;
    patientId: number;
    typeId: number;
    startDate: string; // Format: YYYY-MM-DD
    endDate: string;   // Format: YYYY-MM-DD
    motif: string;
}

// Interface pour un certificat médical
export interface MedicalCertificate {
    id: number;
    doctorName?: string;
    patientName?: string;
    patientPhone?: string;
    type: string;
    startDate: string;
    endDate: string;
    issueDate?: string;
}

// Interface pour un type de certificat
export interface CertificateType {
    id: number;
    code: string;
    label: string;
    description?: string;
}

// Interface pour ajouter un type de certificat
export interface CreateCertificateTypeRequest {
    id: number;
    code: string;
    label: string;
    description: string;
}

// Interface pour la réponse paginée
export interface CertificatePageResponse {
    content: MedicalCertificate[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: any;
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    numberOfElements: number;
    size: number;
    number: number;
    sort: any;
    first: boolean;
    empty: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MedicalCertificateService {
    private baseUrl = 'https://wakana.online/pharma-delivery/api/medical-certificates';

    constructor(private http: HttpClient) {
        console.log('🏥 MedicalCertificateService - Initialisé avec baseUrl:', this.baseUrl);
    }

    /**
     * Crée un nouveau certificat médical
     */
    createCertificate(data: CreateCertificateRequest): Observable<MedicalCertificate> {
        console.log('📝 Création d\'un certificat médical:', data);
        return this.http.post<MedicalCertificate>(this.baseUrl, data);
    }

    /**
     * Récupère les certificats d'un patient avec pagination
     */
    getCertificatesByPatient(telephone: string, page: number = 0, size: number = 10): Observable<CertificatePageResponse> {
        let params = new HttpParams()
            .set('telephone', telephone)
            .set('page', page.toString())
            .set('size', size.toString());

        console.log('📥 Récupération des certificats du patient avec params:', { telephone, page, size });
        return this.http.get<CertificatePageResponse>(`${this.baseUrl}/patient`, { params });
    }

    /**
     * Récupère tous les types de certificats disponibles
     */
    getCertificateTypes(): Observable<CertificateType[]> {
        console.log('📥 Récupération des types de certificats');
        return this.http.get<CertificateType[]>(`${this.baseUrl}/types`);
    }

    /**
     * Ajoute un nouveau type de certificat
     */
    addCertificateType(data: CreateCertificateTypeRequest): Observable<CertificateType> {
        console.log('📝 Ajout d\'un nouveau type de certificat:', data);
        return this.http.post<CertificateType>(`${this.baseUrl}/type`, data);
    }

    /**
     * Télécharge le PDF d'un certificat médical
     */
    downloadCertificatePdf(certificateId: number): Observable<Blob> {
        console.log('📥 Téléchargement du PDF du certificat:', certificateId);
        return this.http.get(`${this.baseUrl}/${certificateId}/pdf`, { responseType: 'blob' });
    }
}
