import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DoctorDashboardStats {
  totalPrescriptions: number;
  todayPrescriptions: number;
  pendingValidation: number;
  validatedLast7: number;
  validationRate: number;
}

export interface WeeklyChartPoint {
  day: string;
  count: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  location: string;
  reason: string;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  quantity: number;
  duration: string;
  unitPrice: number;
}

export interface Prescription {
  id: string;
  reference: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  expiryDate: string;
  diagnosis: string;
  items: PrescriptionItem[];
  totalEstimatedCost: number;
  consultationFee: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusCount {
  status: string;
  count: string;
}

export interface DoctorDashboard {
  stats: DoctorDashboardStats;
  weeklyChart: WeeklyChartPoint[];
  upcomingAppointments: Appointment[];
  recentPrescriptions: Prescription[];
  statusDistribution: StatusCount[];
}

export interface DoctorPrescriptionsResponse {
  data: Prescription[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class MedicalService {
  private readonly base = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getDoctorDashboard(): Observable<DoctorDashboard> {
    return this.http.get<DoctorDashboard>(`${this.base}/medical/doctor/dashboard`);
  }

  getDoctorPrescriptions(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<DoctorPrescriptionsResponse> {
    return this.http.get<DoctorPrescriptionsResponse>(`${this.base}/medical/prescriptions/doctor`, {
      params: params as any
    });
  }

  getDoctorAppointments(status?: string): Observable<Appointment[]> {
    const p: any = {};
    if (status) p['status'] = status;
    return this.http.get<Appointment[]>(`${this.base}/medical/appointments/doctor`, { params: p });
  }

  getRecentPatients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/medical/patients/recent`);
  }

  searchPatients(q: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/medical/patients/search`, { params: { q } });
  }
}
