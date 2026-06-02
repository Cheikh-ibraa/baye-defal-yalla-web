// src/app/services/lifestyle.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface Lifestyle {
  id: number;
  dietaryHabits: string;
  physicalActivity: string;
  alcoholConsumption: string;
  smoker: string;
}

export interface CreateLifestyle {
  dietaryHabits: string;
  physicalActivity: string;
  alcoholConsumption: string;
  smoker: string;
}

export interface UpdateLifestyle {
  id: number;
  dietaryHabits: string;
  physicalActivity: string;
  alcoholConsumption: string;
  smoker: string;
}

@Injectable({
  providedIn: 'root'
})
export class LifestyleService {
  private baseApiUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Récupère le mode de vie d'un patient
   */
  getLifeStyle(telephone: string): Observable<Lifestyle> {
    return this.http.get<Lifestyle>(`${this.baseApiUrl}/medical-record/lifestyle/${telephone}`);
  }

  /**
   * Crée un nouveau mode de vie pour un patient
   */
  createLifeStyle(telephone: string, data: CreateLifestyle): Observable<Lifestyle> {
    return this.http.post<Lifestyle>(`${this.baseApiUrl}/medical-record/lifestyle/${telephone}`, data);
  }

  /**
   * Met à jour le mode de vie d'un patient (utilise POST)
   */
  updateLifeStyle(telephone: string, data: UpdateLifestyle): Observable<Lifestyle> {
    return this.http.post<Lifestyle>(`${this.baseApiUrl}/medical-record/lifestyle/${telephone}`, data);
  }
}