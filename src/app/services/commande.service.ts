import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
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

export interface PharmacyInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  logo: string;
  pharmacist: Pharmacist;
}

export interface Medication {
  id: number;
  name: string;
  quantity: number;
  dosage: string;
  price: number;
}

export interface Prescription {
  id: number;
  doctor: Doctor;
  patient: Patient;
  createdAt: string;
  status: string;
  qrCodeUrl: string;
  fullyPaidByDonor: boolean;
  partiallyPaidByDonor: boolean;
  pharmacy: PharmacyInfo;
  amount: number | null;
  needsHelp: boolean;
  address: string;
  latitude: number;
  longitude: number;
  prescriptionFile: string | null;
  medications: Medication[];
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      unsorted: boolean;
      sorted: boolean;
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
    unsorted: boolean;
    sorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

export interface MedicationValidation {
  medicationId: number;
  unitPrice: number;
}

// Interface modifiée pour accepter null
export interface ValidateCommandeRequest {
  prescriptionId: number;
  amount: number;
  medications: MedicationValidation[];
}

export interface RejectCommandeRequest {
  prescriptionId: number;
}

export interface ReadyCommandeRequest {
  prescriptionId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private apiUrl = 'https://wakana.online/pharma-delivery/api/';

  constructor(private http: HttpClient) { }

  /**
   * Récupère les commandes d'une pharmacie avec pagination
   * @param pharmacyId - ID de la pharmacie
   * @param page - Numéro de la page (défaut: 0)
   * @param size - Taille de la page (défaut: 10)
   * @returns Observable<PaginatedResponse<Prescription>>
   */
  getCommandes(pharmacyId: number, page: number = 0, size: number = 10): Observable<PaginatedResponse<Prescription>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<Prescription>>(
      `${this.apiUrl}pharmacies/prescriptions/${pharmacyId}`,
      { params }
    );
  }

  /**
   * Récupère les détails d'une commande spécifique
   * @param prescriptionId - ID de la prescription
   * @returns Observable<Prescription>
   */
  getDetailsCommande(prescriptionId: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}prescriptions/${prescriptionId}`);
  }

  /**
   * Valide une commande avec les médicaments et prix
   * @param validationData - Données de validation de la commande
   * @returns Observable<any>
   */
  validerCommande(validationData: ValidateCommandeRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}prescriptions/accept`, validationData, {
      responseType: 'text' as 'json'
    });
  }

  /**
   * Marque une commande comme prête pour livraison
   * @param readyData - Données de mise à jour
   * @returns Observable<any>
   */
  marquerCommandePrete(readyData: ReadyCommandeRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}prescriptions/ready`, readyData, {
      responseType: 'text' as 'json'
    });
  }

  /**
   * Rejette une commande
   * @param rejectionData - Données de rejet de la commande
   * @returns Observable<any>
   */
  rejeterCommande(rejectionData: RejectCommandeRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}prescriptions/rejected`, rejectionData);
  }
}