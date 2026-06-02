import { Patient } from './commande.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interfaces pour les types de données
export interface Medication {
  id?: number;
  name: string;
  quantity: number;
  dosage: string;
  price: number;
}

export interface Person {
  id: number;
  nom: string;
  prenom: string;
}

export interface Pharmacist {
  id: number;
  nom: string;
  prenom: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  logo: string;
  hourly: string | null;
  pharmacist: Pharmacist;
}

export interface Ordonnance {
  id: number;
  reference: string;
  doctor: Person;
  patient: Person;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PREPARATION' | 'READY' | 'DELIVERED';
  qrCodeUrl: string;
  fullyPaidByDonor: boolean;
  partiallyPaidByDonor: boolean;
  pharmacy: Pharmacy;
  amount: number;
  needsHelp: boolean;
  address: string;
  latitude: number;
  longitude: number;
  prescriptionFile: string | null;
  medications: Medication[];
}

export interface PageableSort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageableSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface OrdonnanceResponse {
  content: Ordonnance[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: PageableSort;
  first: boolean;
  empty: boolean;
}

export interface SaveOrdonnanceRequest {
  doctorId: number;
  patientId: number;
  medications: string; // JSON string des médicaments
  needsHelp: boolean;
  pharmacyId: number;
  address: string;
  latitude: number;
  longitude: number;
  prescriptionFile?: File;
}

// Interface pour la réponse de getPatientByReference
export interface PatientByReference {
  id: number;
  reference: string;
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

@Injectable({
  providedIn: 'root'
})
export class OrdonnanceService {
  private baseUrl = 'https://wakana.online/pharma-delivery/api/prescriptions';
  private userBaseUrl = 'https://wakana.online/pharma-delivery/api/v1/user';

  constructor(private http: HttpClient) {
    console.log('🏥 OrdonnanceService - Initialisé avec baseUrl:', this.baseUrl);
    console.log('👤 User baseUrl:', this.userBaseUrl);
  }

  /**
   * Récupère un Patient par sa référencea
   * @param reference - Référence du patient
   * @returns Observable contenant les informations du patient
   */
  getPatientByReference(reference: string): Observable<PatientByReference> {
    const url = `${this.userBaseUrl}/by-reference/${reference}`;

    console.log('📥 Récupération du client par référence:', reference);
    console.log('🔗 URL:', url);

    return this.http.get<PatientByReference>(url).pipe(
      map(client => {
        console.log('✅ Client récupéré avec succès');
        console.log('👤 Nom complet:', `${client.prenom} ${client.nom}`);
        console.log('📧 Email:', client.email);
        console.log('📞 Téléphone:', client.telephone);
        return client;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du client:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Récupère toutes les ordonnances d'un docteur avec pagination
   * @param doctorId - ID du docteur
   * @param page - Numéro de page (commence à 0)
   * @param size - Nombre d'éléments par page
   * @returns Observable contenant la réponse paginée
   */
  getOrdonnances(doctorId: number, page: number = 0, size: number = 10): Observable<OrdonnanceResponse> {
    const url = `${this.baseUrl}/doctor/${doctorId}`;

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    console.log('📥 Récupération des ordonnances du docteur:', doctorId);
    console.log('📄 Page:', page, '| Taille:', size);
    console.log('🔗 URL:', url);

    return this.http.get<OrdonnanceResponse>(url, { params }).pipe(
      map(response => {
        console.log('✅ Ordonnances récupérées:', response.content.length);
        console.log('📊 Total:', response.totalElements, '| Pages:', response.totalPages);
        return response;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des ordonnances:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Récupère une ordonnance par son ID
   * @param id - ID de l'ordonnance
   * @returns Observable contenant l'ordonnance
   */
  getOrdonnanceById(id: number): Observable<Ordonnance> {
    const url = `${this.baseUrl}/${id}`;

    console.log('📥 Récupération de l\'ordonnance ID:', id);
    console.log('🔗 URL:', url);

    return this.http.get<Ordonnance>(url).pipe(
      map(ordonnance => {
        console.log('✅ Ordonnance récupérée:', ordonnance.reference);
        return ordonnance;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération de l\'ordonnance:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Récupère les ordonnances d'un patient par son numéro de téléphone
   * @param phone - Numéro de téléphone du patient
   * @param page - Numéro de page (commence à 0)
   * @param size - Nombre d'éléments par page
   * @returns Observable contenant la réponse paginée
   */
  getOrdonnancesByPhone(phone: string, page: number = 0, size: number = 10): Observable<OrdonnanceResponse> {
    // Utiliser l'endpoint by-phone avec patientPhone en query parameter
    const url = `${this.baseUrl}/patient/by-phone`;

    let params = new HttpParams()
      .set('patientPhone', phone)
      .set('page', page.toString())
      .set('size', size.toString());

    console.log('📥 Récupération des ordonnances du patient:', phone);
    console.log('📄 Page:', page, '| Taille:', size);
    console.log('🔗 URL complète:', `${url}?patientPhone=${phone}&page=${page}&size=${size}`);

    return this.http.get<OrdonnanceResponse>(url, { params }).pipe(
      map(response => {
        console.log('✅ Ordonnances récupérées:', response.content.length);
        console.log('📊 Total:', response.totalElements, '| Pages:', response.totalPages);
        return response;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des ordonnances:', error);
        console.error('💡 Erreur détaillée:', error.error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Sauvegarde une nouvelle ordonnance
   * @param request - Données de l'ordonnance à créer
   * @returns Observable contenant l'ordonnance créée
   */
  saveOrdonnance(request: SaveOrdonnanceRequest): Observable<Ordonnance> {
    const url = `${this.baseUrl}/save`;

    console.log('💾 Sauvegarde d\'une nouvelle ordonnance');
    console.log('👨‍⚕️ Docteur ID:', request.doctorId);
    console.log('👤 Patient ID:', request.patientId);
    console.log('🏥 Pharmacie ID:', request.pharmacyId);
    console.log('🔗 URL:', url);

    // Créer un FormData pour envoyer les données en multipart/form-data
    const formData = new FormData();

    formData.append('doctorId', request.doctorId.toString());
    formData.append('patientId', request.patientId.toString());
    formData.append('medications', request.medications);
    formData.append('needsHelp', request.needsHelp.toString());
    formData.append('pharmacyId', request.pharmacyId.toString());
    formData.append('address', request.address);
    formData.append('latitude', request.latitude.toString());
    formData.append('longitude', request.longitude.toString());

    // Ajouter le fichier si présent
    if (request.prescriptionFile) {
      formData.append('prescriptionFile', request.prescriptionFile, request.prescriptionFile.name);
      console.log('📎 Fichier d\'ordonnance ajouté:', request.prescriptionFile.name);
    }

    // Afficher le contenu du FormData pour debug

    return this.http.post<Ordonnance>(url, formData).pipe(
      map(ordonnance => {
        console.log('✅ Ordonnance créée avec succès');
        console.log('🔖 Référence:', ordonnance.reference);
        console.log('🆔 ID:', ordonnance.id);
        return ordonnance;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la sauvegarde de l\'ordonnance:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Récupère les ordonnances par statut
   * @param doctorId - ID du docteur
   * @param status - Statut de l'ordonnance
   * @param page - Numéro de page
   * @param size - Taille de la page
   * @returns Observable contenant la réponse paginée
   */
  getOrdonnancesByStatus(
    doctorId: number,
    status: string,
    page: number = 0,
    size: number = 10
  ): Observable<OrdonnanceResponse> {
    return this.getOrdonnances(doctorId, page, size).pipe(
      map(response => {
        // Filtrer par statut côté client
        const filteredContent = response.content.filter(ord => ord.status === status);
        return {
          ...response,
          content: filteredContent,
          numberOfElements: filteredContent.length,
          totalElements: filteredContent.length
        };
      })
    );
  }

  /**
   * Récupère les statistiques des ordonnances d'un docteur
   * @param doctorId - ID du docteur
   * @returns Observable contenant les statistiques
   */
  getOrdonnancesStats(doctorId: number): Observable<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    inPreparation: number;
    ready: number;
    delivered: number;
  }> {
    return this.getOrdonnances(doctorId, 0, 1000).pipe(
      map(response => {
        const ordonnances = response.content;
        return {
          total: ordonnances.length,
          pending: ordonnances.filter(o => o.status === 'PENDING').length,
          accepted: ordonnances.filter(o => o.status === 'ACCEPTED').length,
          rejected: ordonnances.filter(o => o.status === 'REJECTED').length,
          inPreparation: ordonnances.filter(o => o.status === 'IN_PREPARATION').length,
          ready: ordonnances.filter(o => o.status === 'READY').length,
          delivered: ordonnances.filter(o => o.status === 'DELIVERED').length
        };
      })
    );
  }

  /**
   * Formatte les médicaments en JSON string
   * @param medications - Tableau de médicaments
   * @returns JSON string des médicaments
   */
  formatMedicationsToJson(medications: Medication[]): string {
    return JSON.stringify(medications);
  }

  /**
   * Parse les médicaments depuis un JSON string
   * @param medicationsJson - JSON string des médicaments
   * @returns Tableau de médicaments
   */
  parseMedicationsFromJson(medicationsJson: string): Medication[] {
    try {
      return JSON.parse(medicationsJson);
    } catch (error) {
      console.error('❌ Erreur lors du parsing des médicaments:', error);
      return [];
    }
  }

  /**
   * Gestion centralisée des erreurs
   * @param error - Erreur HTTP
   * @returns Message d'erreur formaté
   */
  private handleError(error: any): string {
    if (error.status === 0) {
      return 'Impossible de contacter le serveur. Vérifiez votre connexion Internet.';
    }

    if (error.status === 401) {
      return 'Non autorisé. Veuillez vous reconnecter.';
    }

    if (error.status === 403) {
      return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
    }

    if (error.status === 404) {
      return 'Ressource non trouvée.';
    }

    if (error.status === 500) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return error.error?.message || error.message || 'Une erreur inattendue est survenue.';
  }

  /**
   * Affiche le contenu d'un FormData dans la console (pour debug)
   * @param formData - FormData à afficher
   */


  /**
   * Obtient le libellé français du statut
   * @param status - Statut de l'ordonnance
   * @returns Libellé français
   */
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'ACCEPTED': 'Acceptée',
      'REJECTED': 'Rejetée',
      'IN_PREPARATION': 'En préparation',
      'READY': 'Prête',
      'DELIVERED': 'Livrée'
    };
    return labels[status] || status;
  }

  /**
   * Obtient la couleur associée au statut
   * @param status - Statut de l'ordonnance
   * @returns Classe CSS pour la couleur
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'warning',
      'ACCEPTED': 'success',
      'REJECTED': 'danger',
      'IN_PREPARATION': 'info',
      'READY': 'success',
      'DELIVERED': 'primary'
    };
    return colors[status] || 'secondary';
  }
}