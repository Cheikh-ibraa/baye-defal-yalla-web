import { Routes } from '@angular/router';


export const FINANCERETRAITSROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./finance-retraits.component').then(m => m.FinanceRetraitsComponent)
  },
 
];
