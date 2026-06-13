import { Routes } from '@angular/router';
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
    children: [
      { path: '', redirectTo: 'portail', pathMatch: 'full' },

      // ================= DOCTOR ROUTES =================
      { path: 'doctor/dashboard',         canActivate: [roleGuard(['doctor', 'admin'])], loadComponent: () => import('./features/dashboard-medecin/dashboard-medecin.component').then(m => m.DashboardMedecinComponent) },
      { path: 'doctor/account',           canActivate: [roleGuard(['doctor'])],          loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },
      { path: 'doctor/create-ordonnance', canActivate: [roleGuard(['doctor'])],          loadComponent: () => import('./features/create-ordonnance/create-ordonnance.component').then(m => m.CreateOrdonnanceComponent) },
      { path: 'doctor/ordonnances',       canActivate: [roleGuard(['doctor'])],          loadComponent: () => import('./features/ordonnances/ordonnances.component').then(m => m.OrdonnancesComponent) },
      { path: 'doctor/patients',          canActivate: [roleGuard(['doctor'])],          loadComponent: () => import('./features/patients/patients.component').then(m => m.PatientsComponent) },
      { path: 'doctor/planings',          canActivate: [roleGuard(['doctor'])],          loadComponent: () => import('./features/planings/planings.component').then(m => m.PlaningsComponent) },
      { path: 'doctor/consultations',     canActivate: [roleGuard(['doctor'])],          loadComponent: () => import('./features/patients/consultations/consultations.component').then(m => m.ConsultationsComponent) },
      { path: 'doctor/certificat-medical',canActivate: [roleGuard(['doctor'])],          loadComponent: () => import('./features/patients/certificat-medical/certificat-medical.component').then(m => m.CertificatMedicalComponent) },
      { path: 'doctor/analyses-medical',          canActivate: [roleGuard(['doctor'])], loadComponent: () => import('./features/patients/analyses-medical/analyses-medical.component').then(m => m.AnalysesMedicalComponent) },
      { path: 'doctor/imagerie-medical',          canActivate: [roleGuard(['doctor'])], loadComponent: () => import('./features/patients/imagerie-medical/imagerie-medical.component').then(m => m.ImagerieMedicalComponent) },
      { path: 'doctor/nouvelle-hospitalisation',  canActivate: [roleGuard(['doctor'])], loadComponent: () => import('./features/patients/hospitalisation/hospitalisation.component').then(m => m.HospitalisationComponent) },

      // ================= PHARMACIST ROUTES =================
      { path: 'pharmacist/dashboard',                canActivate: [roleGuard(['pharmacist', 'admin'])], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'pharmacist/account',                  canActivate: [roleGuard(['pharmacist'])],          loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },
      { path: 'pharmacist/commande',                 canActivate: [roleGuard(['pharmacist'])],          loadChildren: () => import('./features/commandes/commandes.routes').then(m => m.COMMANDES_ROUTES) },
      { path: 'pharmacist/gestion-stock',            canActivate: [roleGuard(['pharmacist'])],          loadChildren: () => import('./features/gestion-stock/gestion-stock.routes').then(m => m.GESTION_STOCK_ROUTES) },
      { path: 'pharmacist/demande-complement',       canActivate: [roleGuard(['pharmacist'])],          loadChildren: () => import('./features/demande-complement/demande-complement.routes').then(m => m.DEMANDE_COMPLEMENT_ROUTES) },
      { path: 'pharmacist/finance-dashboardpharmacie', canActivate: [roleGuard(['pharmacist', 'admin'])], loadChildren: () => import('./features/finance-dashboardpharmacie/finance-dashboardpharmacie.routes').then(m => m.FINANCEDASHBOARDPHARMACIEROUTES) },
      { path: 'pharmacist/finance-transactions',     canActivate: [roleGuard(['pharmacist', 'admin'])], loadChildren: () => import('./features/finance-transactions/finance-transactions.routes').then(m => m.FINANCETRANSACTIONSROUTES) },
      { path: 'pharmacist/finance-retraits',         canActivate: [roleGuard(['pharmacist', 'admin'])], loadChildren: () => import('./features/finance-retraits/finance-retraits.routes').then(m => m.FINANCERETRAITSROUTES) },
      { path: 'pharmacist/parametre-bancaire',       canActivate: [roleGuard(['pharmacist', 'admin'])], loadChildren: () => import('./features/parametre-bancaire/parametre-bancaire.routes').then(m => m.PARAMETREBANCAIREROUTES) },

      { path: 'commande',     redirectTo: 'pharmacist/commande',   pathMatch: 'full' },
      { path: 'demande-complement',     redirectTo: 'pharmacist/demande-complement',   pathMatch: 'full' },
      { path: 'finance-dashboardpharmacie',     redirectTo: 'pharmacist/finance-dashboardpharmacie',   pathMatch: 'full' },
      { path: 'finance-retraits',         redirectTo: 'pharmacist/finance-retraits',   pathMatch: 'full'  },
      { path: 'parametre-bancaire',     redirectTo: 'pharmacist/parametre-bancaire',   pathMatch: 'full'  },

      // ================= ORGANIZATION ROUTES =================
      { path: 'organization/dashboard',          canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'organization/account',            canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/comptes/organization-account.component').then(m => m.OrganizationAccountComponent) },
      { path: 'organization/rapport',            canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/rapports/rapports.component').then(m => m.RapportsComponent) },
      { path: 'organization/detail-rapport/:id', canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/rapports/detail-rapport.component').then(m => m.DetailRapportComponent) },
      { path: 'organization/budget',             canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/budget/budget.component').then(m => m.BudgetComponent) },
      { path: 'organization/demande',            canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/demande-organisation/demande-organisation.component').then(m => m.DemandeOrganisationComponent) },
      { path: 'organization/demande/:id',        canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/demande-organisation/detail-demande-organisation.component').then(m => m.DetailDemandeOrganisationComponent) },
      { path: 'organization/demande/:id/devis',  canActivate: [roleGuard(['admin', 'donor-organization'])], loadComponent: () => import('./features/demande-organisation/detail-devis-organisation.component').then(m => m.DetailDevisOrganisationComponent) },

      // ================= ASSOCIATION ROUTES =================
      { path: 'association/dashboard', canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'association/account',   canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/comptes/organization-account.component').then(m => m.OrganizationAccountComponent) },

      // ================= PATIENT ROUTES =================
      { path: 'patient/dashboard', canActivate: [roleGuard(['patient'])], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'patient/account',   canActivate: [roleGuard(['patient'])], loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },

      // ================= ADMIN ROUTES =================
      { path: 'admin/dashboard',      canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/dashboard-admin/dashboard-admin.component').then(m => m.DashboardAdminComponent) },
      { path: 'admin/account',        canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },
      { path: 'admin/medecins',       canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/medecins/medecins.component').then(m => m.MedecinsComponent) },
      { path: 'admin/medecins/:id',  canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/medecins/detail/medecin-detail.component').then(m => m.MedecinDetailComponent) },
      { path: 'admin/pharmacies',              canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/pharmacies/pharmacies.component').then(m => m.PharmaciesComponent) },
      { path: 'admin/pharmacies/new',          canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/pharmacies/pharmacie-form/pharmacie-form.component').then(m => m.PharmacieFormComponent) },
      { path: 'admin/pharmacies/detail/:id',   canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/pharmacies/detail/pharmacie-detail.component').then(m => m.PharmacieDetailComponent) },
      { path: 'admin/laboratoires',              canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/laboratoires/laboratoires.component').then(m => m.LaboratoiresComponent) },
      { path: 'admin/laboratoires/new',          canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/laboratoires/laboratoire-form/laboratoire-form.component').then(m => m.LaboratoireFormComponent) },
      { path: 'admin/laboratoires/detail/:id',   canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/laboratoires/detail/laboratoire-detail.component').then(m => m.LaboratoireDetailComponent) },
      { path: 'admin/imageries',                 canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/imageries/imageries.component').then(m => m.ImageriesComponent) },
      { path: 'admin/imageries/new',             canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/imageries/imagerie-form/imagerie-form.component').then(m => m.ImagerieFormComponent) },
      { path: 'admin/imageries/detail/:id',      canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/imageries/detail/imagerie-detail.component').then(m => m.ImagerieDetailComponent) },
      { path: 'admin/livreurs',       canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/livreurs/livreurs.component').then(m => m.LivreursComponent) },
      { path: 'admin/patients',       canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/patientmanage/patientmanage.component').then(m => m.PatientsComponent) },
      { path: 'admin/paiements-help', canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/paiements-help/paiements-help.component').then(m => m.PaiementsHelpComponent) },
      { path: 'admin/administration', canActivate: [roleGuard(['admin'])], loadComponent: () => import('./features/administration/administration.component').then(m => m.AdministrationComponent) },
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
      { path: 'laboratory/dashboard',    canActivate: [roleGuard(['lab-technician', 'admin'])], loadComponent: () => import('./features/dashboard-lab/dashboard-lab.component').then(m => m.DashboardLabComponent) },
      { path: 'laboratory/examens',      canActivate: [roleGuard(['lab-technician'])],           loadComponent: () => import('./features/laboratoire/examens-laboratoire/examens-laboratoire.component').then(m => m.ExamensLaboratoireComponent) },
      { path: 'laboratory/demandes',     canActivate: [roleGuard(['lab-technician'])],           loadComponent: () => import('./features/laboratoire/demande-laboratoire/demande-laboratoire.component').then(m => m.DemandeLaboratoireComponent) },
      { path: 'laboratory/demandes/:id', canActivate: [roleGuard(['lab-technician'])],           loadComponent: () => import('./features/laboratoire/demande-laboratoire/detail-demande-laboratoire.component').then(m => m.DetailDemandeLaboratoireComponent) },
      { path: 'laboratory/examens/:id',  canActivate: [roleGuard(['lab-technician'])],           loadComponent: () => import('./features/laboratoire/detail-laboratoire/detail-laboratoire.component').then(m => m.DetailLaboratoireComponent) },
      { path: 'laboratory/account',      canActivate: [roleGuard(['lab-technician'])],           loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },

      // ================= IMAGING CENTER ROUTES =================
      { path: 'imaging/dashboard',    canActivate: [roleGuard(['radiologist', 'admin'])], loadComponent: () => import('./features/imagerie/dashboard-imagerie/dashboard-imagerie.component').then(m => m.DashboardImagerieComponent) },
      { path: 'imaging/examens',      canActivate: [roleGuard(['radiologist'])],           loadComponent: () => import('./features/imagerie/examens-imagerie/examens-imagerie.component').then(m => m.ExamensImagerieComponent) },
      { path: 'imaging/examens/:id',  canActivate: [roleGuard(['radiologist'])],           loadComponent: () => import('./features/imagerie/detail-examen-imagerie/detail-examen-imagerie.component').then(m => m.DetailExamenImagerieComponent) },
      { path: 'imaging/demandes',     canActivate: [roleGuard(['radiologist'])],           loadComponent: () => import('./features/imagerie/demande-imagerie/demande-imagerie.component').then(m => m.DemandeImagerieComponent) },
      { path: 'imaging/demandes/:id', canActivate: [roleGuard(['radiologist'])],           loadComponent: () => import('./features/imagerie/detail-demande-imagerie/detail-demande-imagerie.component').then(m => m.DetailDemandeImagerieComponent) },
      { path: 'imaging/account',      canActivate: [roleGuard(['radiologist'])],           loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },

      // ================= HOSPITAL ROUTES =================
      { path: 'hospital/dashboard',                       canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/dashboard-hospital/dashboard-hospital.component').then(m => m.DashboardHospitalComponent) },
      { path: 'hospital/demandes',                        canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/demandes-medicales/demandes-medicales.component').then(m => m.DemandesMedicalesComponent) },
      { path: 'hospital/demandes/:id',                    canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/detail-demande-medicale/detail-demande-medicale.component').then(m => m.DetailDemandeMedicaleComponent) },
      { path: 'hospital/patients',                        canActivate: [roleGuard(['hospital'])],          loadComponent: () => import('./features/patients-hospital/patients-hospital.component').then(m => m.PatientsHospitalComponent) },
      { path: 'hospital/patients/:id',                    canActivate: [roleGuard(['hospital'])],          loadComponent: () => import('./features/patients-hospital/detail-patient.component').then(m => m.DetailPatientComponent) },
      { path: 'hospital/hospitalisations',                canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/hospitalisation/hospitalisation.component').then(m => m.HospitalisationComponent) },
      { path: 'hospital/hospitalisations/:id',            canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/hospitalisation/detail-hospitalisation.component').then(m => m.DetailHospitalisationComponent) },
      { path: 'hospital/chirurgie',                       canActivate: [roleGuard(['hospital', 'doctor'])],loadComponent: () => import('./features/chirurgie/chirurgie.component').then(m => m.ChirurgieComponent) },
      { path: 'hospital/chirurgie/nouvelle',              canActivate: [roleGuard(['hospital', 'doctor'])],loadComponent: () => import('./features/chirurgie/nouvelle-chirurgie.component').then(m => m.NouvelleChirurgieComponent) },
      { path: 'hospital/chirurgie/:id',                   canActivate: [roleGuard(['hospital', 'doctor'])],loadComponent: () => import('./features/chirurgie/detail-chirurgie.component').then(m => m.DetailChirurgieComponent) },
      { path: 'hospital/demande-materiels',               canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/demande-materiels/demande-materiels.component').then(m => m.DemandeMaterielComponent) },
      { path: 'hospital/demande-materiels/:ref',          canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/demande-materiels/detail-demande-materiels.component').then(m => m.DetailDemandeMaterielComponent) },
      { path: 'hospital/demande-materiels/:ref/devis/:fournisseur', canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/demande-materiels/detail-devis.component').then(m => m.DetailDevisComponent) },
      { path: 'hospital/paiements',                       canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/paiements-hospital/paiements-hospital.component').then(m => m.PaiementsHospitalComponent) },
      { path: 'hospital/paiements/:id',                   canActivate: [roleGuard(['hospital', 'admin'])], loadComponent: () => import('./features/paiements-hospital/detail-paiement.component').then(m => m.DetailPaiementComponent) },
      { path: 'hospital/account',                         canActivate: [roleGuard(['hospital'])],          loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },

      // ================= FOURNISSEUR ROUTES =================
      { path: 'fournisseur/dashboard',    canActivate: [roleGuard(['supplier', 'admin'])], loadComponent: () => import('./features/fournisseur/dashboard-fournisseur/dashboard-fournisseur.component').then(m => m.DashboardFournisseurComponent) },
      { path: 'fournisseur/demandes',     canActivate: [roleGuard(['supplier'])],          loadComponent: () => import('./features/fournisseur/demandes-fournisseur/demandes-fournisseur.component').then(m => m.DemandesFournisseurComponent) },
      { path: 'fournisseur/demandes/:id', canActivate: [roleGuard(['supplier'])],          loadComponent: () => import('./features/fournisseur/demandes-fournisseur/detail-demande-fournisseur.component').then(m => m.DetailDemandeFournisseurComponent) },
      { path: 'fournisseur/devis',        canActivate: [roleGuard(['supplier'])],          loadComponent: () => import('./features/fournisseur/devis-fournisseur/devis-fournisseur.component').then(m => m.DevisFournisseurComponent) },
      { path: 'fournisseur/devis/:id',    canActivate: [roleGuard(['supplier'])],          loadComponent: () => import('./features/fournisseur/devis-fournisseur/detail-devis-fournisseur.component').then(m => m.DetailDevisFournisseurComponent) },
      { path: 'fournisseur/account',      canActivate: [roleGuard(['supplier'])],          loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },

      // ================= DONOR ROUTES =================
      { path: 'donor/dashboard',      canActivate: [roleGuard(['donor-individual', 'donor-organization'])], loadComponent: () => import('./features/dons/dons.component').then(m => m.DonsComponent) },
      { path: 'donor/dons',           canActivate: [roleGuard(['donor-individual', 'donor-organization'])], loadComponent: () => import('./features/dons/dons.component').then(m => m.DonsComponent) },
      { path: 'donor/dons-historique',canActivate: [roleGuard(['donor-individual', 'donor-organization'])], loadComponent: () => import('./features/dons/dons-historique.component').then(m => m.DonsHistoriqueComponent) },
      { path: 'donor/detail-don/:id', canActivate: [roleGuard(['donor-individual', 'donor-organization'])], loadComponent: () => import('./features/dons/dons-detail.component').then(m => m.DonsDetailComponent) },
      { path: 'donor/account',        canActivate: [roleGuard(['donor-individual', 'donor-organization'])], loadComponent: () => import('./features/comptes/medical-account.component').then(m => m.MedicalAccountComponent) },

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

      { path: 'create-ordonnance',      redirectTo: 'doctor/create-ordonnance',    pathMatch: 'full' },
      { path: 'ordonnances',            redirectTo: 'doctor/ordonnances',          pathMatch: 'full' },
      { path: 'patients',               redirectTo: 'doctor/patients',             pathMatch: 'full' },
      { path: 'planings',               redirectTo: 'doctor/planings',             pathMatch: 'full' },
      { path: 'analyses-medical',       redirectTo: 'doctor/analyses-medical',     pathMatch: 'full' },
      { path: 'imagerie-medical',       redirectTo: 'doctor/imagerie-medical',     pathMatch: 'full' },
      { path: 'certificat-medical',     redirectTo: 'doctor/certificat-medical',   pathMatch: 'full' },
      { path: 'nouvelle-hospitalisation', redirectTo: 'doctor/nouvelle-hospitalisation', pathMatch: 'full' },

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
