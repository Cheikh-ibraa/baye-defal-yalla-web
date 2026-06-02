import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

// --- Interfaces ---

export interface HelpNeededItem {
    id: number;
    type: 'ANALYSIS' | 'IMAGING' | 'PRESCRIPTION' | string;
    reference: string | null;
    patientName: string;
    patientAvatar: string | null;
    patientId: string | null;
    doctorName: string;
    doctorspeciality: string | null;
    doctorAvatar: string | null;
    facilityName: string;
    itemType: string | null;
    description: string | null;
    amount: number;
    amountContributed: number;
    remainingAmount: number;
    contributionPercentage: number;
    urgencyLevel: 'NORMAL' | 'URGENT' | 'CRITICAL' | null;
    youngPatient: boolean;
    createdAt: string | null;
    appointmentDate: string | null;
    status: string;
    prescriptionFile: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    reportFile: string | null;
    report: string | null;
}

export interface HelpNeededResponse {
    content: HelpNeededItem[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ContributionService {
    private readonly apiUrl = 'https://wakana.online/pharma-delivery/api/contributions/help-needed';

    constructor(private http: HttpClient) { }

    /**
     * Récupère les besoins médicaux en attente de soutien (paginé)
     */
    getHelpNeeded(page: number = 0, size: number = 10): Observable<HelpNeededResponse> {
        return this.http.get<HelpNeededResponse>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
            catchError(error => {
                console.error('Erreur lors du chargement des dons:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Récupère les détails d'un item de contribution par type et id
     * GET /api/contributions/help-needed/{type}/{id}
     */
    getHelpNeededDetail(type: string, id: number): Observable<HelpNeededItem> {
        return this.http.get<HelpNeededItem>(`${this.apiUrl}/${type}/${id}`).pipe(
            catchError(error => {
                console.error('Erreur lors du chargement des détails:', error);
                return throwError(() => error);
            })
        );
    }
}
