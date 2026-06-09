import { Routes } from '@angular/router';

export const DEMANDE_COMPLEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./demande-complement.component').then(m => m.DemandeComplementComponent)
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