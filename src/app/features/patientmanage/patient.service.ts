import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private http: HttpClient) {}

  getPatients(search?: string): Observable<any> {
    let params = new HttpParams().set('role', 'patient');
    if (search) params = params.set('q', search);
    return this.http.get('/api/admin/users', { params });
  }

  getPatientsStats(): Observable<any> {
    return this.http.get('/api/admin/patients/stats');
  }
}
