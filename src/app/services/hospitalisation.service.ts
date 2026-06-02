// src/app/services/hospitalisation.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// ========== INTERFACES ==========

export interface Authority {
  authority: string;
}

export interface User {
  id: number;
  reference: string | null;
  lat: number;
  lon: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  adress: string;
  technicalSheet: string | null;
  profil: string;
  activated: boolean;
  notifiable: boolean;
  online: boolean;
  telephone: string;
  funds: number;
  photo: string | null;
  validated: boolean;
  accountNonExpired: boolean;
  credentialsNonExpired: boolean;
  authorities: Authority[];
  username: string;
  accountNonLocked: boolean;
  averageRating: number;
  enabled: boolean;
}

export interface FacilityType {
  id: number;
  name: string;
}

export interface Facility {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  type: FacilityType;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  facility: Facility;
}

export interface Hospitalization {
  id: number;
  patient: User;
  facility: Facility;
  department: Department;
  responsibleMedical: User;
  hospitalizationReason: string;
  initialDiagnosis: string;
  observation: string;
  entryDateTime: string;
  exitDateTime: string | null;
  room: string;
  bedNumber: string;
  priority: 'NORMAL' | 'URGENCE';
}

export interface CreateHospitalizationRequest {
  patientId: number;
  facilityId: number;
  departmentId: number;
  responsibleMedicalId: number;
  hospitalizationReason: string;
  initialDiagnosis: string;
  observation: string;
  entryDateTime: string;
  exitDateTime: string;
  room: string;
  bedNumber: string;
  priority: string;
}

export interface UpdateHospitalizationRequest {
  patientId?: number;
  facilityId?: number;
  departmentId?: number;
  responsibleMedicalId?: number;
  hospitalizationReason?: string;
  initialDiagnosis?: string;
  observation?: string;
  entryDateTime?: string;
  exitDateTime?: string;
  room?: string;
  bedNumber?: string;
  priority?: string;
}

export interface PageableResponse<T> {
  content: T[];
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

export interface ActionType {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface JournalAction {
  id: number;
  hospitalization: Hospitalization;
  actionDateTime: string;
  type: ActionType;
  description: string;
  remark: string;
  author: User;
}

export interface CreateActionRequest {
  hospitalizationId: number;
  actionTypeId: number;
  authorId: number;
  actionDateTime: string;
  description: string;
  remark: string;
}

export interface CreateDischargeOrderRequest {
  hospitalizationId: number;
  dischargeDateTime: string;
  patientCondition: string;
  postHospitalizationRecommendations: string;
  homeTreatment: string;
  comment: string;
}

export interface DischargeOrder {
  id: number;
  hospitalization: Hospitalization;
  dischargeDateTime: string;
  patientCondition: string;
  postHospitalizationRecommendations: string;
  homeTreatment: string;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class HospitalisationService {
  private baseApiUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // ========== HOSPITALISATIONS ==========

  /**
   * Récupère les hospitalisations d'un patient avec filtres et pagination
   */
  getHospitalisationsByPatient(
    telephone: string,
    facilityId?: number,
    departmentId?: number,
    responsibleMedicalId?: number,
    page: number = 0,
    size: number = 10
  ): Observable<PageableResponse<Hospitalization>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (facilityId) {
      params = params.set('facilityId', facilityId.toString());
    }
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    if (responsibleMedicalId) {
      params = params.set('responsibleMedicalId', responsibleMedicalId.toString());
    }

    return this.http.get<PageableResponse<Hospitalization>>(
      `${this.baseApiUrl}/hospitalizations/patient/${telephone}`,
      { params }
    );
  }

  /**
   * Récupère une hospitalisation par ID
   */
  getHospitalisationById(id: number): Observable<Hospitalization> {
    return this.http.get<Hospitalization>(`${this.baseApiUrl}/hospitalizations/${id}`);
  }

  /**
   * Crée une nouvelle hospitalisation
   */
  createHospitalisation(data: CreateHospitalizationRequest): Observable<Hospitalization> {
    return this.http.post<Hospitalization>(`${this.baseApiUrl}/hospitalizations`, data);
  }

  /**
   * Met à jour une hospitalisation
   */
  updateHospitalisation(id: number, data: UpdateHospitalizationRequest): Observable<Hospitalization> {
    return this.http.put<Hospitalization>(`${this.baseApiUrl}/hospitalizations/${id}`, data);
  }

  /**
   * Supprime une hospitalisation
   */
  deleteHospitalisation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/hospitalizations/${id}`);
  }

  // ========== ÉTABLISSEMENTS & DÉPARTEMENTS ==========

  /**
   * Récupère les types d'établissements
   */
  getTypeEtablissement(): Observable<FacilityType[]> {
    return this.http.get<FacilityType[]>(`${this.baseApiUrl}/health-facilities/types`);
  }

  /**
   * Récupère tous les établissements
   */
  getEtablissements(): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.baseApiUrl}/health-facilities`);
  }

  /**
   * Récupère les départements d'un établissement
   */
  getDepartements(facilityId: number): Observable<Department[]> {
    return this.http.get<Department[]>(
      `${this.baseApiUrl}/health-facilities/departments/facility/${facilityId}`
    );
  }

  // ========== JOURNAL INFIRMIER ==========

  /**
   * Récupère les types d'actions
   */
  getTypeActions(): Observable<ActionType[]> {
    return this.http.get<ActionType[]>(`${this.baseApiUrl}/hospitalizations/journal/journal-action-types`);
  }

  /**
   * Crée un nouveau type d'action (multipart/form-data avec icon obligatoire)
   */
  createActionType(formData: FormData): Observable<ActionType> {
    return this.http.post<ActionType>(`${this.baseApiUrl}/hospitalizations/journal/journal-action-types`, formData);
  }

  /**
   * Récupère le journal d'une hospitalisation
   */
  getActions(
    hospitalizationId: number,
    page: number = 0,
    size: number = 10
  ): Observable<PageableResponse<JournalAction>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageableResponse<JournalAction>>(
      `${this.baseApiUrl}/hospitalizations/journal/${hospitalizationId}`,
      { params }
    );
  }

  /**
   * Crée une action dans le journal
   */
  createAction(data: CreateActionRequest): Observable<JournalAction> {
    return this.http.post<JournalAction>(`${this.baseApiUrl}/hospitalizations/journal`, data);
  }

  // ========== SORTIE ==========

  /**
   * Crée un ordre de sortie
   */
  createSortie(data: CreateDischargeOrderRequest): Observable<DischargeOrder> {
    return this.http.post<DischargeOrder>(`${this.baseApiUrl}/hospitalizations/journal/discharge-orders`, data);
  }

  /**
   * Récupère l'ordre de sortie d'une hospitalisation
   */
  recupereOrdreSortie(hospitalizationId: number): Observable<DischargeOrder> {
    return this.http.get<DischargeOrder>(
      `${this.baseApiUrl}/hospitalizations/journal/discharge-orders/hospitalization/${hospitalizationId}`
    );
  }
}