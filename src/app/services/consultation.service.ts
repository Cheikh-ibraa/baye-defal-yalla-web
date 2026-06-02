import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour la création d'une consultation
export interface CreateConsultationRequest {
    patientId: number;
    doctorId: number;
    date: string; // Format: "DD-MM-YYYY HH:mm"
    title: string;
    observation: string;
    recommendation: string;
    type: 'TELECONSULTATION' | 'PRESENTIEL';
}

// Interface pour une consultation
export interface Consultation {
    id: number;
    patientId: number;
    patientName?: string;
    patientPhone?: string;
    doctorId: number;
    doctorName?: string;
    date: string;
    title: string;
    observation: string;
    recommendation: string;
    type: 'TELECONSULTATION' | 'PRESENTIEL';
    createdAt?: string;
    updatedAt?: string;
}

// Interface pour la réponse paginée
export interface ConsultationPageResponse {
    content: Consultation[];
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
export class ConsultationService {
    private baseUrl = 'https://wakana.online/pharma-delivery/api/consultations';

    constructor(private http: HttpClient) {
        console.log('🏥 ConsultationService - Initialisé avec baseUrl:', this.baseUrl);
    }

    /**
     * Crée une nouvelle consultation
     */
    createConsultation(data: CreateConsultationRequest): Observable<Consultation> {
        console.log('📝 Création d\'une consultation:', data);
        return this.http.post<Consultation>(this.baseUrl, data);
    }

    /**
     * Récupère une consultation par ID
     */
    getConsultationById(id: number): Observable<Consultation> {
        console.log('📥 Récupération de la consultation:', id);
        return this.http.get<Consultation>(`${this.baseUrl}/${id}`);
    }

    /**
     * Récupère les consultations d'un patient
     */
    getConsultationsByPatient(patientId: number): Observable<Consultation[]> {
        console.log('📥 Récupération des consultations du patient:', patientId);
        const params = new HttpParams().set('patientId', patientId.toString());
        return this.http.get<Consultation[]>(this.baseUrl, { params });
    }

    /**
     * Récupère toutes les consultations avec pagination
     */
    getAllConsultations(phone?: string, doctorId?: number, page: number = 0, size: number = 10): Observable<ConsultationPageResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (phone) {
            params = params.set('phone', phone);
        }
        if (doctorId) {
            params = params.set('doctorId', doctorId.toString());
        }

        console.log('📥 Récupération de toutes les consultations avec params:', { phone, doctorId, page, size });
        return this.http.get<ConsultationPageResponse>(this.baseUrl, { params });
    }

    /**
     * Supprime une consultation
     */
    deleteConsultation(id: number): Observable<void> {
        console.log('🗑️ Suppression de la consultation:', id);
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
