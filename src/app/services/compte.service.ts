import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adress: string;
  lat: number;
  lon: number;
  profil: string;
  pharmacyId: number;
}


export interface UpdateUserRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  adress: string;
  lat: number;
  lon: number;
  profil: string;
}

export interface Document {
  id: number;
  name: string;
  fileUrl: string;
  status: string;
  comment: string | null;
  user: {
    id: number;
    nom: string;
    prenom: string;
  };
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  hourly: string;
  email: string;
  latitude: number;
  longitude: number;
  logo: string;
  pharmacist: {
    id: number;
    nom: string;
    prenom: string;
  };
}

export interface UpdatePharmacyRequest {
  name: string;
  address: string;
  phone: string;
  hourly: string;
  email: string;
  latitude: number;
  longitude: number;
  pharmacistId: number;
  logoFile?: File;
}

@Injectable({
  providedIn: 'root'
})
export class CompteService {
  private apiUrl = 'https://wakana.online/pharma-delivery/api/';

  constructor(private http: HttpClient) { }

  /**
   * Récupère les informations d'un utilisateur par son ID
   * @param id - ID de l'utilisateur
   * @returns Observable<User>
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}v1/user/${id}`);
  }

  /**
   * Met à jour les informations d'un utilisateur
   * @param id - ID de l'utilisateur
   * @param userData - Données de l'utilisateur à mettre à jour
   * @returns Observable<any>
   */
  updateUser(id: number, userData: UpdateUserRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}v1/user/${id}`, userData);
  }

  /**
   * Récupère les documents d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Observable<Document[]>
   */
  getDocumentByUser(userId: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}user/documents/${userId}`);
  }

  /**
   * Upload un document utilisateur
   * @param userId - ID de l'utilisateur connecté
   * @param name - Nom du document
   * @param file - Fichier binaire
   * @returns Observable<Document>
   */
  uploadUserDocument(userId: number, name: string, file: File): Observable<Document> {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('name', name);
    formData.append('file', file);

    return this.http.post<Document>(`${this.apiUrl}user/documents/upload`, formData);
  }

  /**
   * Récupère les informations d'une pharmacie
   * @param id - ID de la pharmacie
   * @returns Observable<Pharmacy>
   */
  getInfoPharmacie(id: number): Observable<Pharmacy> {
    return this.http.get<Pharmacy>(`${this.apiUrl}pharmacies/${id}`);
  }

  /**
   * Met à jour les informations d'une pharmacie
   * @param id - ID de la pharmacie
   * @param pharmacyData - Données de la pharmacie à mettre à jour
   * @returns Observable<any>
   */
  updatePharmacie(id: number, pharmacyData: UpdatePharmacyRequest): Observable<any> {
    const formData = new FormData();
    formData.append('name', pharmacyData.name);
    formData.append('address', pharmacyData.address);
    formData.append('phone', pharmacyData.phone);
    formData.append('hourly', pharmacyData.hourly);
    formData.append('email', pharmacyData.email);
    formData.append('latitude', pharmacyData.latitude.toString());
    formData.append('longitude', pharmacyData.longitude.toString());
    formData.append('pharmacistId', pharmacyData.pharmacistId.toString());

    if (pharmacyData.logoFile) {
      formData.append('logoFile', pharmacyData.logoFile);
    }

    return this.http.put(`${this.apiUrl}pharmacies/${id}`, formData);
  }
}