import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour les données d'inscription
export interface InscriptionData {
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

// Interface pour les données utilisateur du formulaire
export interface UserFormData {
  username: string;
  phone: string;
  email: string;
  selectedRole: string;
  pharmacyInfo?: {
    name: string;
    address: string;
  };
}

// Interface pour la réponse du serveur (à adapter selon votre API)
export interface InscriptionResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {
  private apiUrl = 'https://wakana.online/pharma-delivery/api/';

  constructor(private http: HttpClient) { }

  /**
   * Créer un nouvel utilisateur
   * @param userData - Les données de l'utilisateur à créer
   * @returns Observable de la réponse du serveur
   */
  createUser(userData: InscriptionData): Observable<InscriptionResponse> {
    const url = `${this.apiUrl}auth/signup`;
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<InscriptionResponse>(url, userData, httpOptions);
  }

  /**
   * Convertir les données du formulaire en format API
   * @param formData - Les données du formulaire
   * @returns InscriptionData formatées pour l'API
   */
  convertFormDataToApiFormat(formData: UserFormData): InscriptionData {
    // Séparer le nom complet en nom et prénom
    const nameParts = formData.username.trim().split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || prenom;

    return {
      nom: nom,
      prenom: prenom,
      email: formData.email || '',
      password: '', // Le mot de passe devra être ajouté séparément
      telephone: formData.phone,
      adress: formData.pharmacyInfo?.address || '',
      lat: 0, // À récupérer via géolocalisation si nécessaire
      lon: 0, // À récupérer via géolocalisation si nécessaire
      profil: formData.selectedRole
    };
  }

  /**
   * Valider les données avant l'envoi
   * @param userData - Les données à valider
   * @returns boolean - true si les données sont valides
   */
  validateUserData(userData: InscriptionData): boolean {
    // Validation basique
    if (!userData.nom || !userData.prenom || !userData.email || !userData.password) {
      return false;
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return false;
    }
    
    // Validation téléphone (format basique)
    if (!userData.telephone || userData.telephone.length < 8) {
      return false;
    }
    
    return true;
  }
}