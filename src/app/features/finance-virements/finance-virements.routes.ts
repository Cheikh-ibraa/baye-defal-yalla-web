import { Routes } from '@angular/router';


export const FINANCE_VIREMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./finance-virements.component').then(m => m.FinanceVirementsComponent)
  },
  // {
  //   path: 'autre-sous-page',
  //   loadComponent: () => import('./autre-sous-page.component').then(m => m.AutreSousPageComponent)
  // }
];
