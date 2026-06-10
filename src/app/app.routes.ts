import { Routes } from '@angular/router';

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
    children: [
      { path: '', redirectTo: 'portail', pathMatch: 'full' },

      // ================= DOCTOR ROUTES =================
      {
        path: 'doctor/dashboard',
        loadComponent: () => import('./features/dashboard-medecin/dashboard-medecin.component').then(m => m.DashboardMedecinComponent)
      },
      {
        path: 'doctor/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },
      {
        path: 'doctor/create-ordonnance',
        loadComponent: () => import('./features/create-ordonnance/create-ordonnance.component').then(m => m.CreateOrdonnanceComponent)
      },
      {
        path: 'doctor/ordonnances',
        loadComponent: () => import('./features/ordonnances/ordonnances.component').then(m => m.OrdonnancesComponent)
      },
      {
        path: 'doctor/patients',
        loadComponent: () => import('./features/patients/patients.component').then(m => m.PatientsComponent)
      },
      {
        path: 'doctor/planings',
        loadComponent: () => import('./features/planings/planings.component').then(m => m.PlaningsComponent)
      },
      {
        path: 'doctor/consultations',
        loadComponent: () => import('./features/patients/consultations/consultations.component').then(m => m.ConsultationsComponent)
      },
      {
        path: 'doctor/certificat-medical',
        loadComponent: () => import('./features/patients/certificat-medical/certificat-medical.component').then(m => m.CertificatMedicalComponent)
      },
      {
        path: 'doctor/analyses-medical',
        loadComponent: () => import('./features/patients/analyses-medical/analyses-medical.component').then(m => m.AnalysesMedicalComponent)
      },
      {
        path: 'doctor/imagerie-medical',
        loadComponent: () => import('./features/patients/imagerie-medical/imagerie-medical.component').then(m => m.ImagerieMedicalComponent)
      },

      // ================= PHARMACIST ROUTES =================
      {
        path: 'pharmacist/dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pharmacist/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },
      {
        path: 'pharmacist/commande',
        loadChildren: () => import('./features/commandes/commandes.routes').then(m => m.COMMANDES_ROUTES)
      },
      {
        path: 'pharmacist/gestion-stock',
        loadChildren: () => import('./features/gestion-stock/gestion-stock.routes').then(m => m.GESTION_STOCK_ROUTES)
      },
      {
        path: 'pharmacist/demande-complement',
        loadChildren: () => import('./features/demande-complement/demande-complement.routes').then(m => m.DEMANDE_COMPLEMENT_ROUTES)
      },
      {
        path: 'pharmacist/finance-dashboardpharmacie',
        loadChildren: () => import('./features/finance-dashboardpharmacie/finance-dashboardpharmacie.routes').then(m => m.FINANCEDASHBOARDPHARMACIEROUTES)
      },
      {
        path: 'pharmacist/finance-transactions',
        loadChildren: () => import('./features/finance-transactions/finance-transactions.routes').then(m => m.FINANCETRANSACTIONSROUTES)
      },
      {
        path: 'pharmacist/finance-retraits',
        loadChildren: () => import('./features/finance-retraits/finance-retraits.routes').then(m => m.FINANCERETRAITSROUTES)
      },
      {
        path: 'pharmacist/parametre-bancaire',
        loadChildren: () => import('./features/parametre-bancaire/parametre-bancaire.routes').then(m => m.PARAMETREBANCAIREROUTES)
      },

      // ================= ORGANIZATION ROUTES =================
      {
        path: 'organization/dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'organization/account',
        loadComponent: () => import('./features/comptes/organization-account.component').then(m => m.OrganizationAccountComponent)
      },
      {
        path: 'organization/rapport',
        loadComponent: () => import('./features/rapports/rapports.component').then(m => m.RapportsComponent)
      },
      {
        path: 'organization/detail-rapport/:id',
        loadComponent: () => import('./features/rapports/detail-rapport.component').then(m => m.DetailRapportComponent)
      },
      {
        path: 'organization/budget',
        loadComponent: () => import('./features/budget/budget.component').then(m => m.BudgetComponent)
      },
      {
        path: 'organization/demande',
        loadComponent: () => import('./features/demande-organisation/demande-organisation.component').then(m => m.DemandeOrganisationComponent)
      },
      {
        path: 'organization/demande/:id',
        loadComponent: () => import('./features/demande-organisation/detail-demande-organisation.component').then(m => m.DetailDemandeOrganisationComponent)
      },
      {
        path: 'organization/demande/:id/devis',
        loadComponent: () => import('./features/demande-organisation/detail-devis-organisation.component').then(m => m.DetailDevisOrganisationComponent)
      },

      // ================= ASSOCIATION ROUTES =================
      {
        path: 'association/dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'association/account',
        loadComponent: () => import('./features/comptes/organization-account.component').then(m => m.OrganizationAccountComponent)
      },

      // ================= PATIENT ROUTES =================
      {
        path: 'patient/dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'patient/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },

      // ================= ADMIN ROUTES =================
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./features/dashboard-admin/dashboard-admin.component').then(m => m.DashboardAdminComponent)
      },
      {
        path: 'admin/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },
      {
        path: 'admin/medecins',
        loadComponent: () => import('./features/medecins/medecins.component').then(m => m.MedecinsComponent)
      },
      {
        path: 'admin/pharmacies',
        loadComponent: () => import('./features/pharmacies/pharmacies.component').then(m => m.PharmaciesComponent)
      },
      {
        path: 'admin/livreurs',
        loadComponent: () => import('./features/livreurs/livreurs.component').then(m => m.LivreursComponent)
      },
      {
        path: 'admin/patients',
        loadComponent: () => import('./features/patientmanage/patientmanage.component').then(m => m.PatientsComponent)
      },
      {
        path: 'admin/paiements-help',
        loadComponent: () => import('./features/paiements-help/paiements-help.component').then(m => m.PaiementsHelpComponent)
      },
      {
        path: 'admin/administration',
        loadComponent: () => import('./features/administration/administration.component').then(m => m.AdministrationComponent)
      },
      {
        path: 'admin/finance-dashboard',
        loadChildren: () => import('./features/finance-dashboard/finance-dashboard.routes').then(m => m.FINANCE_dashboard_ROUTES)
      },
      {
        path: 'admin/finance-pharmacies',
        loadChildren: () => import('./features/finance-pharmacies/finance-pharmacies.routes').then(m => m.FINANCE_PHARMACIES_ROUTES)
      },
      {
        path: 'admin/finance-virements',
        loadChildren: () => import('./features/finance-virements/finance-virements.routes').then(m => m.FINANCE_VIREMENTS_ROUTES)
      },

      // ================= LABORATORY ROUTES =================
      {
        path: 'laboratory/dashboard',
        loadComponent: () => import('./features/dashboard-lab/dashboard-lab.component').then(m => m.DashboardLabComponent)
      },
      {
        path: 'laboratory/examens',
        loadComponent: () => import('./features/laboratoire/examens-laboratoire/examens-laboratoire.component').then(m => m.ExamensLaboratoireComponent)
      },
      {
        path: 'laboratory/demandes',
        loadComponent: () => import('./features/laboratoire/demande-laboratoire/demande-laboratoire.component').then(m => m.DemandeLaboratoireComponent)
      },
      {
        path: 'laboratory/demandes/:id',
        loadComponent: () => import('./features/laboratoire/demande-laboratoire/detail-demande-laboratoire.component').then(m => m.DetailDemandeLaboratoireComponent)
      },
      {
        path: 'laboratory/examens/:id',
        loadComponent: () => import('./features/laboratoire/detail-laboratoire/detail-laboratoire.component').then(m => m.DetailLaboratoireComponent)
      },
      {
        path: 'laboratory/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },

      // ================= IMAGING CENTER ROUTES =================
      {
        path: 'imaging/dashboard',
        loadComponent: () => import('./features/imagerie/dashboard-imagerie/dashboard-imagerie.component').then(m => m.DashboardImagerieComponent)
      },
      {
        path: 'imaging/examens',
        loadComponent: () => import('./features/imagerie/examens-imagerie/examens-imagerie.component').then(m => m.ExamensImagerieComponent)
      },
      {
        path: 'imaging/examens/:id',
        loadComponent: () => import('./features/imagerie/detail-examen-imagerie/detail-examen-imagerie.component').then(m => m.DetailExamenImagerieComponent)
      },
      {
        path: 'imaging/demandes',
        loadComponent: () => import('./features/imagerie/demande-imagerie/demande-imagerie.component').then(m => m.DemandeImagerieComponent)
      },
      {
        path: 'imaging/demandes/:id',
        loadComponent: () => import('./features/imagerie/detail-demande-imagerie/detail-demande-imagerie.component').then(m => m.DetailDemandeImagerieComponent)
      },
      {
        path: 'imaging/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },

      // ================= HOSPITAL ROUTES =================
      {
        path: 'hospital/dashboard',
        loadComponent: () => import('./features/dashboard-hospital/dashboard-hospital.component').then(m => m.DashboardHospitalComponent)
      },
      {
        path: 'hospital/demandes',
        loadComponent: () => import('./features/demandes-medicales/demandes-medicales.component').then(m => m.DemandesMedicalesComponent)
      },
      {
        path: 'hospital/demandes/:id',
        loadComponent: () => import('./features/detail-demande-medicale/detail-demande-medicale.component').then(m => m.DetailDemandeMedicaleComponent)
      },
      {
        path: 'hospital/patients',
        loadComponent: () => import('./features/patients-hospital/patients-hospital.component').then(m => m.PatientsHospitalComponent)
      },
      {
        path: 'hospital/patients/:id',
        loadComponent: () => import('./features/patients-hospital/detail-patient.component').then(m => m.DetailPatientComponent)
      },
      {
        path: 'hospital/hospitalisations',
        loadComponent: () => import('./features/hospitalisation/hospitalisation.component').then(m => m.HospitalisationComponent)
      },
      {
        path: 'hospital/hospitalisations/:id',
        loadComponent: () => import('./features/hospitalisation/detail-hospitalisation.component').then(m => m.DetailHospitalisationComponent)
      },
      {
        path: 'hospital/chirurgie',
        loadComponent: () => import('./features/chirurgie/chirurgie.component').then(m => m.ChirurgieComponent)
      },
      {
        path: 'hospital/chirurgie/nouvelle',
        loadComponent: () => import('./features/chirurgie/nouvelle-chirurgie.component').then(m => m.NouvelleChirurgieComponent)
      },
      {
        path: 'hospital/chirurgie/:id',
        loadComponent: () => import('./features/chirurgie/detail-chirurgie.component').then(m => m.DetailChirurgieComponent)
      },
      {
        path: 'hospital/demande-materiels',
        loadComponent: () => import('./features/demande-materiels/demande-materiels.component').then(m => m.DemandeMaterielComponent)
      },
      {
        path: 'hospital/demande-materiels/:ref',
        loadComponent: () => import('./features/demande-materiels/detail-demande-materiels.component').then(m => m.DetailDemandeMaterielComponent)
      },
      {
        path: 'hospital/demande-materiels/:ref/devis/:fournisseur',
        loadComponent: () => import('./features/demande-materiels/detail-devis.component').then(m => m.DetailDevisComponent)
      },
      {
        path: 'hospital/paiements',
        loadComponent: () => import('./features/paiements-hospital/paiements-hospital.component').then(m => m.PaiementsHospitalComponent)
      },
      {
        path: 'hospital/paiements/:id',
        loadComponent: () => import('./features/paiements-hospital/detail-paiement.component').then(m => m.DetailPaiementComponent)
      },
      {
        path: 'hospital/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },

      // ================= FOURNISSEUR ROUTES =================
      {
        path: 'fournisseur/dashboard',
        loadComponent: () => import('./features/fournisseur/dashboard-fournisseur/dashboard-fournisseur.component').then(m => m.DashboardFournisseurComponent)
      },
      {
        path: 'fournisseur/demandes',
        loadComponent: () => import('./features/fournisseur/demandes-fournisseur/demandes-fournisseur.component').then(m => m.DemandesFournisseurComponent)
      },
      {
        path: 'fournisseur/demandes/:id',
        loadComponent: () => import('./features/fournisseur/demandes-fournisseur/detail-demande-fournisseur.component').then(m => m.DetailDemandeFournisseurComponent)
      },
      {
        path: 'fournisseur/devis',
        loadComponent: () => import('./features/fournisseur/devis-fournisseur/devis-fournisseur.component').then(m => m.DevisFournisseurComponent)
      },
      {
        path: 'fournisseur/devis/:id',
        loadComponent: () => import('./features/fournisseur/devis-fournisseur/detail-devis-fournisseur.component').then(m => m.DetailDevisFournisseurComponent)
      },
      {
        path: 'fournisseur/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },

      // ================= DONOR ROUTES =================
      {
        path: 'donor/dashboard',
        loadComponent: () => import('./features/dons/dons.component').then(m => m.DonsComponent)
      },
      {
        path: 'donor/dons',
        loadComponent: () => import('./features/dons/dons.component').then(m => m.DonsComponent)
      },
      {
        path: 'donor/dons-historique',
        loadComponent: () => import('./features/dons/dons-historique.component').then(m => m.DonsHistoriqueComponent)
      },
      {
        path: 'donor/detail-don/:id',
        loadComponent: () => import('./features/dons/dons-detail.component').then(m => m.DonsDetailComponent)
      },
      {
        path: 'donor/account',
        loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent)
      },

      // ================= COMPATIBILITY REDIRECTS =================
      { path: 'dashboard-med', redirectTo: 'doctor/dashboard', pathMatch: 'full' },
      { path: 'dashboard-admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
      { path: 'dashboard-hospital', redirectTo: 'hospital/dashboard', pathMatch: 'full' },
      { path: 'dashboard-fournisseur', redirectTo: 'fournisseur/dashboard', pathMatch: 'full' },
      { path: 'dashboard-imagerie', redirectTo: 'imaging/dashboard', pathMatch: 'full' },
      { path: 'dashboard-lab', redirectTo: 'laboratory/dashboard', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'pharmacist/dashboard', pathMatch: 'full' },
      { path: 'organisation', redirectTo: 'organization/dashboard', pathMatch: 'full' },
      { path: 'compte', redirectTo: 'pharmacist/account', pathMatch: 'full' },
      { path: 'comptes', redirectTo: 'pharmacist/account', pathMatch: 'full' },

      // Fallbacks for direct paths
      { path: 'medecins', redirectTo: 'admin/medecins', pathMatch: 'full' },
      { path: 'pharmacies', redirectTo: 'admin/pharmacies', pathMatch: 'full' },
      { path: 'livreurs', redirectTo: 'admin/livreurs', pathMatch: 'full' },
      { path: 'patientmanage', redirectTo: 'admin/patients', pathMatch: 'full' },
      { path: 'paiements-help', redirectTo: 'admin/paiements-help', pathMatch: 'full' },
      { path: 'administration', redirectTo: 'admin/administration', pathMatch: 'full' },
      
      { path: 'create-ordonnance', redirectTo: 'doctor/create-ordonnance', pathMatch: 'full' },
      { path: 'ordonnances', redirectTo: 'doctor/ordonnances', pathMatch: 'full' },
      { path: 'patients', redirectTo: 'doctor/patients', pathMatch: 'full' },
      { path: 'planings', redirectTo: 'doctor/planings', pathMatch: 'full' },

      { path: 'examens-laboratoire', redirectTo: 'laboratory/examens', pathMatch: 'full' },
      { path: 'demande-laboratoire', redirectTo: 'laboratory/demandes', pathMatch: 'full' },
      { path: 'detail-demande-laboratoire/:id', redirectTo: 'laboratory/demandes/:id', pathMatch: 'full' },
      { path: 'detail-examen-laboratoire/:id', redirectTo: 'laboratory/examens/:id', pathMatch: 'full' },

      { path: 'examens-imagerie', redirectTo: 'imaging/examens', pathMatch: 'full' },
      { path: 'detail-examen-imagerie/:id', redirectTo: 'imaging/examens/:id', pathMatch: 'full' },
      { path: 'demande-imagerie', redirectTo: 'imaging/demandes', pathMatch: 'full' },
      { path: 'detail-demande-imagerie/:id', redirectTo: 'imaging/demandes/:id', pathMatch: 'full' },

      { path: 'rapport', redirectTo: 'organization/rapport', pathMatch: 'full' },
      { path: 'detail-rapport/:id', redirectTo: 'organization/detail-rapport/:id', pathMatch: 'full' },
      { path: 'budget', redirectTo: 'organization/budget', pathMatch: 'full' },
      { path: 'demande-organisation', redirectTo: 'organization/demande', pathMatch: 'full' },
      { path: 'demande-organisation/:id', redirectTo: 'organization/demande/:id', pathMatch: 'full' },
      { path: 'demande-organisation/:id/devis', redirectTo: 'organization/demande/:id/devis', pathMatch: 'full' },

      { path: 'demandes-fournisseur', redirectTo: 'fournisseur/demandes', pathMatch: 'full' },
      { path: 'demandes-fournisseur/:id', redirectTo: 'fournisseur/demandes/:id', pathMatch: 'full' },
      { path: 'devis-fournisseur', redirectTo: 'fournisseur/devis', pathMatch: 'full' },
      { path: 'devis-fournisseur/:id', redirectTo: 'fournisseur/devis/:id', pathMatch: 'full' },

      { path: 'demandes-medicales', redirectTo: 'hospital/demandes', pathMatch: 'full' },
      { path: 'demandes-medicales/:id', redirectTo: 'hospital/demandes/:id', pathMatch: 'full' },
      { path: 'patients-hospital', redirectTo: 'hospital/patients', pathMatch: 'full' },
      { path: 'patients-hospital/:id', redirectTo: 'hospital/patients/:id', pathMatch: 'full' },
      { path: 'hospitalisations', redirectTo: 'hospital/hospitalisations', pathMatch: 'full' },
      { path: 'hospitalisations/:id', redirectTo: 'hospital/hospitalisations/:id', pathMatch: 'full' },
      { path: 'chirurgie', redirectTo: 'hospital/chirurgie', pathMatch: 'full' },
      { path: 'chirurgie/nouvelle', redirectTo: 'hospital/chirurgie/nouvelle', pathMatch: 'full' },
      { path: 'chirurgie/:id', redirectTo: 'hospital/chirurgie/:id', pathMatch: 'full' },
      { path: 'demande-materiels', redirectTo: 'hospital/demande-materiels', pathMatch: 'full' },
      { path: 'demande-materiels/:ref', redirectTo: 'hospital/demande-materiels/:ref', pathMatch: 'full' },
      { path: 'demande-materiels/:ref/devis/:fournisseur', redirectTo: 'hospital/demande-materiels/:ref/devis/:fournisseur', pathMatch: 'full' },
      { path: 'paiements-hospital', redirectTo: 'hospital/paiements', pathMatch: 'full' },
      { path: 'paiements-hospital/:id', redirectTo: 'hospital/paiements/:id', pathMatch: 'full' },

      { path: 'dons', redirectTo: 'donor/dons', pathMatch: 'full' },
      { path: 'dons-historique', redirectTo: 'donor/dons-historique', pathMatch: 'full' },
      { path: 'detail-don/:id', redirectTo: 'donor/detail-don/:id', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '/portail' }
];
