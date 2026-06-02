import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Interfaces pour le typage des réponses
export interface AmountStats {
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalPaidCount: number;
}

export interface WithdrawalItem {
  id: number;
  reference: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: string;
  comment: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface WithdrawalHistoryResponse {
  content: WithdrawalItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

export interface BankParameterRequest {
  bankName: string;
  rib: string;
  phone: string;
  fullName: string;
  pharmacyId: number;
}

export interface BankParameterResponse {
  id: number;
  bankName: string;
  rib: string;
  phone: string;
  fullName: string;
}

export interface CreateWithdrawalRequest {
  pharmacyId: number;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface StatsSales {
  pharmacyId: number;
  year: number;
  totalYearAmount: number;
  totalMonthAmount: number;
}

export interface PharmacistBasic {
  id: number;
  nom: string;
  prenom: string;
}

export interface PharmacyByPharmacistInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  hourly: string | null;
  pharmacist: PharmacistBasic;
}

export interface PharmacySearchResult {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
  distance?: number;
}

export interface PendingPaymentCount {
  count: number;
}

export interface RevenueLast7Days {
  date: string;
  total: number;
}

export interface Doctor {
  id: number;
  reference: string;
  lat: number;
  lon: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  adress: string;
  technicalSheet: any;
  profil: string;
  activated: boolean;
  notifiable: boolean;
  online: boolean;
  telephone: string;
  funds: number;
  photo: string;
  validated: boolean;
  accountNonExpired: boolean;
  credentialsNonExpired: boolean;
  authorities: Array<{ authority: string }>;
  username: string;
  accountNonLocked: boolean;
  averageRating: number;
  enabled: boolean;
}

export interface Patient {
  id: number;
  reference: string;
  lat: number;
  lon: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  adress: string;
  technicalSheet: any;
  profil: string;
  activated: boolean;
  notifiable: boolean;
  online: boolean;
  telephone: string;
  funds: number;
  photo: string;
  validated: boolean;
  accountNonExpired: boolean;
  credentialsNonExpired: boolean;
  authorities: Array<{ authority: string }>;
  username: string;
  accountNonLocked: boolean;
  averageRating: number;
  enabled: boolean;
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  hourly: any;
  latitude: number;
  longitude: number;
  pharmacist: Doctor;
  logo: string;
}

export interface Prescription {
  id: number;
  doctor: Doctor;
  patient: Patient;
  reference: string;
  status: string;
  qrCodeUrl: string;
  medications: any[];
  fullyPaidByDonor: boolean;
  partiallyPaidByDonor: boolean;
  pharmacy: Pharmacy;
  amount: number;
  amountContributed: number;
  needsHelp: boolean;
  address: string;
  latitude: number;
  longitude: number;
  prescriptionFile: string;
}

export interface PaymentItem {
  id: number;
  amount: number;
  paidAt: string;
  method: string;
  prescription: Prescription;
}

export interface PaymentHistoricResponse {
  content: PaymentItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PharmacieService {
  private baseUrl = 'https://wakana.online/pharma-delivery/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🔧 PharmacieService initialisé');
  }

  /**
   * Recherche des pharmacies par nom avec autocomplétion
   * GET /api/pharmacies/search
   */
  searchPharmacies(
    name: string,
    latitude: number = 0,
    longitude: number = 0,
    page: number = 0,
    size: number = 10
  ): Observable<PharmacySearchResult[]> {
    let params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    if (name && name.trim()) {
      params = params.set('name', name.trim());
    }
    const url = `${this.baseUrl}/pharmacies/search`;
    return this.http.get<any>(url, { params }).pipe(
      tap(data => console.log('✅ Pharmacies trouvées:', data)),
      catchError(error => this.handleError(error, 'searchPharmacies'))
    );
  }

  /**
   * Récupère les informations de la pharmacie par l'ID du pharmacien connecté
   * GET /api/pharmacies/by-pharmacist/{pharmacistId}
   */
  getPharmacyByPharmacist(pharmacistId: number): Observable<PharmacyByPharmacistInfo> {
    const url = `${this.baseUrl}/pharmacies/by-pharmacist/${pharmacistId}`;
    console.log('📡 API Call: getPharmacyByPharmacist', url);
    return this.http.get<PharmacyByPharmacistInfo>(url).pipe(
      tap(data => console.log('✅ Pharmacie récupérée:', data)),
      catchError(error => this.handleError(error, 'getPharmacyByPharmacist'))
    );
  }

  /**
   * Récupère le solde du dashboard d'une pharmacie
   */
  getSoldeDashboard(pharmacyId: number): Observable<number> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/pharmacies/balance/${pharmacyId}`;

    console.log('📡 API Call: getSoldeDashboard');
    console.log('🔗 URL:', url);
    console.log('🏥 Pharmacy ID:', pharmacyId);

    return this.http.get<number>(url, { headers })
      .pipe(
        tap(solde => {
          console.log('✅ Solde dashboard récupéré:', solde);
        }),
        catchError(error => this.handleError(error, 'getSoldeDashboard'))
      );
  }

  /**
   * Récupère les statistiques de retraits
   */
  getAmount(pharmacyId?: number, year?: number): Observable<AmountStats> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();

    if (pharmacyId) {
      params = params.set('pharmacyId', pharmacyId.toString());
    }
    if (year) {
      params = params.set('year', year.toString());
    }

    const url = `${this.baseUrl}/withdrawals/stats`;

    console.log('📡 API Call: getAmount');
    console.log('🔗 URL:', url);
    console.log('🏥 Pharmacy ID:', pharmacyId || 'Non spécifié');
    console.log('📅 Year:', year || 'Non spécifié');

    return this.http.get<AmountStats>(url, { headers, params })
      .pipe(
        tap(stats => {
          console.log('✅ Statistiques retraits récupérées:');
          console.log('  - Montant total payé:', stats.totalPaidAmount);
          console.log('  - Montant total en attente:', stats.totalPendingAmount);
          console.log('  - Nombre total payé:', stats.totalPaidCount);
        }),
        catchError(error => this.handleError(error, 'getAmount'))
      );
  }

  /**
   * Récupère l'historique des retraits d'une pharmacie
   */
  getHistoriques(pharmacyId: number, status?: string, page: number = 0, size: number = 10): Observable<WithdrawalHistoryResponse> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    const url = `${this.baseUrl}/withdrawals/pharmacy/${pharmacyId}`;

    console.log('📡 API Call: getHistoriques');
    console.log('🔗 URL:', url);
    console.log('🏥 Pharmacy ID:', pharmacyId);
    console.log('📊 Status:', status || 'Tous');
    console.log('📄 Page:', page);
    console.log('📊 Size:', size);

    return this.http.get<WithdrawalHistoryResponse>(url, { headers, params })
      .pipe(
        tap(response => {
          console.log('✅ Historique retraits récupéré:');
          console.log('  - Total éléments:', response.totalElements);
          console.log('  - Pages totales:', response.totalPages);
          console.log('  - Page actuelle:', response.number);
          console.log('  - Retraits:', response.content.length);
        }),
        catchError(error => this.handleError(error, 'getHistoriques'))
      );
  }

  /**
   * Sauvegarde les paramètres bancaires d'une pharmacie
   */
  saveBankParameter(data: BankParameterRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/pharmacies/pharmacy-bank/save`;

    console.log('📡 API Call: saveBankParameter');
    console.log('🔗 URL:', url);
    console.log('🏦 Données bancaires:', data);

    return this.http.post(url, data, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Paramètres bancaires sauvegardés:', response);
        }),
        catchError(error => this.handleError(error, 'saveBankParameter'))
      );
  }

  /**
   * Met à jour les paramètres bancaires d'une pharmacie
   */
  updateBankParameter(id: number, data: BankParameterRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/pharmacies/pharmacy-bank/${id}`;

    console.log('📡 API Call: updateBankParameter');
    console.log('🔗 URL:', url);
    console.log('🏦 Données bancaires:', data);

    return this.http.put(url, data, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Paramètres bancaires mis à jour:', response);
        }),
        catchError(error => this.handleError(error, 'updateBankParameter'))
      );
  }

  /**
   * Récupère les paramètres bancaires d'une pharmacie
   */
  getBankParameterByPharmacyId(pharmacyId: number): Observable<BankParameterResponse> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/pharmacies/pharmacy-bank/pharmacy/${pharmacyId}`;

    console.log('📡 API Call: getBankParameterByPharmacyId');
    console.log('🔗 URL:', url);
    console.log('🏥 Pharmacy ID:', pharmacyId);

    return this.http.get<BankParameterResponse>(url, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Paramètres bancaires récupérés:', response);
        }),
        catchError(error => this.handleError(error, 'getBankParameterByPharmacyId'))
      );
  }

  /**
   * Crée une demande de retrait
   */
  createWithdrawal(data: CreateWithdrawalRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/withdrawals`;

    console.log('📡 API Call: createWithdrawal');
    console.log('🔗 URL:', url);
    console.log('💸 Données retrait:', data);

    return this.http.post(url, data, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Demande de retrait créée:', response);
        }),
        catchError(error => this.handleError(error, 'createWithdrawal'))
      );
  }

  /**
   * Récupère les statistiques de vente d'une pharmacie
   */
  getStatsSlate(pharmacyId: number, year?: number): Observable<StatsSales> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();

    if (year) {
      params = params.set('year', year.toString());
    }

    const url = `${this.baseUrl}/payments/stats-sales/${pharmacyId}`;

    console.log('📡 API Call: getStatsSlate');
    console.log('🔗 URL:', url);
    console.log('🏥 Pharmacy ID:', pharmacyId);
    console.log('📅 Year:', year || 'Année actuelle');

    return this.http.get<StatsSales>(url, { headers, params })
      .pipe(
        tap(stats => {
          console.log('✅ Statistiques ventes récupérées:');
          console.log('  - Montant annuel:', stats.totalYearAmount);
          console.log('  - Montant mensuel:', stats.totalMonthAmount);
        }),
        catchError(error => this.handleError(error, 'getStatsSlate'))
      );
  }

  /**
   * Récupère le nombre de paiements en attente d'une pharmacie
   */
  getPendingPayment(pharmacyId: number): Observable<PendingPaymentCount> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/payments/pending-payment/${pharmacyId}`;

    console.log('📡 API Call: getPendingPayment');
    console.log('🔗 URL:', url);
    console.log('🏥 Pharmacy ID:', pharmacyId);

    return this.http.get<PendingPaymentCount>(url, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Paiements en attente récupérés:', response.count);
        }),
        catchError(error => this.handleError(error, 'getPendingPayment'))
      );
  }

  /**
   * Récupère le revenu des 7 derniers jours
   */
  getRevenuLast7days(pharmacyId: number): Observable<RevenueLast7Days[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/payments/last7days/${pharmacyId}`;

    console.log('📡 API Call: getRevenuLast7days');
    console.log('🔗 URL:', url);

    return this.http.get<RevenueLast7Days[]>(url, { headers })
      .pipe(
        tap(revenue => {
          console.log('✅ Revenu 7 derniers jours récupéré:');
          console.log('  - Nombre de jours:', revenue.length);
          console.log('  - Total 7 jours:', revenue.reduce((sum, item) => sum + item.total, 0));
        }),
        catchError(error => this.handleError(error, 'getRevenuLast7days'))
      );
  }

  /**
   * Récupère l'historique des paiements d'une pharmacie
   */
  getPaymentHistoric(pharmacyId: number, page: number = 0, size: number = 10): Observable<PaymentHistoricResponse> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const url = `${this.baseUrl}/payments/historic-pharmacy/${pharmacyId}`;

    return this.http.get<PaymentHistoricResponse>(url, { headers, params })
      .pipe(
        tap(response => {
          console.log('✅ Historique paiements récupéré:');
          console.log('  - Total éléments:', response.totalElements);
          console.log('  - Pages totales:', response.totalPages);
          console.log('  - Page actuelle:', response.number);
          console.log('  - Paiements:', response.content.length);
        }),
        catchError(error => this.handleError(error, 'getPaymentHistoric'))
      );
  }

  /**
   * Récupère les headers d'authentification
   */
  private getAuthHeaders(): HttpHeaders {
    console.log('🔑 Récupération des headers d\'authentification...');

    if (this.authService && typeof this.authService.getAuthHeaders === 'function') {
      const headers = this.authService.getAuthHeaders();
      const hasAuth = headers.get('Authorization') !== null;

      console.log('🔑 Headers depuis AuthService:', hasAuth ? '✅ OK' : '❌ Manquant');

      if (!hasAuth) {
        console.warn('⚠️ Aucun header Authorization trouvé!');
      }

      return headers;
    }

    console.warn('⚠️ AuthService.getAuthHeaders() non disponible, utilisation du fallback');

    const token = this.authService?.getToken() || localStorage.getItem('token');

    if (token) {
      console.log('🔑 Token trouvé:', token.substring(0, 20) + '...');
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }

    console.error('❌ Aucun token d\'authentification trouvé!');

    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Gestion des erreurs HTTP avec contexte
   */
  private handleError(error: any, context: string = 'unknown'): Observable<never> {
    console.error(`❌ Erreur dans PharmacieService.${context}:`, error);
    console.error('❌ Status:', error.status);
    console.error('❌ Status Text:', error.statusText);
    console.error('❌ URL:', error.url);
    console.error('❌ Message:', error.message);

    if (error.error) {
      console.error('❌ Error body:', error.error);
    }

    let errorMessage = 'Une erreur est survenue';
    let userMessage = errorMessage;

    switch (error.status) {
      case 0:
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
        userMessage = 'Problème de connexion au serveur';
        break;
      case 400:
        errorMessage = 'Requête invalide. Vérifiez les paramètres.';
        userMessage = 'Données invalides';
        break;
      case 401:
        errorMessage = 'Non authentifié. Votre session a expiré.';
        userMessage = 'Session expirée. Veuillez vous reconnecter.';
        break;
      case 403:
        errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
        userMessage = 'Accès non autorisé';
        break;
      case 404:
        errorMessage = `Ressource non trouvée.`;
        userMessage = 'Données introuvables';
        break;
      case 500:
        errorMessage = 'Erreur serveur interne.';
        userMessage = 'Erreur serveur. Réessayez plus tard.';
        break;
      default:
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Erreur client: ${error.error.message}`;
          userMessage = 'Erreur de connexion';
        } else {
          errorMessage = `Code: ${error.status}, Message: ${error.message}`;
          userMessage = `Erreur ${error.status}`;
        }
    }

    console.error('💬 Message utilisateur:', userMessage);

    return throwError(() => ({
      message: errorMessage,
      userMessage: userMessage,
      status: error.status,
      context: context,
      originalError: error
    }));
  }

  /**
   * Formate les données de paramètres bancaires
   */
  formatBankData(
    bankName: string,
    rib: string,
    phone: string,
    fullName: string,
    pharmacyId: number
  ): BankParameterRequest {
    return {
      bankName,
      rib,
      phone,
      fullName,
      pharmacyId
    };
  }

  /**
   * Debug des endpoints disponibles
   */
  debugEndpoints(): void {
    console.log('🔍 === PHARMACIE SERVICE ENDPOINTS ===');
    console.log('Base URL:', this.baseUrl);
    console.log('Endpoints disponibles:');
    console.log('  - getSoldeDashboard: GET', `${this.baseUrl}/pharmacies/balance/{id}`);
    console.log('  - getAmount: GET', `${this.baseUrl}/withdrawals/stats?pharmacyId={id}&year={year}`);
    console.log('  - getHistoriques: GET', `${this.baseUrl}/withdrawals/pharmacy/{pharmacyId}?status={status}&page={page}&size={size}`);
    console.log('  - saveBankParameter: POST', `${this.baseUrl}/pharmacies/pharmacy-bank/save`);
    console.log('  - updateBankParameter: PUT', `${this.baseUrl}/pharmacies/pharmacy-bank/{id}`);
    console.log('  - getBankParameterByPharmacyId: GET', `${this.baseUrl}/pharmacies/pharmacy-bank/pharmacy/{pharmacyId}`);
    console.log('  - getStatsSlate: GET', `${this.baseUrl}/payments/stats-sales/{pharmacyId}?year={year}`);
    console.log('  - getPendingPayment: GET', `${this.baseUrl}/payments/pending-payment/{pharmacyId}`);
    console.log('  - getRevenuLast7days: GET', `${this.baseUrl}/payments/last7days`);
    console.log('  - getPaymentHistoric: GET', `${this.baseUrl}/payments/historic-pharmacy/{pharmacyId}?page={page}&size={size}`);
    console.log('========================');
  }
}