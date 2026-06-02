// services/sms.service.ts (version simplifiée)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface ValidateOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface OtpResponse {
  success: boolean;
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  private baseApiUrl = environment.baseUrl;

  constructor(private http: HttpClient,
    private authService: AuthService

  ) {
  }

  // Méthode pour envoyer l'OTP
  sendOtp(phoneNumber: string): Observable<OtpResponse> {
    const headers = this.authService.createHeaders();

    const request: SendOtpRequest = { phoneNumber };
    return this.http.post<OtpResponse>(`${this.baseApiUrl}/otp/send`, request, { headers });
  }

  // Méthode pour valider l'OTP - retourne directement un boolean
  validateOtp(phoneNumber: string, otp: string): Observable<boolean> {
    const request: ValidateOtpRequest = { phoneNumber, otp };

    return this.http.post<any>(`${this.baseApiUrl}/otp/validate`, request)
      .pipe(
        map(response => {
          if (typeof response === 'boolean') return response;
          return response?.success ?? false;
        }),
        catchError(() => [false])
      );
  }
}