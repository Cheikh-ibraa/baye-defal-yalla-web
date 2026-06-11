import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  isActive: boolean;
  doctorProfile?: DoctorProfile;
  patientProfile?: any;
  pharmacistProfile?: any;
}

export interface DoctorProfile {
  id: string;
  specialization: string;
  licenseNumber: string;
  hospitalName: string;
  phone: string;
  biography?: string;
  validationStatus: 'pending' | 'approved' | 'rejected';
}

export interface DoctorDocument {
  id: string;
  type: 'IDENTITY_CARD' | 'ORDER_CERTIFICATE' | 'DIPLOMA' | 'OTHER';
  label: string;
  fileUrl?: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED';
  comment?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/users/me`);
  }

  updateMe(dto: { firstName?: string; lastName?: string; phone?: string; email?: string }): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.base}/users/me`, dto);
  }

  updateDoctorProfile(dto: {
    specialization?: string;
    licenseNumber?: string;
    hospitalName?: string;
    phone?: string;
    biography?: string;
  }): Observable<DoctorProfile> {
    return this.http.post<DoctorProfile>(`${this.base}/users/me/doctor-profile`, dto);
  }

  getDoctorDocuments(): Observable<DoctorDocument[]> {
    return this.http.get<DoctorDocument[]>(`${this.base}/users/me/documents`);
  }

  addDoctorDocument(dto: { type: string; label: string; fileUrl?: string }): Observable<DoctorDocument> {
    return this.http.post<DoctorDocument>(`${this.base}/users/me/documents`, dto);
  }

  deleteDoctorDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me/documents/${id}`);
  }
}
