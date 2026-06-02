// src/app/features/finance-pharmacies/finance-pharmacies.routes.ts

import { Routes } from '@angular/router';

export const FINANCE_PHARMACIES_ROUTES: Routes = [
  // Route principale : Liste des pharmacies financières
  {
    path: '', // → /finance-pharmacies
    loadComponent: () =>
      import('./finance-pharmacies.component').then(
        (m) => m.FinancePharmaciesComponent
      ),
  },

  // Route détail d'une pharmacie (ex: /finance-pharmacies/detail/1)
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./pharmacie-detail/pharmacie-detail.component').then(
        (m) => m.PharmacieDetailComponent
      ),
  },

  // Optionnel : tu peux ajouter d'autres sous-routes ici plus tard
  // {
  //   path: 'recredit/:id',
  //   loadComponent: () => import('./recredit-pharmacie/recredit-pharmacie.component').then(m => m.RecreditPharmacieComponent)
  // }
];