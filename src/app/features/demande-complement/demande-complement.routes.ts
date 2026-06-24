import { Routes } from '@angular/router';

export const DEMANDE_COMPLEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./demande-complement.component').then(m => m.DemandeComplementComponent)
  },
];
