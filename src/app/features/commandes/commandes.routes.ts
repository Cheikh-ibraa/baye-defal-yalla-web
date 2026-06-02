import { Routes } from '@angular/router';

export const COMMANDES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./commandes.component').then(m => m.CommandesComponent)
  },
//   {
//     path: 'nouvelle',
//     loadComponent: () => import('./nouvelle-commande/nouvelle-commande.component').then(m => m.NouvelleCommandeComponent)
//   },
//   {
//     path: 'liste',
//     loadComponent: () => import('./liste-commandes/liste-commandes.component').then(m => m.ListeCommandesComponent)
//   },
//   {
//     path: ':id',
//     loadComponent: () => import('./detail-commande/detail-commande.component').then(m => m.DetailCommandeComponent)
//   }
];