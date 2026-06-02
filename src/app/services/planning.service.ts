import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface AvailableDay {
    date: string; // Format: DD-MM-YYYY
    startTime: string; // Format: HH:mm
    endTime: string; // Format: HH:mm
}

export interface TimeSlot {
    id: number;
    date: string; // Format: DD-MM-YYYY
    startTime: string; // Format: HH:mm
    endTime: string; // Format: HH:mm
    booked: boolean;
}

export interface CreateAvailabilityRequest {
    doctorId: number;
    date: string; // Format: DD-MM-YYYY
    startTime: string; // Format: HH:mm
    endTime: string; // Format: HH:mm
}

@Injectable({
    providedIn: 'root'
})
export class PlanningService {
    private readonly apiUrl = 'https://wakana.online/pharma-delivery/api';

    constructor(private http: HttpClient) { }

    /**
     * Récupère les jours disponibles pour un médecin durant un mois donné
     * @param doctorId - ID du médecin
     * @param month - Mois au format MM-YYYY (ex: "02-2026")
     */
    getAvailableDays(doctorId: number, month: string): Observable<AvailableDay[]> {
        return this.http.get<AvailableDay[]>(
            `${this.apiUrl}/availabilities/${doctorId}/days?month=${month}`
        ).pipe(
            catchError(error => {
                console.error('Erreur lors de la récupération des jours disponibles:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Récupère les créneaux de 30 minutes pour un médecin à une date donnée
     * @param doctorId - ID du médecin
     * @param date - Date au format DD-MM-YYYY (ex: "12-02-2026")
     */
    getTimeSlots(doctorId: number, date: string): Observable<TimeSlot[]> {
        return this.http.get<TimeSlot[]>(
            `${this.apiUrl}/availabilities/${doctorId}?date=${date}`
        ).pipe(
            catchError(error => {
                console.error('Erreur lors de la récupération des créneaux:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Génère des créneaux de disponibilité pour un médecin
     * @param data - Données du créneau à créer
     */
    generateAvailabilities(data: CreateAvailabilityRequest): Observable<any> {
        return this.http.post(
            `${this.apiUrl}/availabilities/generate`,
            data
        ).pipe(
            catchError(error => {
                console.error('Erreur lors de la création des créneaux:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Récupère les rendez-vous d'un médecin avec pagination
     * @param doctorId - ID du médecin
     * @param page - Numéro de page (commence à 0)
     * @param size - Nombre d'éléments par page
     */
    getDoctorAppointments(doctorId: number, page: number = 0, size: number = 10): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/appointments/doctor/${doctorId}?page=${page}&size=${size}&sort=date,desc`
        ).pipe(
            catchError(error => {
                console.error('Erreur lors de la récupération des rendez-vous:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Supprime un rendez-vous
     * @param appointmentId - ID du rendez-vous à supprimer
     */
    deleteAppointment(appointmentId: number): Observable<any> {
        return this.http.delete(
            `${this.apiUrl}/appointments/${appointmentId}`
        ).pipe(
            catchError(error => {
                console.error('Erreur lors de la suppression du rendez-vous:', error);
                return throwError(() => error);
            })
        );
    }
}
