import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../auth.types';

const PROFIL_MAP: Record<string, string> = {
  'admin':              'ADMIN',
  'doctor':             'DOCTOR',
  'pharmacist':         'PHARMACIST',
  'hospital':           'HOSPITAL',
  'lab-technician':     'LABORATORY',
  'radiologist':        'IMAGING_CENTER',
  'supplier':           'FOURNISSEUR',
  'donor-individual':   'DONOR',
  'donor-organization': 'ORGANIZATION',
  'patient':            'PATIENT',
};

const ROLE_PRIORITY = [
  'admin', 'doctor', 'pharmacist', 'hospital',
  'lab-technician', 'radiologist', 'supplier',
  'donor-individual', 'donor-organization', 'patient',
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly rawHttp = new HttpClient(inject(HttpBackend));
  private readonly router  = inject(Router);

  readonly user$ = new BehaviorSubject<User | null>(this.readUserData());

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /** Appeler au démarrage de l'app (APP_INITIALIZER) */
  init(): void {
    const token = localStorage.getItem('access_token');
    if (token) this.scheduleProactiveRefresh(token);
  }

  /** Planifier un refresh proactif 60 s avant l'expiration du JWT */
  scheduleProactiveRefresh(token: string): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload?.exp as number | undefined;
      if (!exp) return;
      const msUntilRefresh = exp * 1000 - Date.now() - 60_000;
      if (msUntilRefresh <= 0) {
        this.doRefresh();
        return;
      }
      this.refreshTimer = setTimeout(() => this.doRefresh(), msUntilRefresh);
    } catch { /* token malformé */ }
  }

  /** Effectuer le refresh et mettre à jour l'état de l'app */
  doRefresh(): void {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return;

    this.rawHttp.post<{ accessToken: string; refreshToken: string }>(
      `${environment.baseUrl}/auth/refresh`,
      { refreshToken: refresh }
    ).subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        const user = this.parseUserData(res.accessToken);
        if (user) {
          localStorage.setItem('user_data', JSON.stringify(user));
          this.user$.next(user);
        }
        this.scheduleProactiveRefresh(res.accessToken);
      },
      error: () => this.logout(),
    });
  }

  /** Mettre à jour manuellement le profil (ex. après modification de profil) */
  updateUser(user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
    this.user$.next(user);
  }

  logout(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    localStorage.clear();
    this.user$.next(null);
    this.router.navigate(['/portail']);
  }

  /** Extraire les données utilisateur du payload JWT */
  parseUserData(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload?.realm_access?.roles ?? [];
      const role = ROLE_PRIORITY.find(r => roles.includes(r)) ?? '';
      const existing = this.readUserData();
      return {
        id:        0,
        nom:       payload.family_name ?? '',
        prenom:    payload.given_name  ?? '',
        email:     payload.email       ?? '',
        telephone: payload.preferred_username ?? '',
        adress:    '',
        lat:       null,
        lon:       null,
        profil:    PROFIL_MAP[role] ?? role.toUpperCase(),
        avatar:    existing?.avatar ?? null,
      };
    } catch { return null; }
  }

  private readUserData(): User | null {
    const stored = localStorage.getItem('user_data');
    if (!stored) return null;
    try { return JSON.parse(stored); }
    catch { return null; }
  }
}
