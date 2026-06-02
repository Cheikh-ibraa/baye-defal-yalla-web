import { Routes } from '@angular/router';
import { MainLayoutComponent } from './features/layouts/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { PortailComponent } from './features/portail/portail.component';
import { authGuard } from './guards/auth.guard';
import { DonsComponent } from './features/dons/dons.component';

export const routes: Routes = [

  { path: 'portail', component: PortailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dons', component: DonsComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: 'viewer/:accessionNumber',
    loadComponent: () =>
      import('./features/mobile-dicom-viewer/mobile-dicom-viewer.component')
        .then(m => m.MobileDicomViewerComponent),
    canActivate: [authGuard]
  },

  { path: '', redirectTo: '/portail', pathMatch: 'full' },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard], // Protection globale du layout
    children: [

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // ================= DASHBOARDS =================
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'dashboard-med',
        loadComponent: () =>
          import('./features/dashboard-medecin/dashboard-medecin.component')
            .then(m => m.DashboardMedecinComponent)
      },
      {
        path: 'dashboard-admin',
        loadComponent: () =>
          import('./features/dashboard-admin/dashboard-admin.component')
            .then(m => m.DashboardAdminComponent)
      },


      // ✅ DASHBOARD IMAGING CENTER (AJOUT)
      {
        path: 'dashboard-imagerie',
        loadComponent: () =>
          import('./features/imagerie/dashboard-imagerie/dashboard-imagerie.component')
            .then(m => m.DashboardImagerieComponent)
      },

      // ================= ADMIN =================
      {
        path: 'medecins',
        loadComponent: () =>
          import('./features/medecins/medecins.component')
            .then(m => m.MedecinsComponent)
      },
      {
        path: 'pharmacies',
        loadComponent: () =>
          import('./features/pharmacies/pharmacies.component')
            .then(m => m.PharmaciesComponent)
      },
      {
        path: 'livreurs',
        loadComponent: () =>
          import('./features/livreurs/livreurs.component')
            .then(m => m.LivreursComponent)
      },
      {
        path: 'patientmanage',
        loadComponent: () =>
          import('./features/patientmanage/patientmanage.component')
            .then(m => m.PatientsComponent)
      },
      {
        path: 'paiements-help',
        loadComponent: () =>
          import('./features/paiements-help/paiements-help.component')
            .then(m => m.PaiementsHelpComponent)
      },
      {
        path: 'administration',
        loadComponent: () =>
          import('./features/administration/administration.component')
            .then(m => m.AdministrationComponent)
      },

      // ================= MEDECIN =================
      {
        path: 'create-ordonnance',
        loadComponent: () =>
          import('./features/create-ordonnance/create-ordonnance.component')
            .then(m => m.CreateOrdonnanceComponent)
      },
      {
        path: 'ordonnances',
        loadComponent: () =>
          import('./features/ordonnances/ordonnances.component')
            .then(m => m.OrdonnancesComponent)
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patients.component')
            .then(m => m.PatientsComponent)
      },
      {
        path: 'hospitalisations',
        loadComponent: () =>
          import('./features/patients/hospitalisation/hospitalisation.component')
            .then(m => m.HospitalisationComponent)
      },
      {
        path: 'consultations',
        loadComponent: () =>
          import('./features/patients/consultations/consultations.component')
            .then(m => m.ConsultationsComponent)
      },
      {
        path: 'certificat-medical',
        loadComponent: () =>
          import('./features/patients/certificat-medical/certificat-medical.component')
            .then(m => m.CertificatMedicalComponent)
      },
      {
        path: 'analyses-medical',
        loadComponent: () =>
          import('./features/patients/analyses-medical/analyses-medical.component')
            .then(m => m.AnalysesMedicalComponent)
      },
      {
        path: 'imagerie-medical',
        loadComponent: () =>
          import('./features/patients/imagerie-medical/imagerie-medical.component')
            .then(m => m.ImagerieMedicalComponent)
      },
      {
        path: 'planings',
        loadComponent: () =>
          import('./features/planings/planings.component')
            .then(m => m.PlaningsComponent)
      },

      // ================= PHARMACIE =================
      {
        path: 'commande',
        loadChildren: () =>
          import('./features/commandes/commandes.routes')
            .then(m => m.COMMANDES_ROUTES)
      },
      {
        path: 'gestion-stock',
        loadChildren: () =>
          import('./features/gestion-stock/gestion-stock.routes')
            .then(m => m.GESTION_STOCK_ROUTES)
      },
      {
        path: 'livraison',
        loadChildren: () =>
          import('./features/livraison/livraison.routes')
            .then(m => m.LIVRAISON_ROUTES)
      },

      // ================= COMPTE =================
      {
        path: 'compte',
        loadChildren: () =>
          import('./features/comptes/comptes.routes')
            .then(m => m.COMPTES_ROUTES)
      },

      // ================= FINANCE =================
      {
        path: 'finance-dashboard',
        loadChildren: () =>
          import('./features/finance-dashboard/finance-dashboard.routes')
            .then(m => m.FINANCE_dashboard_ROUTES)
      },
      {
        path: 'finance-pharmacies',
        loadChildren: () =>
          import('./features/finance-pharmacies/finance-pharmacies.routes')
            .then(m => m.FINANCE_PHARMACIES_ROUTES)
      },
      {
        path: 'finance-virements',
        loadChildren: () =>
          import('./features/finance-virements/finance-virements.routes')
            .then(m => m.FINANCE_VIREMENTS_ROUTES)
      },
      {
        path: 'finance-dashboardpharmacie',
        loadChildren: () =>
          import('./features/finance-dashboardpharmacie/finance-dashboardpharmacie.routes')
            .then(m => m.FINANCEDASHBOARDPHARMACIEROUTES)
      },
      {
        path: 'finance-transactions',
        loadChildren: () =>
          import('./features/finance-transactions/finance-transactions.routes')
            .then(m => m.FINANCETRANSACTIONSROUTES)
      },
      {
        path: 'finance-retraits',
        loadChildren: () =>
          import('./features/finance-retraits/finance-retraits.routes')
            .then(m => m.FINANCERETRAITSROUTES)
      },
      {
        path: 'parametre-bancaire',
        loadChildren: () =>
          import('./features/parametre-bancaire/parametre-bancaire.routes')
            .then(m => m.PARAMETREBANCAIREROUTES)
      },


      // ================= IMAGERIE =================
      {
        path: 'dashboard-imagerie',
        loadComponent: () =>
          import('./features/imagerie/dashboard-imagerie/dashboard-imagerie.component')
            .then(m => m.DashboardImagerieComponent)
      },
      {
        path: 'examens-imagerie',
        loadComponent: () =>
          import('./features/imagerie/examens-imagerie/examens-imagerie.component')
            .then(m => m.ExamensImagerieComponent)
      },

      {
        path: 'detail-examen-imagerie/:id',
        loadComponent: () =>
          import('./features/imagerie/detail-examen-imagerie/detail-examen-imagerie.component')
            .then(m => m.DetailExamenImagerieComponent)
      },


      {
        path: 'comptes',
        loadComponent: () =>
          import('./features/comptes/comptes.component')
            .then(m => m.ComptesComponent)
      },

      // ================= LABORATOIRE =================

      {
        path: 'dashboard-lab',
        loadComponent: () =>
          import('./features/dashboard-lab/dashboard-lab.component')
            .then(m => m.DashboardLabComponent)
      },

      {
        path: 'examens-laboratoire',
        loadComponent: () =>
          import('./features/laboratoire/examens-laboratoire/examens-laboratoire.component')
            .then(m => m.ExamensLaboratoireComponent)
      },
      {
        path: 'detail-examen-laboratoire/:id',
        loadComponent: () =>
          import('./features/laboratoire/detail-laboratoire/detail-laboratoire.component')
            .then(m => m.DetailLaboratoireComponent)
      },


    ]
  },







  { path: '**', redirectTo: '/login' }
];
