import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

// Interfaces pour le typage fort
export interface Doctor {
  id: number;
  nom: string;
  prenom: string;
}

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
}

export interface Pharmacist {
  id: number;
  nom: string;
  prenom: string;
}

export interface Medication {
  id: number;
  name: string;
  quantity: number;
  dosage: string;
  price: number;
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  logo: string;
  hourly: string;
  pharmacist: Pharmacist;
}

export interface Prescription {
  id: number;
  reference: string;
  doctor: Doctor;
  patient: Patient;
  createdAt: string;
  status: string;
  qrCodeUrl: string;
  fullyPaidByDonor: boolean;
  partiallyPaidByDonor: boolean;
  pharmacy: Pharmacy;
  amount: number;
  amountContributed: number;
  needsHelp: boolean;
  address: string;
  latitude: number | null;
  longitude: number | null;
  prescriptionFile: string | null;
  medications: Medication[];
  contributionPercentage: number;
}

export interface DeliveryPerson {
  id: number;
  nom: string;
  prenom: string;
}

export interface Delivery {
  id: number;
  prescription: Prescription;
  deliveryPerson: DeliveryPerson;
  deliveryAddress: string;
  deliveryTime: string;
  status: string;
  patientOrRepresentativePickup: boolean;
  pharmacyLat: number;
  pharmacyLon: number;
  patientLat: number;
  patientLon: number;
  price: number;
  deliveredAt: string | null;
  cancelledAt: string | null;
}

export interface DeliveryItem {
  delivery: Delivery;
  price: number;
}

export interface DeliveryResponse {
  content: DeliveryItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly API_URL = 'https://wakana.online/pharma-delivery/api/deliveries';

  constructor(private http: HttpClient) { }

  /**
   * Récupère les livraisons avec pagination et filtres
   * @param pharmacyId ID de la pharmacie (requis)
   * @param status Statut de la livraison (requis)
   * @param page Numéro de page (par défaut: 0)
   * @param size Taille de la page (par défaut: 10)
   * @returns Observable<DeliveryResponse>
   */
  getDeliveries(
    pharmacyId: number,
    status: string = 'CREATED',
    page: number = 0,
    size: number = 10
  ): Observable<DeliveryResponse> {
    let params = new HttpParams()
      .set('pharmacyId', pharmacyId.toString())
      .set('status', status)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<DeliveryResponse>(`${this.API_URL}/by-pharmacy`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère une livraison par son ID
   * @param deliveryId ID de la livraison
   * @returns Observable<Delivery>
   */
  getDeliveryById(deliveryId: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.API_URL}/${deliveryId}`)
      .pipe(
        catchError(this.handleError)
      );
  }



  /**
   * Gestion centralisée des erreurs HTTP
   * @param error Erreur HTTP
   * @returns Observable<never>
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}