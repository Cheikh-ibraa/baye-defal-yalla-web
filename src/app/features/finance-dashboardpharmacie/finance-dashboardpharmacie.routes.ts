import { Routes } from '@angular/router';


export const FINANCEDASHBOARDPHARMACIEROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./finance-dashboardpharmacie.component').then(m => m.FinanceDashboardpharmacieComponent)
  },
  // {
  //   path: 'autre-sous-page',
  //   loadComponent: () => import('./autre-sous-page.component').then(m => m.AutreSousPageComponent)
  // }
];
