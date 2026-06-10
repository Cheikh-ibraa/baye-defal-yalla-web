import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'portail', pathMatch: 'full' },
  { path: 'portail', loadComponent: () => import('./features/portail/portail.component').then(m => m.PortailComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: '',
    loadComponent: () => import('./features/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) }
    ]
  },
  {
    path: 'viewer/:accessionNumber',
    loadComponent: () =>
      import('./features/mobile-dicom-viewer/mobile-dicom-viewer.component')
        .then(m => m.MobileDicomViewerComponent)
  },

  {
    path: '',
    loadComponent: () => import('./features/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // ================= DASHBOARDS =================
      {
        path: 'dashboard',
        canActivate: [roleGuard(['pharmacist'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'dashboard-med',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/dashboard-medecin/dashboard-medecin.component')
            .then(m => m.DashboardMedecinComponent)
      },
      {
        path: 'dashboard-admin',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/dashboard-admin/dashboard-admin.component')
            .then(m => m.DashboardAdminComponent)
      },
      {
        path: 'dashboard-hospital',
        canActivate: [roleGuard(['hospital'])],
        loadComponent: () =>
          import('./features/dashboard-hospital/dashboard-hospital.component')
            .then(m => m.DashboardHospitalComponent)
      },
      {
        path: 'dashboard-fournisseur',
        canActivate: [roleGuard(['supplier'])],
        loadComponent: () =>
          import('./features/fournisseur/dashboard-fournisseur/dashboard-fournisseur.component')
            .then(m => m.DashboardFournisseurComponent)
      },
      {
        path: 'demandes-fournisseur',
        canActivate: [roleGuard(['supplier'])],
        loadComponent: () =>
          import('./features/fournisseur/demandes-fournisseur/demandes-fournisseur.component')
            .then(m => m.DemandesFournisseurComponent)
      },
      {
        path: 'demandes-fournisseur/:id',
        canActivate: [roleGuard(['supplier'])],
        loadComponent: () =>
          import('./features/fournisseur/demandes-fournisseur/detail-demande-fournisseur.component')
            .then(m => m.DetailDemandeFournisseurComponent)
      },
      {
        path: 'devis-fournisseur',
        canActivate: [roleGuard(['supplier'])],
        loadComponent: () =>
          import('./features/fournisseur/devis-fournisseur/devis-fournisseur.component')
            .then(m => m.DevisFournisseurComponent)
      },
      {
        path: 'devis-fournisseur/:id',
        canActivate: [roleGuard(['supplier'])],
        loadComponent: () =>
          import('./features/fournisseur/devis-fournisseur/detail-devis-fournisseur.component')
            .then(m => m.DetailDevisFournisseurComponent)
      },
      {
        path: 'demandes',
        canActivate: [roleGuard(['admin', 'doctor', 'hospital'])],
        loadComponent: () =>
          import('./features/demandes-medicales/demandes-medicales.component')
            .then(m => m.DemandesMedicalesComponent)
      },
      {
        path: 'demandes/:id',
        canActivate: [roleGuard(['admin', 'doctor', 'hospital'])],
        loadComponent: () =>
          import('./features/detail-demande-medicale/detail-demande-medicale.component')
            .then(m => m.DetailDemandeMedicaleComponent)
      },
      {
        path: 'patients-hospital',
        canActivate: [roleGuard(['hospital'])],
        loadComponent: () =>
          import('./features/patients-hospital/patients-hospital.component')
            .then(m => m.PatientsHospitalComponent)
      },
      {
        path: 'patients-hospital/:id',
        canActivate: [roleGuard(['hospital'])],
        loadComponent: () =>
          import('./features/patients-hospital/detail-patient.component')
            .then(m => m.DetailPatientComponent)
      },
      {
        path: 'hospitalisations',
        canActivate: [roleGuard(['hospital', 'admin'])],
        loadComponent: () =>
          import('./features/hospitalisation/hospitalisation.component')
            .then(m => m.HospitalisationComponent)
      },
      {
        path: 'hospitalisations/:id',
        canActivate: [roleGuard(['hospital', 'admin'])],
        loadComponent: () =>
          import('./features/hospitalisation/detail-hospitalisation.component')
            .then(m => m.DetailHospitalisationComponent)
      },
      {
        path: 'chirurgie',
        canActivate: [roleGuard(['hospital', 'doctor'])],
        loadComponent: () =>
          import('./features/chirurgie/chirurgie.component')
            .then(m => m.ChirurgieComponent)
      },
      {
        path: 'chirurgie/nouvelle',
        canActivate: [roleGuard(['hospital', 'doctor'])],
        loadComponent: () =>
          import('./features/chirurgie/nouvelle-chirurgie.component')
            .then(m => m.NouvelleChirurgieComponent)
      },
      {
        path: 'chirurgie/:id',
        canActivate: [roleGuard(['hospital', 'doctor'])],
        loadComponent: () =>
          import('./features/chirurgie/detail-chirurgie.component')
            .then(m => m.DetailChirurgieComponent)
      },
      {
        path: 'demande-materiels',
        canActivate: [roleGuard(['hospital', 'admin'])],
        loadComponent: () =>
          import('./features/demande-materiels/demande-materiels.component')
            .then(m => m.DemandeMaterielComponent)
      },
      {
        path: 'demande-materiels/:ref',
        canActivate: [roleGuard(['hospital', 'admin'])],
        loadComponent: () =>
          import('./features/demande-materiels/detail-demande-materiels.component')
            .then(m => m.DetailDemandeMaterielComponent)
      },
      {
        path: 'demande-materiels/:ref/devis/:fournisseur',
        canActivate: [roleGuard(['hospital', 'admin'])],
        loadComponent: () =>
          import('./features/demande-materiels/detail-devis.component')
            .then(m => m.DetailDevisComponent)
      },
      {
        path: 'paiements-hospital',
        canActivate: [roleGuard(['hospital', 'admin'])],
        loadComponent: () =>
          import('./features/paiements-hospital/paiements-hospital.component')
            .then(m => m.PaiementsHospitalComponent)
      },
      {
        path: 'paiements-hospital/:id',
        canActivate: [roleGuard(['hospital', 'admin'])],
        loadComponent: () =>
          import('./features/paiements-hospital/detail-paiement.component')
            .then(m => m.DetailPaiementComponent)
      },

      // ================= ADMIN =================
      {
        path: 'medecins',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/medecins/medecins.component')
            .then(m => m.MedecinsComponent)
      },
      {
        path: 'pharmacies',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/pharmacies/pharmacies.component')
            .then(m => m.PharmaciesComponent)
      },
      {
        path: 'livreurs',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/livreurs/livreurs.component')
            .then(m => m.LivreursComponent)
      },
      {
        path: 'patientmanage',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/patientmanage/patientmanage.component')
            .then(m => m.PatientsComponent)
      },
      {
        path: 'paiements-help',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/paiements-help/paiements-help.component')
            .then(m => m.PaiementsHelpComponent)
      },
      {
        path: 'administration',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/administration/administration.component')
            .then(m => m.AdministrationComponent)
      },

      // ================= MEDECIN =================
      {
        path: 'create-ordonnance',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/create-ordonnance/create-ordonnance.component')
            .then(m => m.CreateOrdonnanceComponent)
      },
      {
        path: 'ordonnances',
        canActivate: [roleGuard(['doctor', 'pharmacist'])],
        loadComponent: () =>
          import('./features/ordonnances/ordonnances.component')
            .then(m => m.OrdonnancesComponent)
      },
      {
        path: 'patients',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/patients/patients.component')
            .then(m => m.PatientsComponent)
      },
      {
        path: 'nouvelle-hospitalisation',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/patients/hospitalisation/hospitalisation.component')
            .then(m => m.HospitalisationComponent)
      },
      {
        path: 'consultations',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/patients/consultations/consultations.component')
            .then(m => m.ConsultationsComponent)
      },
      {
        path: 'certificat-medical',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/patients/certificat-medical/certificat-medical.component')
            .then(m => m.CertificatMedicalComponent)
      },
      {
        path: 'analyses-medical',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/patients/analyses-medical/analyses-medical.component')
            .then(m => m.AnalysesMedicalComponent)
      },
      {
        path: 'imagerie-medical',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/patients/imagerie-medical/imagerie-medical.component')
            .then(m => m.ImagerieMedicalComponent)
      },
      {
        path: 'planings',
        canActivate: [roleGuard(['doctor'])],
        loadComponent: () =>
          import('./features/planings/planings.component')
            .then(m => m.PlaningsComponent)
      },

      // ================= PHARMACIE =================
      {
        path: 'commande',
        canActivate: [roleGuard(['pharmacist'])],
        loadChildren: () =>
          import('./features/commandes/commandes.routes')
            .then(m => m.COMMANDES_ROUTES)
      },
      {
        path: 'gestion-stock',
        canActivate: [roleGuard(['pharmacist'])],
        loadChildren: () =>
          import('./features/gestion-stock/gestion-stock.routes')
            .then(m => m.GESTION_STOCK_ROUTES)
      },
      {
        path: 'livraison',
        canActivate: [roleGuard(['pharmacist'])],
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
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./features/finance-dashboard/finance-dashboard.routes')
            .then(m => m.FINANCE_dashboard_ROUTES)
      },
      {
        path: 'finance-pharmacies',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./features/finance-pharmacies/finance-pharmacies.routes')
            .then(m => m.FINANCE_PHARMACIES_ROUTES)
      },
      {
        path: 'finance-virements',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./features/finance-virements/finance-virements.routes')
            .then(m => m.FINANCE_VIREMENTS_ROUTES)
      },
      {
        path: 'finance-dashboardpharmacie',
        canActivate: [roleGuard(['pharmacist', 'admin'])],
        loadChildren: () =>
          import('./features/finance-dashboardpharmacie/finance-dashboardpharmacie.routes')
            .then(m => m.FINANCEDASHBOARDPHARMACIEROUTES)
      },
      {
        path: 'finance-transactions',
        canActivate: [roleGuard(['admin', 'pharmacist'])],
        loadChildren: () =>
          import('./features/finance-transactions/finance-transactions.routes')
            .then(m => m.FINANCETRANSACTIONSROUTES)
      },
      {
        path: 'finance-retraits',
        canActivate: [roleGuard(['admin', 'pharmacist'])],
        loadChildren: () =>
          import('./features/finance-retraits/finance-retraits.routes')
            .then(m => m.FINANCERETRAITSROUTES)
      },
      {
        path: 'parametre-bancaire',
        canActivate: [roleGuard(['admin', 'pharmacist'])],
        loadChildren: () =>
          import('./features/parametre-bancaire/parametre-bancaire.routes')
            .then(m => m.PARAMETREBANCAIREROUTES)
      },

      // ================= IMAGERIE =================
      {
        path: 'dashboard-imagerie',
        canActivate: [roleGuard(['radiologist'])],
        loadComponent: () =>
          import('./features/imagerie/dashboard-imagerie/dashboard-imagerie.component')
            .then(m => m.DashboardImagerieComponent)
      },
      {
        path: 'examens-imagerie',
        canActivate: [roleGuard(['radiologist'])],
        loadComponent: () =>
          import('./features/imagerie/examens-imagerie/examens-imagerie.component')
            .then(m => m.ExamensImagerieComponent)
      },
      {
        path: 'detail-examen-imagerie/:id',
        canActivate: [roleGuard(['radiologist'])],
        loadComponent: () =>
          import('./features/imagerie/detail-examen-imagerie/detail-examen-imagerie.component')
            .then(m => m.DetailExamenImagerieComponent)
      },

      // ================= LABORATOIRE =================
      {
        path: 'dashboard-lab',
        canActivate: [roleGuard(['lab-technician'])],
        loadComponent: () =>
          import('./features/dashboard-lab/dashboard-lab.component')
            .then(m => m.DashboardLabComponent)
      },
      {
        path: 'examens-laboratoire',
        canActivate: [roleGuard(['lab-technician'])],
        loadComponent: () =>
          import('./features/laboratoire/examens-laboratoire/examens-laboratoire.component')
            .then(m => m.ExamensLaboratoireComponent)
      },
      {
        path: 'detail-examen-laboratoire/:id',
        canActivate: [roleGuard(['lab-technician'])],
        loadComponent: () =>
          import('./features/laboratoire/detail-laboratoire/detail-laboratoire.component')
            .then(m => m.DetailLaboratoireComponent)
      },

      // ================= DONS =================
      {
        path: 'dons',
        canActivate: [roleGuard(['donor-individual', 'donor-organization'])],
        loadComponent: () =>
          import('./features/dons/dons.component')
            .then(m => m.DonsComponent)
      },
      {
        path: 'dons-historique',
        canActivate: [roleGuard(['donor-individual', 'donor-organization'])],
        loadComponent: () =>
          import('./features/dons/dons-historique.component')
            .then(m => m.DonsHistoriqueComponent)
      },
      {
        path: 'detail-don/:id',
        canActivate: [roleGuard(['donor-individual', 'donor-organization'])],
        loadComponent: () =>
          import('./features/dons/dons-detail.component')
            .then(m => m.DonsDetailComponent)
      },

      // ================= COMPTE =================
      {
        path: 'comptes',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/comptes/comptes.component')
            .then(m => m.ComptesComponent)
      },
    ]
  },

  { path: '**', redirectTo: '/portail' }
];
