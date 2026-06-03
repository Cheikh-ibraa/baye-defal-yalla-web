import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

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

// Local in-memory state for the gestion-stock feature (UI-only)
export const stockState = (() => {
  let nextId = 1;
  let data: Stock[] = [];

  // initialize demo data
  for (let i = 1; i <= 42; i++) {
    const qty = Math.floor(Math.random() * 50);
    const critical = Math.floor(Math.random() * 10);
    data.push({
      id: i,
      name: `Produit ${i}`,
      description: `Description du produit ${i}`,
      quantity: qty,
      criticalThreshold: critical,
      pharmacyId: 1,
      unitPrice: Math.floor(Math.random() * 5000) + 100,
      stockLevel: qty === 0 ? 'Rupture' : (qty <= critical ? 'Stock faible' : 'En stock')
    });
    nextId = i + 1;
  }

  function saveStock(stock: CreateStockRequest): Observable<Stock> {
    const created: Stock = {
      ...stock,
      id: nextId++,
      stockLevel: stock.quantity === 0 ? 'Rupture' : (stock.quantity <= stock.criticalThreshold ? 'Stock faible' : 'En stock')
    };
    data.unshift(created);
    return of(created).pipe(delay(300));
  }

  function getStock(pharmacyId: number, params?: PaginationParams): Observable<StockPageResponse> {
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? 'id';
    const direction = params?.direction ?? 'asc';

    const filtered = data.filter(d => d.pharmacyId === pharmacyId);

    const sorted = filtered.sort((a, b) => {
      let aVal: any = (a as any)[sortBy];
      let bVal: any = (b as any)[sortBy];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    const totalElements = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const content = sorted.slice(start, start + size).map(s => ({ ...s }));

    const response: StockPageResponse = {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { unsorted: false, sorted: true, empty: false },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalElements,
      totalPages,
      last: page >= totalPages - 1,
      numberOfElements: content.length,
      size,
      number: page,
      sort: { unsorted: false, sorted: true, empty: false } as Sort,
      first: page === 0,
      empty: content.length === 0
    };

    return of(response).pipe(delay(250));
  }

  function updateStock(id: number, stock: CreateStockRequest): Observable<Stock> {
    const idx = data.findIndex(s => s.id === id);
    if (idx === -1) return throwError(() => new Error('Stock non trouvé'));
    const updated: Stock = {
      ...data[idx],
      ...stock,
      id
    };
    updated.stockLevel = updated.quantity === 0 ? 'Rupture' : (updated.quantity <= updated.criticalThreshold ? 'Stock faible' : 'En stock');
    data[idx] = updated;
    return of(updated).pipe(delay(300));
  }

  function deleteStock(id: number) {
    data = data.filter(s => s.id !== id);
    return of(null).pipe(delay(200));
  }

  function getStockById(id: number) {
    const found = data.find(s => s.id === id);
    if (!found) return throwError(() => new Error('Stock non trouvé'));
    return of({ ...found }).pipe(delay(150));
  }

  function addStock(id: number, quantity: number) {
    const idx = data.findIndex(s => s.id === id);
    if (idx === -1) return throwError(() => new Error('Stock non trouvé'));
    data[idx].quantity += quantity;
    data[idx].stockLevel = data[idx].quantity === 0 ? 'Rupture' : (data[idx].quantity <= data[idx].criticalThreshold ? 'Stock faible' : 'En stock');
    return of({ ...data[idx] }).pipe(delay(200));
  }

  function removeStock(id: number, quantity: number) {
    const idx = data.findIndex(s => s.id === id);
    if (idx === -1) return throwError(() => new Error('Stock non trouvé'));
    data[idx].quantity = Math.max(0, data[idx].quantity - quantity);
    data[idx].stockLevel = data[idx].quantity === 0 ? 'Rupture' : (data[idx].quantity <= data[idx].criticalThreshold ? 'Stock faible' : 'En stock');
    return of({ ...data[idx] }).pipe(delay(200));
  }

  function createPaginationParams(page: number = 0, size: number = 10, sortBy: string = 'id', direction: 'asc' | 'desc' = 'asc') {
    return { page, size, sortBy, direction } as PaginationParams;
  }

  return {
    saveStock,
    getStock,
    updateStock,
    deleteStock,
    getStockById,
    addStock,
    removeStock,
    createPaginationParams
  };
})();
