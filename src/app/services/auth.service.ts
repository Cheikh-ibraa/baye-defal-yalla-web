import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

// Interfaces
export interface AuthRequest {
  email: string;
  password: string;
}

export interface OTPRequest {
  email: string;
  otpCode: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  requiresOTP?: boolean;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adress: string;
  lat: number;
  lon: number;
  profil: string;
  pharmacyId: number;
}

export interface AuthResult {
  isSuccess: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  errorMessage?: string;
  requiresOTP?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiEndpoint = 'https://wakana.online/pharma-delivery/api/auth/signin';
  private apiUrl = 'https://wakana.online/pharma-delivery/api/';


  // BehaviorSubject pour suivre l'état d'authentification
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  getAuthHeaders: any;

  constructor(private http: HttpClient) {
    // Vérifer si l'utilisateur est déjà connecté au démarrage
    this.initializeAuthState();
  }

  /**
   * Initialise l'état d'authentification au démarrage de l'application
   */
  private initializeAuthState(): void {
    const token = this.getToken();
    const userData = localStorage.getItem('user_data');


    if (token && this.isTokenValid(token) && userData) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
    }
  }

  getCurrentUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}v1/user/${id}`);
  }

  /**
   * Récupère un utilisateur par son numéro de téléphone
   * @param phone - Numéro de téléphone (ex: "772345678")
   */
  getUserByPhone(phone: string): Observable<User> {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return this.http.get<User>(`${this.apiUrl}v1/user/by-phone?phone=${cleanPhone}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'utilisateur par téléphone:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère un utilisateur par sa référence patient
   * @param reference - Référence du patient (ex: "PT-000245" ou toute autre référence)
   */
  getUserByReference(reference: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}v1/user/by-reference/${reference}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'utilisateur par référence:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les informations de l'utilisateur connecté depuis l'API
   */
  getUserMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}v1/user/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'utilisateur connecté:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crée les en-têtes HTTP nécessaires
   */
  public createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
  }

  /**
   * Méthode d'authentification principale
   */
  authenticate(email: string, password: string): Observable<AuthResult> {
    const authRequest: AuthRequest = {
      email,
      password
    };

    const headers = this.createHeaders();



    return this.http.post<AuthResponse>(this.apiEndpoint, authRequest, { headers }).pipe(
      tap(response => {
      }),
      map(response => {
        if (response?.token) {
          // Décoder le token pour récupérer les infos utilisateur
          const user = this.getUserFromToken(response.token);

          // Stocker les données d'authentification
          this.storeAuthData(response.token, response.refreshToken, user);

          // Mettre à jour les subjects
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);

          return {
            isSuccess: true,
            token: response.token,
            refreshToken: response.refreshToken,
            user: user
          };
        }

        return {
          isSuccess: false,
          errorMessage: 'Réponse invalide du serveur'
        };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur HTTP complète:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url,
          headers: error.headers
        });

        // Vérifier si l'OTP est requis (par exemple, code 202 ou message spécifique)
        if (error.status === 202 || error.error?.requiresOTP) {
          return throwError(() => ({
            isSuccess: false,
            requiresOTP: true,
            errorMessage: 'Code OTP requis',
            httpError: error
          }));
        }

        const errorMessage = this.getErrorMessage(error);

        return throwError(() => ({
          isSuccess: false,
          errorMessage: errorMessage,
          httpError: error
        }));
      })
    );
  }

  /**
   * Vérifie le code OTP
   */
  verifyOTP(email: string, otpCode: string): Observable<AuthResult> {
    const otpRequest: OTPRequest = {
      email,
      otpCode
    };

    const headers = this.createHeaders();

    return this.http.post<AuthResponse>(`${this.apiUrl}auth/verify-otp`, otpRequest, { headers }).pipe(
      map(response => {
        if (response?.token) {
          // Décoder le token pour récupérer les infos utilisateur
          const user = this.getUserFromToken(response.token);

          // Stocker les données d'authentification
          this.storeAuthData(response.token, response.refreshToken, user);

          // Mettre à jour les subjects
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);

          return {
            isSuccess: true,
            token: response.token,
            refreshToken: response.refreshToken,
            user: user
          };
        }

        return {
          isSuccess: false,
          errorMessage: 'Code OTP invalide'
        };
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);

        return throwError(() => ({
          isSuccess: false,
          errorMessage: errorMessage,
          httpError: error
        }));
      })
    );
  }

  /**
   * Stocke les données d'authentification
   */
  private storeAuthData(token: string, refreshToken: string, user: User): void {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  /**
   * Extrait les informations utilisateur du token JWT
   */
  private getUserFromToken(token: string): User {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return {
        id: payload.userId || 0,
        telephone: payload.sub || '',
        profil: payload.profil || '',
        pharmacyId: payload.pharmacyId || 0,
        // Les autres propriétés devront être récupérées via un autre endpoint
        nom: '',
        prenom: '',
        email: '',
        adress: '',
        lat: 0,
        lon: 0
      };
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Vérifie si le token est valide
   */
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiry;
    } catch {
      return false;
    }
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    localStorage.removeItem('selectedPatient');
    localStorage.removeItem('selectedPatientId');

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Récupère l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Récupère le token d'accès
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Récupère le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    const isValid = token !== null && this.isTokenValid(token);
    return isValid;
  }

  /**
   * Rafraîchit le token d'accès
   */
  refreshToken(): Observable<AuthResult> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => ({
        isSuccess: false,
        errorMessage: 'Aucun refresh token disponible'
      }));
    }

    const refreshEndpoint = 'https://wakana.online/pharma-delivery/api/auth/refresh';
    const headers = this.createHeaders();

    return this.http.post<AuthResponse>(refreshEndpoint, { refreshToken }, { headers }).pipe(
      map(response => {
        if (response?.token) {
          const user = this.getUserFromToken(response.token);
          this.storeAuthData(response.token, response.refreshToken, user);

          return {
            isSuccess: true,
            token: response.token,
            refreshToken: response.refreshToken,
            user: user
          };
        }

        return {
          isSuccess: false,
          errorMessage: 'Impossible de rafraîchir le token'
        };
      }),
      catchError(error => {
        this.logout(); // Déconnecter en cas d'erreur
        return throwError(() => ({
          isSuccess: false,
          errorMessage: 'Session expirée'
        }));
      })
    );
  }

  /**
   * Récupère le profil complet de l'utilisateur
   */
  getUserProfile(): Observable<User> {
    const profileEndpoint = 'https://wakana.online/pharma-delivery/api/user/profile';
    const headers = this.createHeaders();
    const token = this.getToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<User>(profileEndpoint, { headers }).pipe(
      tap(user => {
        localStorage.setItem('user_data', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération du profil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Met à jour le profil utilisateur
   */
  updateUserProfile(user: Partial<User>): Observable<User> {
    const updateEndpoint = 'https://wakana.online/pharma-delivery/api/user/profile';
    const headers = this.createHeaders();
    const token = this.getToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.put<User>(updateEndpoint, user, { headers }).pipe(
      tap(updatedUser => {
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  /**
   * Gère les erreurs HTTP et retourne un message approprié
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      return `Erreur réseau: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 0:
          return 'Impossible de contacter le serveur. Vérifiez votre connexion internet ou les paramètres CORS.';
        case 401:
          return 'Identifiants incorrects. Veuillez vérifier votre nom d\'utilisateur et mot de passe.';
        case 403:
          return 'Accès refusé. Vos identifiants sont corrects mais vous n\'avez pas les permissions nécessaires.';
        case 404:
          return 'Service non disponible. L\'API n\'est pas accessible.';
        case 422:
          return 'Données invalides. Vérifiez le format de vos identifiants.';
        case 429:
          return 'Trop de tentatives de connexion. Veuillez patienter avant de réessayer.';
        case 500:
          return 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        case 502:
        case 503:
        case 504:
          return 'Service temporairement indisponible. Veuillez réessayer plus tard.';
        default:
          const serverMessage = error.error?.message || error.error?.error || error.message;
          return serverMessage || `Erreur ${error.status}: ${error.statusText}`;
      }
    }
  }

  /**
   * Vérifie les permissions de l'utilisateur
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.profil === role;
  }

  /**
   * Vérifie si l'utilisateur a les permissions admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Vérifie si l'utilisateur appartient à une pharmacie spécifique
   */
  belongsToPharmacy(pharmacyId: number): boolean {
    const user = this.getCurrentUser();
    return user?.pharmacyId === pharmacyId;
  }

  /**
   * Teste la connectivité avec l'API
   */
  testConnection(): Observable<any> {
    const testEndpoint = 'https://wakana.online/pharma-delivery/api/health';
    const headers = this.createHeaders();

    return this.http.get(testEndpoint, { headers }).pipe(
      catchError(error => {
        console.error('Test de connexion échoué:', error);
        return throwError(() => error);
      })
    );
  }
}