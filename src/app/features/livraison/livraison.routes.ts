import { Routes } from '@angular/router';

export const LIVRAISON_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./livraison.component').then(m => m.LivraisonComponent)
  },
//   {
//     path: 'planning',
//     loadComponent: () => import('./planning/planning.component').then(m => m.PlanningComponent)
//   },
//   {
//     path: 'suivi',
//     loadComponent: () => import('./suivi/suivi.component').then(m => m.SuiviComponent)
//   },
//   {
//     path: 'livreurs',
//     loadComponent: () => import('./livreurs/livreurs.component').then(m => m.LivreursComponent)
//   }
];