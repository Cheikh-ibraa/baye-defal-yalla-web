import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
// Inlined types from src/app/services/stock.service.ts
interface Stock {
  id?: number;
  name: string;
  description: string;
  quantity: number;
  criticalThreshold: number;
  pharmacyId: number;
  unitPrice: number;
  stockLevel?: string;
}

interface CreateStockRequest {
  name: string;
  description: string;
  quantity: number;
  criticalThreshold: number;
  pharmacyId: number;
  unitPrice: number;
}

interface Sort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

interface StockPageResponse {
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

interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}
// AuthFacade removed — using local mock current user for static UI

@Component({
  selector: 'app-gestion-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-stock.component.html',
  styleUrls: ['./gestion-stock.component.css']
})
export class GestionStockComponent implements OnInit, OnDestroy {
  
  // Data properties
  stocks: Stock[] = [];
  filteredStocks: Stock[] = [];
  
  // Search and filter properties
  searchTerm: string = '';
  
  // Pagination properties
  currentPage: number = 0; // API uses 0-based pagination
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;
  
  // Modal properties
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;

  // Stock action modal properties
  showAddStockModal: boolean = false;
  showRemoveStockModal: boolean = false;
  stockActionQuantity: number = 1;
  stockActionTarget: Stock | null = null;
  stockActionLoading: boolean = false;
  openMenuStockId: number | null = null;
  
  // Form properties
  stockForm: CreateStockRequest = {
    name: '',
    description: '',
    quantity: 0,
    criticalThreshold: 0,
    pharmacyId: 0, // Sera mis à jour dynamiquement
    unitPrice: 0
  };
  
  editingStock: Stock | null = null;
  deletingStockId: number | null = null;

  // User and pharmacy IDs - dynamically retrieved from AuthService
  private userId: number = 0;
  private pharmacyId: number = 0;
  // Local in-component state to simulate backend
  private mockData: Stock[] = [];
  private nextId = 1;
  private destroy$ = new Subject<void>();

  constructor() {
    this.initLocalStockData();
  }

  private initLocalStockData(): void {
    for (let i = 1; i <= 42; i++) {
      const qty = Math.floor(Math.random() * 50);
      const critical = Math.floor(Math.random() * 10);
      this.mockData.push({
        id: i,
        name: `Produit ${i}`,
        description: `Description du produit ${i}`,
        quantity: qty,
        criticalThreshold: critical,
        pharmacyId: 1,
        unitPrice: Math.floor(Math.random() * 5000) + 100,
        stockLevel: qty === 0 ? 'Rupture' : (qty <= critical ? 'Stock faible' : 'En stock')
      });
      this.nextId = i + 1;
    }
  }

    // Local mock for current user
    private getMockCurrentUser() {
      return { id: 7, prenom: 'Pharmacien', nom: 'Diallo', profil: 'PHARMACIE', pharmacyId: 1 };
    }

    // Local replacement for getCurrentUserById
    private localGetCurrentUserById(id: number) {
      const mock = { id, prenom: 'Pharmacien', nom: 'Diallo', profil: 'PHARMACIE', pharmacyId: 1 };
      return of(mock).pipe(delay(120));
    }

  // Local implementations replacing StockService methods
  private localSaveStock(stock: CreateStockRequest): Observable<Stock> {
    const created: Stock = {
      ...stock,
      id: this.nextId++,
      stockLevel: stock.quantity === 0 ? 'Rupture' : (stock.quantity <= stock.criticalThreshold ? 'Stock faible' : 'En stock')
    };
    this.mockData.unshift(created);
    return of(created).pipe(delay(300));
  }

  private localGetStock(pharmacyId: number, params?: PaginationParams): Observable<StockPageResponse> {
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? 'id';
    const direction = params?.direction ?? 'asc';

    let filtered = this.mockData.filter(d => d.pharmacyId === pharmacyId);
    if (filtered.length === 0) filtered = [...this.mockData];

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
      sort: { unsorted: false, sorted: true, empty: false } as any,
      first: page === 0,
      empty: content.length === 0
    };

    return of(response).pipe(delay(250));
  }

  private localUpdateStock(id: number, stock: CreateStockRequest): Observable<Stock> {
    const idx = this.mockData.findIndex(s => s.id === id);
    if (idx === -1) return throwError(() => new Error('Stock non trouvé'));
    const updated: Stock = { ...this.mockData[idx], ...stock, id };
    updated.stockLevel = updated.quantity === 0 ? 'Rupture' : (updated.quantity <= updated.criticalThreshold ? 'Stock faible' : 'En stock');
    this.mockData[idx] = updated;
    return of(updated).pipe(delay(300));
  }

  private localDeleteStock(id: number): Observable<any> {
    this.mockData = this.mockData.filter(s => s.id !== id);
    return of(null).pipe(delay(200));
  }

  private localAddStock(id: number, quantity: number): Observable<Stock> {
    const idx = this.mockData.findIndex(s => s.id === id);
    if (idx === -1) return throwError(() => new Error('Stock non trouvé'));
    this.mockData[idx].quantity += quantity;
    this.mockData[idx].stockLevel = this.mockData[idx].quantity === 0 ? 'Rupture' : (this.mockData[idx].quantity <= this.mockData[idx].criticalThreshold ? 'Stock faible' : 'En stock');
    return of({ ...this.mockData[idx] }).pipe(delay(200));
  }

  private localRemoveStock(id: number, quantity: number): Observable<Stock> {
    const idx = this.mockData.findIndex(s => s.id === id);
    if (idx === -1) return throwError(() => new Error('Stock non trouvé'));
    this.mockData[idx].quantity = Math.max(0, this.mockData[idx].quantity - quantity);
    this.mockData[idx].stockLevel = this.mockData[idx].quantity === 0 ? 'Rupture' : (this.mockData[idx].quantity <= this.mockData[idx].criticalThreshold ? 'Stock faible' : 'En stock');
    return of({ ...this.mockData[idx] }).pipe(delay(200));
  }

  ngOnInit(): void {
    this.initializeUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser les données utilisateur à partir de l'AuthService
   */
  private initializeUserData(): void {
    // Use local mock current user for static UI
    const currentUser = this.getMockCurrentUser();
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
      console.log('ID utilisateur (mock) récupéré:', this.userId);
      this.loadUserDataAndStocks();
    }
  }

  /**
   * Charger les données utilisateur et ensuite les stocks
   */
  private loadUserDataAndStocks(): void {
    if (this.userId <= 0) {
      console.error('ID utilisateur invalide');
      return;
    }

    this.isLoading = true;
    
    // Use local mock to get user details including pharmacyId
    this.localGetCurrentUserById(this.userId).subscribe({
      next: (user: any) => {
        if (user.pharmacyId) {
          this.pharmacyId = user.pharmacyId;
          this.stockForm.pharmacyId = this.pharmacyId;
          this.loadStocks();
        } else {
          console.error('Aucun ID de pharmacie trouvé pour l\'utilisateur (mock)');
          this.isLoading = false;
          this.showNoPharmacyError();
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des données utilisateur (mock):', error);
        this.isLoading = false;
        this.showUserDataError();
      }
    });
  }

  // Load stocks from API
  loadStocks(): void {
    if (this.pharmacyId <= 0) {
      console.error('ID pharmacie invalide');
      this.loadUserDataAndStocks();
      return;
    }

    this.isLoading = true;
    const params: PaginationParams = {
      page: this.currentPage,
      size: this.itemsPerPage,
      sortBy: 'id',
      direction: 'asc'
    };

    this.localGetStock(this.pharmacyId, params).subscribe({
      next: (response: StockPageResponse) => {
        this.stocks = response.content.map(stock => ({
          ...stock,
          stockLevel: this.calculateStockLevel(stock)
        }));
        this.filteredStocks = [...this.stocks];
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stocks:', error);
        this.isLoading = false;
        
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de charger les stocks',
          icon: 'error',
          confirmButtonColor: '#FF6B6B'
        });
      }
    });
  }

  // Calculate stock level based on quantity and critical threshold
  calculateStockLevel(stock: Stock): string {
    if (stock.quantity === 0) {
      return 'Rupture';
    } else if (stock.quantity <= stock.criticalThreshold) {
      return 'Stock faible';
    } else {
      return 'En stock';
    }
  }

  // Search and filter methods
  filterProducts(): void {
    if (!this.searchTerm.trim()) {
      this.filteredStocks = [...this.stocks];
    } else {
      this.filteredStocks = this.stocks.filter(stock =>
        stock.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        stock.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadStocks();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadStocks();
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 0;
    this.loadStocks();
  }

  // Modal methods
  openAddModal(): void {
    this.stockForm = {
      name: '',
      description: '',
      quantity: 0,
      criticalThreshold: 0,
      pharmacyId: this.pharmacyId, // Utilisation de l'ID dynamique
      unitPrice: 0
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  openEditModal(stock: Stock): void {
    this.editingStock = stock;
    this.stockForm = {
      name: stock.name,
      description: stock.description,
      quantity: stock.quantity,
      criticalThreshold: stock.criticalThreshold,
      pharmacyId: this.pharmacyId, // Utilisation de l'ID dynamique
      unitPrice: stock.unitPrice
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingStock = null;
  }

  openDeleteModal(stockId: number): void {
    this.deletingStockId = stockId;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingStockId = null;
  }

  // CRUD operations
  addProduct(): void {
    if (this.isFormValid()) {
      this.localSaveStock(this.stockForm).subscribe({
        next: (newStock: Stock) => {
          console.log('Produit ajouté avec succès:', newStock);
          
          Swal.fire({
            title: 'Succès !',
            text: 'Le produit a été ajouté avec succès.',
            icon: 'success',
            confirmButtonColor: '#00B894'
          });
          
          this.closeAddModal();
          this.loadStocks(); // Reload the list
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du produit:', error);
          
          Swal.fire({
            title: 'Erreur',
            text: 'Impossible d\'ajouter le produit',
            icon: 'error',
            confirmButtonColor: '#FF6B6B'
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Formulaire invalide',
        text: 'Veuillez remplir tous les champs obligatoires.',
        icon: 'warning',
        confirmButtonColor: '#FF6B6B'
      });
    }
  }

  updateProduct(): void {
    if (this.editingStock && this.isFormValid()) {
      this.localUpdateStock(this.editingStock.id!, this.stockForm).subscribe({
        next: (updatedStock: Stock) => {
          console.log('Produit modifié avec succès:', updatedStock);
          
          Swal.fire({
            title: 'Succès !',
            text: 'Le produit a été modifié avec succès.',
            icon: 'success',
            confirmButtonColor: '#00B894'
          });
          
          this.closeEditModal();
          this.loadStocks(); // Reload the list
        },
        error: (error) => {
          console.error('Erreur lors de la modification du produit:', error);
          
          Swal.fire({
            title: 'Erreur',
            text: 'Impossible de modifier le produit',
            icon: 'error',
            confirmButtonColor: '#FF6B6B'
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Formulaire invalide',
        text: 'Veuillez remplir tous les champs obligatoires.',
        icon: 'warning',
        confirmButtonColor: '#FF6B6B'
      });
    }
  }

  confirmDelete(): void {
    if (this.deletingStockId) {
      const stockToDelete = this.stocks.find(s => s.id === this.deletingStockId);
      const stockName = stockToDelete ? stockToDelete.name : 'ce produit';

      Swal.fire({
        title: 'Confirmer la suppression',
        text: `Êtes-vous sûr de vouloir supprimer "${stockName}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#FF6B6B',
        cancelButtonColor: '#aaa',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          this.localDeleteStock(this.deletingStockId!).subscribe({
            next: () => {
              console.log('Produit supprimé avec succès');
              
              Swal.fire({
                title: 'Supprimé !',
                text: 'Le produit a été supprimé avec succès.',
                icon: 'success',
                confirmButtonColor: '#00B894'
              });
              
              this.closeDeleteModal();
              this.loadStocks(); // Reload the list
            },
            error: (error) => {
              console.error('Erreur lors de la suppression du produit:', error);
              
              Swal.fire({
                title: 'Erreur',
                text: 'Impossible de supprimer le produit',
                icon: 'error',
                confirmButtonColor: '#FF6B6B'
              });
            }
          });
        }
      });
    }
  }

  /**
   * Supprimer un produit (avec confirmation intégrée)
   */
  deleteProduct(stockId: number): void {
    this.deletingStockId = stockId;
    this.confirmDelete();
  }

  /**
   * Rafraîchir les données
   */
  refreshData(): void {
    this.loadStocks();
  }

  // ---- Stock quantity actions ----

  toggleMenu(stockId: number, event: Event): void {
    event.stopPropagation();
    this.openMenuStockId = this.openMenuStockId === stockId ? null : stockId;
  }

  @HostListener('document:click')
  closeAllMenus(): void {
    this.openMenuStockId = null;
  }

  openAddStockModal(stock: Stock): void {
    this.stockActionTarget = stock;
    this.stockActionQuantity = 1;
    this.showAddStockModal = true;
    this.openMenuStockId = null;
  }

  closeAddStockModal(): void {
    this.showAddStockModal = false;
    this.stockActionTarget = null;
  }

  openRemoveStockModal(stock: Stock): void {
    this.stockActionTarget = stock;
    this.stockActionQuantity = 1;
    this.showRemoveStockModal = true;
    this.openMenuStockId = null;
  }

  closeRemoveStockModal(): void {
    this.showRemoveStockModal = false;
    this.stockActionTarget = null;
  }

  submitAddStock(): void {
    if (!this.stockActionTarget?.id || this.stockActionQuantity <= 0) return;
    this.stockActionLoading = true;
    this.localAddStock(this.stockActionTarget.id, this.stockActionQuantity).subscribe({
      next: () => {
        this.stockActionLoading = false;
        this.closeAddStockModal();
        Swal.fire({ title: 'Stock ajouté !', text: `+${this.stockActionQuantity} unité(s) ajoutée(s) avec succès.`, icon: 'success', confirmButtonColor: '#00B894', timer: 2000, showConfirmButton: false });
        this.loadStocks();
      },
      error: () => {
        this.stockActionLoading = false;
        Swal.fire({ title: 'Erreur', text: 'Impossible d\'ajouter du stock.', icon: 'error', confirmButtonColor: '#FF6B6B' });
      }
    });
  }

  submitRemoveStock(): void {
    if (!this.stockActionTarget?.id || this.stockActionQuantity <= 0) return;
    this.stockActionLoading = true;
    this.localRemoveStock(this.stockActionTarget.id, this.stockActionQuantity).subscribe({
      next: () => {
        this.stockActionLoading = false;
        this.closeRemoveStockModal();
        Swal.fire({ title: 'Stock retiré !', text: `-${this.stockActionQuantity} unité(s) retirée(s) avec succès.`, icon: 'success', confirmButtonColor: '#00B894', timer: 2000, showConfirmButton: false });
        this.loadStocks();
      },
      error: () => {
        this.stockActionLoading = false;
        Swal.fire({ title: 'Erreur', text: 'Impossible de retirer du stock.', icon: 'error', confirmButtonColor: '#FF6B6B' });
      }
    });
  }

  // Form validation
  isFormValid(): boolean {
    return this.stockForm.name.trim() !== '' &&
           this.stockForm.description.trim() !== '' &&
           this.stockForm.quantity >= 0 &&
           this.stockForm.criticalThreshold >= 0 &&
           this.stockForm.unitPrice >= 0 &&
           this.pharmacyId > 0;
  }

  // Utility methods
  trackByStockId(index: number, stock: Stock): number {
    return stock.id || index;
  }

  // Method to get status color class
  getStatusColorClass(stockLevel: string): string {
    switch (stockLevel) {
      case 'En stock':
        return 'bg-green-100 text-green-800';
      case 'Stock faible':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rupture':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get pagination info
  get startIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage * this.itemsPerPage) + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems);
  }

  /**
   * Obtenir le nombre total de pages
   */
  getTotalPages(): number {
    return this.totalPages;
  }

  /**
   * Vérifier si on peut aller à la page précédente
   */
  canGoPrevious(): boolean {
    return this.currentPage > 0;
  }

  /**
   * Vérifier si on peut aller à la page suivante
   */
  canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  /**
   * Formater la devise
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Calculer la valeur totale du stock
   */
  calculateStockValue(stock: Stock): number {
    return stock.quantity * stock.unitPrice;
  }

  /**
   * Obtenir la classe CSS pour le niveau de stock critique
   */
  getCriticalLevelClass(stock: Stock): string {
    if (stock.quantity === 0) {
      return 'text-red-600 font-semibold';
    } else if (stock.quantity <= stock.criticalThreshold) {
      return 'text-yellow-600 font-semibold';
    }
    return 'text-green-600';
  }

  /**
   * Vérifier si le stock est critique
   */
  isStockCritical(stock: Stock): boolean {
    return stock.quantity <= stock.criticalThreshold;
  }

  /**
   * Vérifier si le stock est en rupture
   */
  isStockEmpty(stock: Stock): boolean {
    return stock.quantity === 0;
  }

  // Error handling methods
  private showAuthenticationError(): void {
    Swal.fire({
      title: 'Erreur d\'authentification',
      text: 'Vous devez être connecté pour accéder à cette page',
      icon: 'warning',
      confirmButtonColor: '#FF6B6B',
      confirmButtonText: 'OK'
    });
  }

  private showNoPharmacyError(): void {
    Swal.fire({
      title: 'Erreur',
      text: 'Aucune pharmacie associée à votre compte',
      icon: 'warning',
      confirmButtonColor: '#FF6B6B',
      confirmButtonText: 'OK'
    });
  }

  private showUserDataError(): void {
    Swal.fire({
      title: 'Erreur',
      text: 'Impossible de récupérer les informations utilisateur',
      icon: 'error',
      confirmButtonColor: '#FF6B6B',
      confirmButtonText: 'OK'
    });
  }

  // Utility methods for component state
  isUserLoggedIn(): boolean {
    return !!this.getMockCurrentUser();
  }

  getCurrentUserProfile(): string {
    const user = this.getMockCurrentUser();
    return user?.profil || '';
  }

  getCurrentPharmacyId(): number {
    return this.pharmacyId;
  }

  hasValidPharmacy(): boolean {
    return this.pharmacyId > 0;
  }

  /**
   * Obtenir le nombre total de produits en stock
   */
  getTotalProductsInStock(): number {
    return this.stocks.filter(stock => stock.quantity > 0).length;
  }

  /**
   * Obtenir le nombre de produits en rupture
   */
  getOutOfStockCount(): number {
    return this.stocks.filter(stock => stock.quantity === 0).length;
  }

  /**
   * Obtenir le nombre de produits avec stock faible
   */
  getLowStockCount(): number {
    return this.stocks.filter(stock => 
      stock.quantity > 0 && stock.quantity <= stock.criticalThreshold
    ).length;
  }
}