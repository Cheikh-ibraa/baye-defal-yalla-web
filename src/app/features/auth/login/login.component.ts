import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  isMobileOnly = false;

  isAlreadyLoggedIn = false;
  currentUserName = '';
  currentDashboardUrl = '';

  private returnUrl = '';

  // Keycloak realm roles → route (rôles en minuscules/tirets côté backend)
  private readonly ROLE_ROUTES: Record<string, string> = {
    'admin':              '/admin/dashboard',
    'doctor':             '/doctor/dashboard',
    'pharmacist':         '/pharmacist/dashboard',
    'hospital':           '/hospital/dashboard',
    'patient':            '/patient/dashboard',
    'donor-individual':   '/donor/dons',
    'donor-organization': '/organization/rapport',
    'supplier':           '/fournisseur/dashboard',
    'lab-technician':     '/laboratory/dashboard',
    'radiologist':        '/imaging/dashboard',
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password:   ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    this.checkAlreadyLoggedIn();
  }

  private checkAlreadyLoggedIn() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return;
      }
      const roles: string[] = payload?.realm_access?.roles ?? [];
      const priority = [
        'admin', 'doctor', 'pharmacist', 'hospital',
        'lab-technician', 'radiologist', 'supplier',
        'donor-individual', 'donor-organization', 'patient',
      ];
      const role = priority.find(r => roles.includes(r)) ?? '';
      if (!role) return;

      this.isAlreadyLoggedIn = true;
      const firstName = payload.given_name ?? '';
      const lastName  = payload.family_name ?? '';
      this.currentUserName = `${firstName} ${lastName}`.trim() || payload.preferred_username || '';
      this.currentDashboardUrl = this.ROLE_ROUTES[role] ?? '/';
    } catch { /* token malformé */ }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    this.isAlreadyLoggedIn = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { identifier, password, rememberMe } = this.loginForm.value;

    this.loginForm.disable();

    this.http.post<LoginResponse>(`${environment.baseUrl}/auth/login`, {
      identifier: identifier.trim(),
      password
    }).subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
        }

        const role = this.getRoleFromToken(res.accessToken);
        this.isLoading = false;

        // Stocker user_data pour que le sidebar affiche le bon menu
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
        try {
          const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
          localStorage.setItem('user_data', JSON.stringify({
            id: 0,
            nom:       payload.family_name ?? '',
            prenom:    payload.given_name  ?? '',
            email:     payload.email       ?? '',
            telephone: payload.preferred_username ?? '',
            adress: '',
            lat: null,
            lon: null,
            profil: PROFIL_MAP[role] ?? role.toUpperCase(),
          }));
        } catch { /* token malformé */ }

        // Le patient utilise uniquement l'application mobile
        if (role === 'patient') {
          this.isMobileOnly = true;
          return;
        }

        const target = this.returnUrl && this.returnUrl !== '/login'
          ? this.returnUrl
          : (this.ROLE_ROUTES[role] ?? '/dashboard');

        this.router.navigateByUrl(target);
      },
      error: (err) => {
        this.loginForm.enable();
        this.isLoading = false;
        const msg = err?.error?.message;
        this.errorMessage = Array.isArray(msg)
          ? msg.join(', ')
          : (msg ?? 'Identifiant ou mot de passe incorrect');
      }
    });
  }

  private getRoleFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload?.realm_access?.roles ?? [];
      // Ordre de priorité : les rôles admin/pro en premier
      const priority = [
        'admin', 'doctor', 'pharmacist', 'hospital',
        'lab-technician', 'radiologist', 'supplier',
        'donor-individual', 'donor-organization', 'patient'
      ];
      for (const role of priority) {
        if (roles.includes(role)) return role;
      }
    } catch { /* token malformé */ }
    return 'patient';
  }

  hasError(field: string): boolean {
    const c = this.loginForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getErrorMessage(field: string): string {
    const c = this.loginForm.get(field);
    if (c?.hasError('required')) return 'Ce champ est requis';
    return '';
  }

  clearErrorMessage() {
    this.errorMessage = '';
  }

  resetForm() {
    this.loginForm.reset();
    this.errorMessage = '';
    this.showPassword = false;
  }

  get f() { return this.loginForm.controls; }
}
