// src/app/services/vaccination.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface Vaccination {
  id: number;
  vaccineName: string;
  doseNumber: number;
  vaccinationDate: string;
  nextDoseDate: string;
  status: 'PLANNED' | 'DONE' | 'MISSED';
  notes: string;
}

export interface CreateVaccination {
  vaccineName: string;
  doseNumber: number;
  vaccinationDate: string;
  nextDoseDate: string;
  status: 'PLANNED' | 'DONE' | 'MISSED';
  notes: string;
}

export interface UpdateVaccination {
  vaccineName: string;
  doseNumber: number;
  vaccinationDate: string;
  nextDoseDate: string;
  status: 'PLANNED' | 'DONE' | 'MISSED';
  notes: string;
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
export class VaccinationService {
  private baseApiUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getVaccination(telephone: string, page: number = 0, size: number = 10): Observable<PageResponse<Vaccination>> {
    return this.http.get<PageResponse<Vaccination>>(
      `${this.baseApiUrl}/medical-record/vaccinations/${telephone}?page=${page}&size=${size}`
    );
  }

  createVaccination(telephone: string, data: CreateVaccination): Observable<Vaccination> {
    return this.http.post<Vaccination>(`${this.baseApiUrl}/medical-record/vaccinations/${telephone}`, data);
  }

  updateVaccination(telephone: string, id: number, data: UpdateVaccination): Observable<Vaccination> {
    return this.http.put<Vaccination>(`${this.baseApiUrl}/medical-record/vaccinations/${telephone}/${id}`, data);
  }

  deleteVaccination(telephone: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/medical-record/vaccinations/${telephone}/${id}`);
  }
}