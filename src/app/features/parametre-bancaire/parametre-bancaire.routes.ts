import { Routes } from '@angular/router';


export const PARAMETREBANCAIREROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./parametre-bancaire.component').then(m => m.ParametreBancaireComponent)
  },
  // {
  //   path: 'autre-sous-page',
  //   loadComponent: () => import('./autre-sous-page.component').then(m => m.AutreSousPageComponent)
  // }
];
