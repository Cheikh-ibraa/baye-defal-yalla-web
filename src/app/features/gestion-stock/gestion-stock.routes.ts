import { Routes } from '@angular/router';

export const GESTION_STOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./gestion-stock.component').then(m => m.GestionStockComponent)
  },
//   {
//     path: 'produits',
//     loadComponent: () => import('./produits/produits.component').then(m => m.ProduitsComponent)
//   },
//   {
//     path: 'categories',
//     loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent)
//   },
//   {
//     path: 'inventaire',
//     loadComponent: () => import('./inventaire/inventaire.component').then(m => m.InventaireComponent)
//   },
//   {
//     path: 'mouvements',
//     loadComponent: () => import('./mouvements/mouvements.component').then(m => m.MouvementsComponent)
//   } 
];