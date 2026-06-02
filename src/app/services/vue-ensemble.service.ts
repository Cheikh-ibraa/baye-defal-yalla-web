// src/app/services/vue-ensemble.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface ClinicalData {
  id: number;
  sex: string;
  bloodGroup: string;
  weight: number;
  height: number;
  bmi: number;
}

export interface CreateClinicalData {
  sex: string;
  bloodGroup: string;
  weight: number;
  height: number;
  bmi: number;
}

export interface ChronicDisease {
  id: number;
  name: string;
}

export interface CreateChronicDisease {
  name: string;
}

export interface FamilyHistory {
  id: number;
  label: string;
  relatedPerson: string;
}

export interface CreateFamilyHistory {
  label: string;
  relatedPerson: string;
}

export interface Allergy {
  id: number;
  name: string;
}

export interface CreateAllergy {
  name: string;
}

export interface ChirurgicalHistory {
  id: number;
  label: string;
  date: string;
}

export interface CreateChirurgicalHistory {
  label: string;
  date: string;
}

export interface DrugIntolerance {
  id: number;
  medication: string;
  details: string;
}

export interface CreateDrugIntolerance {
  medication: string;
  details: string;
}

export interface Treatment {
  id: number;
  label: string;
  description: string;
}

export interface CreateTreatment {
  label: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class VueEnsembleService {
  private baseApiUrl = environment.baseUrl;
  
  constructor(private http: HttpClient) {}

  // Données cliniques
  getCliniqueData(telephone: string): Observable<ClinicalData> {
    return this.http.get<ClinicalData>(`${this.baseApiUrl}/medical-record/clinical-data/${telephone}`);
  }

  createCliniqueData(telephone: string, data: CreateClinicalData): Observable<ClinicalData> {
    return this.http.post<ClinicalData>(`${this.baseApiUrl}/medical-record/clinical-data/${telephone}`, data);
  }

  deleteCliniqueData(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/clinical-data/${id}`);
  }

  // Maladies chroniques
  getChronicDiseases(telephone: string): Observable<ChronicDisease[]> {
    return this.http.get<ChronicDisease[]>(`${this.baseApiUrl}/medical-record/chronic/${telephone}`);
  }

  createChronicDiseases(telephone: string, data: CreateChronicDisease): Observable<ChronicDisease> {
    return this.http.post<ChronicDisease>(`${this.baseApiUrl}/medical-record/chronic/${telephone}`, data);
  }

  deleteChronicDiseases(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/chronic/${id}`);
  }

  // Antécédents familiaux
  getFamilyHistory(telephone: string): Observable<FamilyHistory[]> {
    return this.http.get<FamilyHistory[]>(`${this.baseApiUrl}/medical-record/family/${telephone}`);
  }

  createFamilyHistory(telephone: string, data: CreateFamilyHistory): Observable<FamilyHistory> {
    return this.http.post<FamilyHistory>(`${this.baseApiUrl}/medical-record/family/${telephone}`, data);
  }

  deleteFamilyHistory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/family/${id}`);
  }

  // Allergies
  getAllergy(telephone: string): Observable<Allergy[]> {
    return this.http.get<Allergy[]>(`${this.baseApiUrl}/medical-record/allergy/${telephone}`);
  }

  createAllergy(telephone: string, data: CreateAllergy): Observable<Allergy> {
    return this.http.post<Allergy>(`${this.baseApiUrl}/medical-record/allergy/${telephone}`, data);
  }

  deleteAllergy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/allergy/${id}`);
  }

  // Antécédents chirurgicaux
  getChirurgicalHistory(telephone: string): Observable<ChirurgicalHistory[]> {
    return this.http.get<ChirurgicalHistory[]>(`${this.baseApiUrl}/medical-record/surgical/${telephone}`);
  }

  createChirurgicalHistory(telephone: string, data: CreateChirurgicalHistory): Observable<ChirurgicalHistory> {
    return this.http.post<ChirurgicalHistory>(`${this.baseApiUrl}/medical-record/surgical/${telephone}`, data);
  }

  deleteChirurgicalHistory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/surgical/${id}`);
  }

  // Intolérances médicamenteuses
  getDrugIntolerance(telephone: string): Observable<DrugIntolerance[]> {
    return this.http.get<DrugIntolerance[]>(`${this.baseApiUrl}/medical-record/intolerance/${telephone}`);
  }

  createDrugIntolerance(telephone: string, data: CreateDrugIntolerance): Observable<DrugIntolerance> {
    return this.http.post<DrugIntolerance>(`${this.baseApiUrl}/medical-record/intolerance/${telephone}`, data);
  }

  deleteDrugIntolerance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/intolerance/${id}`);
  }

  // Traitements
  getTreatment(telephone: string): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${this.baseApiUrl}/medical-record/treatment/${telephone}`);
  }

  createTreatment(telephone: string, data: CreateTreatment): Observable<Treatment> {
    return this.http.post<Treatment>(`${this.baseApiUrl}/medical-record/treatment/${telephone}`, data);
  }

  deleteTreatment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/treatment/${id}`);
  }
}