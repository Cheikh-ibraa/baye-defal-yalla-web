import { Routes } from '@angular/router';


export const FINANCETRANSACTIONSROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./finance-transactions.component').then(m => m.FinanceTransactionsComponent)
  },
  // {
  //   path: 'autre-sous-page',
  //   loadComponent: () => import('./autre-sous-page.component').then(m => m.AutreSousPageComponent)
  // }
];
