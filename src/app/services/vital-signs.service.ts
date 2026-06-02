// src/app/services/vital-signs.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface VitalSign {
  id: number;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  updatedAt: string;
}

export interface CreateVitalSign {
  id: number;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  updatedAt: string;
}

export interface PageSort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: PageSort;
  first: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VitalSignsService {
  private baseApiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  createVitalSign(telephone: string, data: CreateVitalSign): Observable<VitalSign> {
    return this.http.post<VitalSign>(`${this.baseApiUrl}/medical-record/vital-signs/${telephone}`, data);
  }

  getVitalSigns(telephone: string): Observable<VitalSign> {
    return this.http.get<VitalSign>(`${this.baseApiUrl}/medical-record/vital-signs/${telephone}`);
  }

  getHistory(telephone: string, page: number = 0, size: number = 10): Observable<PageResponse<VitalSign>> {
    return this.http.get<PageResponse<VitalSign>>(
      `${this.baseApiUrl}/medical-record/vital-signs/${telephone}/history?page=${page}&size=${size}`
    );
  }
}