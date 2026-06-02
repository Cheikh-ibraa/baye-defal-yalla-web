import { Routes } from '@angular/router';

export const COMPTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./comptes.component').then(m => m.ComptesComponent)
  },
//   {
//     path: 'clients',
//     loadComponent: () => import('./clients/clients.component').then(m => m.ClientsComponent)
//   },
//   {
//     path: 'fournisseurs',
//     loadComponent: () => import('./fournisseurs/fournisseurs.component').then(m => m.FournisseursComponent)
//   },
//   {
//     path: 'utilisateurs',
//     loadComponent: () => import('./utilisateurs/utilisateurs.component').then(m => m.UtilisateursComponent)
//   }
];