import { Routes } from '@angular/router';


export const FINANCE_dashboard_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./finance-dashboard.component').then(m => m.FinanceDashboardComponent)
  },
  // {
  //   path: 'autre-sous-page',
  //   loadComponent: () => import('./autre-sous-page.component').then(m => m.AutreSousPageComponent)
  // }
];
