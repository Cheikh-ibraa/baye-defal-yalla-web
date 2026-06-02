import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour typer les données
export interface Stock {
  id?: number;
  name: string;
  description: string;
  quantity: number;
  criticalThreshold: number;
  pharmacyId: number;
  unitPrice: number;
  stockLevel?: string;
}

export interface CreateStockRequest {
  name: string;
  description: string;
  quantity: number;
  criticalThreshold: number;
  pharmacyId: number;
  unitPrice: number;
}

export interface Sort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface StockPageResponse {
  content: Stock[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: Sort;
  first: boolean;
  empty: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  apiUrl = 'https://wakana.online/pharma-delivery/api';


  constructor(private http: HttpClient) {}

  /**
   * Créer un nouveau stock
   * @param stock - Les données du stock à créer
   * @returns Observable<Stock>
   */
  saveStock(stock: CreateStockRequest): Observable<Stock> {
    return this.http.post<Stock>(`${this.apiUrl}/stock`, stock);
  }

  /**
   * Récupérer la liste des stocks d'une pharmacie avec pagination
   * @param pharmacyId - L'ID de la pharmacie
   * @param params - Paramètres de pagination optionnels
   * @returns Observable<StockPageResponse>
   */
  getStock(pharmacyId: number, params?: PaginationParams): Observable<StockPageResponse> {
    let httpParams = new HttpParams();
    
    // Paramètres par défaut
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? 'id';
    const direction = params?.direction ?? 'asc';

    httpParams = httpParams.set('page', page.toString());
    httpParams = httpParams.set('size', size.toString());
    httpParams = httpParams.set('sortBy', sortBy);
    httpParams = httpParams.set('direction', direction);

    return this.http.get<StockPageResponse>(
      `${this.apiUrl}/stock/pharmacy/${pharmacyId}`,
      { params: httpParams }
    );
  }

  /**
   * Mettre à jour un stock existant
   * @param id - L'ID du stock à mettre à jour
   * @param stock - Les nouvelles données du stock
   * @returns Observable<Stock>
   */
  updateStock(id: number, stock: CreateStockRequest): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/stock/${id}`, stock);
  }

  /**
   * Supprimer un stock
   * @param id - L'ID du stock à supprimer
   * @returns Observable<any>
   */
  deleteStock(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stock/${id}`);
  }

  /**
   * Récupérer un stock par son ID
   * @param id - L'ID du stock
   * @returns Observable<Stock>
   */
  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/stock/${id}`);
  }

  /**
   * Ajouter de la quantité à un stock
   * @param id - L'ID du stock
   * @param quantity - La quantité à ajouter
   * @returns Observable<Stock>
   */
  addStock(id: number, quantity: number): Observable<Stock> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.post<Stock>(`${this.apiUrl}/stock/${id}/add-stock`, null, { params });
  }

  /**
   * Retirer de la quantité d'un stock
   * @param id - L'ID du stock
   * @param quantity - La quantité à retirer
   * @returns Observable<Stock>
   */
  removeStock(id: number, quantity: number): Observable<Stock> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.post<Stock>(`${this.apiUrl}/stock/${id}/remove-stock`, null, { params });
  }

  /**
   * Méthode utilitaire pour créer les paramètres de pagination
   * @param page - Numéro de page
   * @param size - Taille de page
   * @param sortBy - Champ de tri
   * @param direction - Direction du tri
   * @returns PaginationParams
   */
  createPaginationParams(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'id',
    direction: 'asc' | 'desc' = 'asc'
  ): PaginationParams {
    return { page, size, sortBy, direction };
  }
}