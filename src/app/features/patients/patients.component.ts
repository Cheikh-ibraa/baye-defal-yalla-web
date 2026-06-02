import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgOtpInputModule } from 'ng-otp-input';
import { ExamensComponent } from '../examens/examens.component';
import { ImagerieListComponent } from '../imagerie-list/imagerie-list.component';
import { FileToDataUrlPipe } from '../../pipes/file-to-data-url.pipe';
import { environment } from '../../../environments/environment';
import { buildImageUrl } from '../../core/utils/image.helper';
import Swal from 'sweetalert2';
// Import des services
import { VueEnsembleService, ClinicalData, ChronicDisease, FamilyHistory, Allergy, ChirurgicalHistory, DrugIntolerance, Treatment } from '../../services/vue-ensemble.service';
import { VitalSignsService, VitalSign } from '../../services/vital-signs.service';
import { LifestyleService, Lifestyle } from '../../services/lifestyle.service';
import { VaccinationService, Vaccination as VaccinationData } from '../../services/vaccination.service';
import { SmsService } from '../../services/sms.service';
import { AuthService } from '../../services/auth.service';
import { OrdonnanceService, Ordonnance as OrdonnanceData, OrdonnanceResponse } from '../../services/ordonnance.service';
import { ConsultationService, ConsultationPageResponse } from '../../services/consultation.service';
import { MedicalCertificateService, CertificatePageResponse, MedicalCertificate } from '../../services/medical-certificate.service';
import {
  HospitalisationService,
  Hospitalization,
  JournalAction,
  ActionType,
  DischargeOrder,
  CreateActionRequest,
  CreateDischargeOrderRequest
} from '../../services/hospitalisation.service';

interface Patient {
  id: string;
  nom: string;
  initiales: string;
  telephone: string;
  lastVisit: string;
  age: number;
  dateNaissance: string;
  sexe: string;
  groupe: string;
  poids: number;
  taille: number;
  imc: string;
}

interface AntecedentFamilial {
  nom: string;
  membre: string;
}

interface MaladieCronique {
  nom: string;
  badge?: boolean;
}

interface AntecedentChirurgical {
  nom: string;
  date: string;
}

interface Intolerance {
  nom: string;
}

interface Traitement {
  nom: string;
  dosage: string;
}

interface Tab {
  id: string;
  label: string;
}

interface Hospitalisation {
  id: number;
  etablissement: string;
  service: string;
  admission: string;
  dateAdmission: string;
  dateSortie?: string;
  heure?: string;
  statut: string;
  motif: string;
  priorite: string;
  image?: string;
  traitementEnCours?: boolean;
}

interface Examen {
  date: string;
  nom: string;
  valeur: string;
  reference: string;
  etat: string;
}

interface Imagerie {
  nom: string;
  resultat: string;
  date: string;
  medecin: string;
}

interface Consultation {
  id: number;
  patientId: number;
  patientName?: string;
  patientPhone?: string;
  doctorId: number;
  doctorName?: string;
  date: string;
  title: string;
  observation: string;
  recommendation: string;
  type: 'TELECONSULTATION' | 'PRESENTIEL';
}

interface ActionJournal {
  type: string;
  titre: string;
  date: string;
  heure: string;
  description?: string;
  dose?: string;
  remarques?: string;
  infirmiere: string;
}

interface NouvelleAction {
  date: string;
  heure: string;
  type: string;
  description: string;
  dose: string;
  remarques: string;
}

interface TypeAction {
  id: string;
  label: string;
  icon: 'pill' | 'eye' | 'utensils' | 'heart' | 'dots';
}

// Interfaces locales (pour les données non liées aux services)
interface Patient {
  id: string;
  nom: string;
  initiales: string;
  telephone: string;
  lastVisit: string;
  age: number;
  dateNaissance: string;
  sexe: string;
  groupe: string;
  poids: number;
  taille: number;
  imc: string;
}

interface Hospitalisation {
  id: number;
  etablissement: string;
  service: string;
  admission: string;
  dateAdmission: string;
  dateSortie?: string;
  heure?: string;
  statut: string;
  motif: string;
  priorite: string;
  image?: string;
  traitementEnCours?: boolean;
}

interface Examen {
  date: string;
  nom: string;
  valeur: string;
  reference: string;
  etat: string;
}

interface Imagerie {
  nom: string;
  resultat: string;
  date: string;
  medecin: string;
}

interface ActionJournal {
  type: string;
  titre: string;
  date: string;
  heure: string;
  description?: string;
  dose?: string;
  remarques?: string;
  infirmiere: string;
}

interface NouvelleAction {
  date: string;
  heure: string;
  type: string;
  description: string;
  dose: string;
  remarques: string;
}

interface TypeAction {
  id: string;
  label: string;
  icon: 'pill' | 'eye' | 'utensils' | 'heart' | 'dots';
}

interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, ExamensComponent, ImagerieListComponent, FileToDataUrlPipe, NgOtpInputModule],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {

  // Données hospitalisation depuis l'API
  hospitalisationsData: Hospitalization[] = [];
  selectedHospitalisationData: Hospitalization | null = null;
  actionsJournalData: JournalAction[] = [];
  typesActionData: ActionType[] = [];
  ordreSortieData: DischargeOrder | null = null;
  dischargeOrderMap: Map<number, boolean> = new Map(); // Map hospitalisation ID -> a un ordre de sortie

  // Données ordonnances depuis l'API
  ordonnancesData: OrdonnanceData[] = [];
  totalOrdonnances = 0;
  totalPagesOrdonnances = 0;
  currentPageOrdonnances = 0;
  pageSizeOrdonnances = 10;

  // Données mock pour les sections non encore connectées à l'API
  hospitalisations: Hospitalisation[] = [
    {
      id: 1,
      etablissement: 'Centre médical de l\'Institut Pasteur',
      service: 'Endocrinologie',
      admission: 'Admission : 20/10/2025 à 14:30',
      dateAdmission: '20/10/2025',
      dateSortie: '26/10/2025',
      statut: 'Sortie',
      motif: 'Déséquilibre glycémique sévère',
      priorite: 'Normale'
    },
    {
      id: 2,
      etablissement: 'Hôpital principal de Dakar',
      service: 'Chirurgie Orthopédique',
      admission: 'Admission : 01/12/2025 à 08:00',
      dateAdmission: '01/12/2025',
      statut: 'En cours',
      motif: 'Fracture du poignet gauche',
      priorite: 'Urgent'
    }
  ];

  examens: Examen[] = [
    { date: '12/12/2025', nom: 'Glycémie à jeun', valeur: '0.95 g/L', reference: '0.70 - 1.10', etat: 'Normal' },
    { date: '12/12/2025', nom: 'HbA1c', valeur: '6.2 %', reference: '4.0 - 6.0', etat: 'Normal' },
    { date: '10/11/2025', nom: 'Glycémie à jeun', valeur: '1.15 g/L', reference: '0.70 - 1.10', etat: 'Anormal' }
  ];

  imageriesMedicales: Imagerie[] = [
    { nom: 'Radio Thorax', resultat: 'Absence de foyer parenchymateux. Silhouette cardio-médiastinale normale.', date: '15/11/2025', medecin: 'Dr. Diop' }
  ];

  consultations: Consultation[] = [];

  // États de chargement pour consultations
  loadingConsultations = false;
  consultationsError = '';

  certificats: MedicalCertificate[] = [];

  // États de chargement pour certificats
  loadingCertificats = false;
  certificatsError = '';

  actionsJournal: ActionJournal[] = [
    {
      type: 'medication',
      titre: 'Administration Metformine',
      date: '16/12/2025',
      heure: '08:00',
      description: 'Administration orale',
      dose: '1000mg',
      infirmiere: 'Awa Ndour'
    },
    {
      type: 'monitoring',
      titre: 'Contrôle glycémie capillaire',
      date: '16/12/2025',
      heure: '12:00',
      description: 'Glycémie à 1.20 g/L',
      infirmiere: 'Fatou Seck'
    },
    {
      type: 'meal',
      titre: 'Déjeuner',
      date: '16/12/2025',
      heure: '13:00',
      description: 'Repas équilibré servi',
      remarques: 'Patient a bien mangé',
      infirmiere: 'Moussa Fall'
    }
  ];

  infosSortie: {
    etatPatient: string;
    recommandations: string;
    traitementDomicile: string;
    commentaires: string;
  } | null = null;

  // États de chargement
  loadingHospitalisations = false;
  loadingActions = false;
  loadingOrdonnances = false;
  ordonnancesError = '';
  doctorSpecialties: { [doctorId: number]: string } = {};

  // Utilisateur courant (médecin)
  currentUser: any = null;

  // États des modals d'ajout
  showAllergieModal = false;
  showAntecedentFamilialModal = false;
  showMaladiechroniqueModal = false;
  showAntecedentChirurgicalModal = false;
  showIntoleranceModal = false;
  showTraitementModal = false;

  // Formulaires
  formAllergie = { name: '' };
  formAntecedentFamilial = { label: '', relatedPerson: '' };
  formMaladieCronique = { name: '' };
  formAntecedentChirurgical = { label: '', date: '' };
  formIntolerance = { medication: '', details: '' };
  formTraitement = { label: '', description: '' };
  formErrorMessage = '';

  // === États d'affichage ===
  rechercheTexte: string = '';
  showPatientDetail: boolean = false;
  showAccessModal: boolean = false;
  selectedPatient: Patient | null = null;

  showModeVieModal = false;
  showPopup = false;
  showVaccinationModal = false;
  showHospitalisationDetail = false;
  selectedHospitalisation: Hospitalisation | null = null;
  activeDetailTab = 'resume';
  showAddActionModal = false;
  showCreateActionTypeModal = false;
  showFormulaireSortie = false;
  loadingTypesAction = false;
  creatingActionType = false;
  newActionType: { name: string; description: string; icon: File | null } = { name: '', description: '', icon: null };
  showCliniqueDataModal = false;
  showNouvelleDemandeModal = false;
  // === Accès modal ===
  accessType: 'partiel' | 'complet' | null = null;
  otpCode: string = '';
  otpDigits: string[] = ['', '', '', ''];
  otpValue: string = '';
  otpConfig = { length: 4, allowNumbersOnly: true, inputClass: 'otp-patient-box' };
  otpError: string = '';
  showOtpPopup: boolean = false;
  showOtpSentPopup: boolean = false;
  otpLoading: boolean = false;
  otpValidating: boolean = false;

  // === Données dynamiques depuis les services ===
  cliniqueData: ClinicalData | null = null;
  allergies: Allergy[] = [];
  antecedentsFamiliaux: FamilyHistory[] = [];
  maladiesChroniques: ChronicDisease[] = [];
  antecedentsChirurgicaux: ChirurgicalHistory[] = [];
  intolerances: DrugIntolerance[] = [];
  traitementActuel: Treatment[] = [];

  signesVitaux: VitalSign | null = null;
  historiqueSignesVitaux: VitalSign[] = [];

  modeDeVie: Lifestyle | null = null;
  loadingModeDeVie = false;
  savingModeDeVie = false;
  isEditingModeDeVie = false; // true = modification, false = création
  formModeDeVie = {
    dietaryHabits: '',
    physicalActivity: '',
    alcoholConsumption: '',
    smoker: ''
  };

  vaccinations: VaccinationData[] = [];

  // === États de chargement et erreurs pour les médicaments ===
  loadingMedicaments = false;
  medicamentsError = '';

  // === Formulaires ===
  formData = {
    tensionArterielle: '',
    frequenceCardiaque: '',
    frequenceRespiratoire: '',
    temperature: '',
    saturationOxygene: ''
  };
  formCliniqueData = {
    sex: '',
    bloodGroup: '',
    weight: 0,
    height: 0,
    bmi: 0
  };
  formulaireSortie = {
    dateSortie: '',
    heureSortie: '',
    etatPatient: '',
    recommandations: '',
    traitementDomicile: '',
    commentaires: ''
  };

  closeFormulaireSortie(): void {
    this.showFormulaireSortie = false;
  }

  // === Modal Nouvelle demande ===
  openNouvelleDemandeModal(): void {
    console.log('🚀 Ouverture du modal "Créer"');
    console.log('📅 Date/Heure:', new Date().toLocaleString('fr-FR'));
    console.log('👤 Patient sélectionné:', this.selectedPatient?.nom || 'Aucun');
    console.log('✅ Modal ouvert avec succès');
    this.showNouvelleDemandeModal = true;
  }



  closeNouvelleDemandeModal(): void {
    this.showNouvelleDemandeModal = false;
  }

  newVaccination = {
    vaccineName: '',
    doseNumber: 1,
    vaccinationDate: '',
    nextDoseDate: '',
    status: 'PLANNED' as 'PLANNED' | 'DONE' | 'MISSED',
    notes: ''
  };

  nouvelleAction: NouvelleAction = {
    date: '',
    heure: new Date().toTimeString().slice(0, 5),
    type: '',
    description: '',
    dose: '',
    remarques: ''
  };

  // === Tabs principaux ===
  activeTab = 'vue-ensemble';
  tabs: Tab[] = [
    { id: 'vue-ensemble', label: "Vue d'ensemble" },
    { id: 'signes-vitaux', label: 'Signes vitaux' },
    { id: 'mode-de-vie', label: 'Mode de vie' },
    { id: 'vaccinations', label: 'Vaccinations' },
    { id: 'medicaments', label: 'Médicaments' },
    { id: 'hospitalisation', label: 'Hospitalisation' },
    { id: 'examens', label: 'Analyses' },
    { id: 'imagerie', label: 'Imagerie' },
    { id: 'consultations', label: 'Consultations' },
    { id: 'ordonnances', label: 'Ordonnances' },
    { id: 'certificats', label: 'Certificats' }
  ];

  detailTabs = [
    { id: 'resume', label: 'Résumé' },
    { id: 'journal', label: 'Journal infirmier' },
    { id: 'sortie', label: 'Sortie' }
  ];

  typesAction: TypeAction[] = [
    { id: 'medication', label: 'Administration médicament', icon: 'pill' },
    { id: 'monitoring', label: 'Contrôle signes vitaux', icon: 'eye' },
    { id: 'meal', label: 'Repas / Hydratation', icon: 'utensils' },
    { id: 'care', label: 'Soins / Pansement', icon: 'heart' },
    { id: 'other', label: 'Autre', icon: 'dots' }
  ];

  // Pas de données mock - tout vient de l'API

  // Référence au helper pour les templates
  buildImageUrl = buildImageUrl;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private vueEnsembleService: VueEnsembleService,
    private vitalSignsService: VitalSignsService,
    private lifestyleService: LifestyleService,
    private vaccinationService: VaccinationService,
    private smsService: SmsService,
    private hospitalisationService: HospitalisationService,
    private authService: AuthService,
    private ordonnanceService: OrdonnanceService,
    private consultationService: ConsultationService,
    private certificateService: MedicalCertificateService
  ) { }

  ngOnInit(): void {
    // Récupérer l'utilisateur connecté (même approche que le header)
    this.currentUser = this.authService.getCurrentUser();

    // S'abonner aux changements de l'utilisateur
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    });

    // Si l'utilisateur existe et a un ID, charger son profil complet
    if (this.currentUser && this.currentUser.id) {
      this.authService.getCurrentUserById(this.currentUser.id).subscribe({
        next: (user) => {
          this.currentUser = user;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du profil:', error);
        }
      });
    }

    // Restaurer l'onglet actif depuis les query params (pour persister après refresh)
    this.route.queryParams.subscribe(params => {
      const tabParam = params['tab'];
      if (tabParam && this.tabs.find(t => t.id === tabParam)) {
        this.activeTab = tabParam;
      }
    });

    const storedPatient = localStorage.getItem('selectedPatient');
    if (storedPatient) {
      this.selectedPatient = JSON.parse(storedPatient);
      this.showPatientDetail = true;
      this.loadPatientData();
    }
  }

  // ========== TRAITEMENT (MÉDICAMENTS) ==========
  openTraitementModal(): void {
    this.formTraitement = { label: '', description: '' };
    this.formErrorMessage = '';
    this.showTraitementModal = true;
  }

  closeTraitementModal(): void {
    this.showTraitementModal = false;
  }

  saveTraitement(): void {
    if (!this.selectedPatient || !this.formTraitement.label.trim() || !this.formTraitement.description.trim()) {
      this.formErrorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    this.formErrorMessage = '';
    this.vueEnsembleService.createTreatment(telephone, this.formTraitement).subscribe({
      next: () => {
        this.loadTraitements(telephone);
        this.closeTraitementModal();
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Traitement ajouté avec succès', confirmButtonColor: '#00B894' });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de l\'ajout du traitement', confirmButtonColor: '#00B894' });
      }
    });
  }

  deleteTraitement(id: number, label: string): void {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Êtes-vous sûr de vouloir supprimer le traitement "${label}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      width: '400px',
      customClass: {
        popup: 'swal2-small'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.vueEnsembleService.deleteTreatment(id).subscribe({
          next: () => {
            if (this.selectedPatient) {
              const telephone = this.selectedPatient.telephone.replace(/\s/g, '');
              this.loadTraitements(telephone);
            }
            Swal.fire({
              title: 'Supprimé!',
              text: 'Le traitement a été supprimé avec succès.',
              icon: 'success',
              confirmButtonColor: '#01b894',
              confirmButtonText: 'OK',
              width: '400px'
            });
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            Swal.fire({
              title: 'Erreur!',
              text: 'Impossible de supprimer le traitement.',
              icon: 'error',
              confirmButtonColor: '#01b894',
              confirmButtonText: 'OK',
              width: '400px'
            });
          }
        });
      }
    });
  }

  // ========== ALLERGIES ==========
  openAllergieModal(): void {
    this.formAllergie = { name: '' };
    this.formErrorMessage = '';
    this.showAllergieModal = true;
  }

  closeAllergieModal(): void {
    this.showAllergieModal = false;
  }

  saveAllergie(): void {
    if (!this.selectedPatient || !this.formAllergie.name.trim()) {
      this.formErrorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    this.formErrorMessage = '';
    this.vueEnsembleService.createAllergy(telephone, this.formAllergie).subscribe({
      next: () => {
        this.loadAllergies(telephone);
        this.closeAllergieModal();
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Allergie ajoutée avec succès', confirmButtonColor: '#00B894' });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de l\'ajout de l\'allergie', confirmButtonColor: '#00B894' });
      }
    });
  }

  // ========== ANTÉCÉDENTS FAMILIAUX ==========
  openAntecedentFamilialModal(): void {
    this.formAntecedentFamilial = { label: '', relatedPerson: '' };
    this.formErrorMessage = '';
    this.showAntecedentFamilialModal = true;
  }

  closeAntecedentFamilialModal(): void {
    this.showAntecedentFamilialModal = false;
  }

  saveAntecedentFamilial(): void {
    if (!this.selectedPatient || !this.formAntecedentFamilial.label.trim() || !this.formAntecedentFamilial.relatedPerson.trim()) {
      this.formErrorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    this.formErrorMessage = '';
    this.vueEnsembleService.createFamilyHistory(telephone, this.formAntecedentFamilial).subscribe({
      next: () => {
        this.loadAntecedentsFamiliaux(telephone);
        this.closeAntecedentFamilialModal();
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Antécédent familial ajouté avec succès', confirmButtonColor: '#00B894' });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de l\'ajout de l\'antécédent familial', confirmButtonColor: '#00B894' });
      }
    });
  }
  // ========== MALADIES CHRONIQUES ==========
  openMaladieChroniqueModal(): void {
    this.formMaladieCronique = { name: '' };
    this.formErrorMessage = '';
    this.showMaladiechroniqueModal = true;
  }

  closeMaladieChroniqueModal(): void {
    this.showMaladiechroniqueModal = false;
  }

  saveMaladieCronique(): void {
    if (!this.selectedPatient || !this.formMaladieCronique.name.trim()) {
      this.formErrorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    this.formErrorMessage = '';
    this.vueEnsembleService.createChronicDiseases(telephone, this.formMaladieCronique).subscribe({
      next: () => {
        this.loadMaladiesChroniques(telephone);
        this.closeMaladieChroniqueModal();
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Maladie chronique ajoutée avec succès', confirmButtonColor: '#00B894' });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de l\'ajout de la maladie chronique', confirmButtonColor: '#00B894' });
      }
    });
  }

  // ========== ANTÉCÉDENTS CHIRURGICAUX ==========
  openAntecedentChirurgicalModal(): void {
    this.formAntecedentChirurgical = { label: '', date: '' };
    this.formErrorMessage = '';
    this.showAntecedentChirurgicalModal = true;
  }

  closeAntecedentChirurgicalModal(): void {
    this.showAntecedentChirurgicalModal = false;
  }
  /**
   * Formate une date du format YYYY-MM-DD (HTML input) vers DD-MM-YYYY
   * @param dateString - Date au format YYYY-MM-DD
   * @returns Date au format DD-MM-YYYY
   */
  private formatDateToBackend(dateString: string): string {
    if (!dateString) return '';

    // dateString vient d'un input type="date" au format YYYY-MM-DD
    const [year, month, day] = dateString.split('-');

    // Retourne au format DD-MM-YYYY
    return `${day}-${month}-${year}`;
  }
  saveAntecedentChirurgical(): void {
    if (!this.selectedPatient || !this.formAntecedentChirurgical.label.trim() || !this.formAntecedentChirurgical.date) {
      this.formErrorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    // Formater la date avant l'envoi
    const chirurgicalData = {
      label: this.formAntecedentChirurgical.label,
      date: this.formatDateToBackend(this.formAntecedentChirurgical.date)
    };

    this.formErrorMessage = '';
    this.vueEnsembleService.createChirurgicalHistory(telephone, chirurgicalData).subscribe({
      next: () => {
        this.loadAntecedentsChirurgicaux(telephone);
        this.closeAntecedentChirurgicalModal();
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Antécédent chirurgical ajouté avec succès', confirmButtonColor: '#00B894' });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de l\'ajout de l\'antécédent chirurgical', confirmButtonColor: '#00B894' });
      }
    });
  }
  // ========== INTOLÉRANCES MÉDICAMENTEUSES ==========
  openIntoleranceModal(): void {
    this.formIntolerance = { medication: '', details: '' };
    this.formErrorMessage = '';
    this.showIntoleranceModal = true;
  }

  closeIntoleranceModal(): void {
    this.showIntoleranceModal = false;
  }

  saveIntolerance(): void {
    if (!this.selectedPatient || !this.formIntolerance.medication.trim()) {
      this.formErrorMessage = 'Veuillez remplir au moins le médicament';
      return;
    }

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    this.formErrorMessage = '';
    this.vueEnsembleService.createDrugIntolerance(telephone, this.formIntolerance).subscribe({
      next: () => {
        this.loadIntolerances(telephone);
        this.closeIntoleranceModal();
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Intolérance médicamenteuse ajoutée avec succès', confirmButtonColor: '#00B894' });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de l\'ajout de l\'intolérance', confirmButtonColor: '#00B894' });
      }
    });
  }

  // ========== SUPPRESSION GÉNÉRIQUE ==========
  confirmDelete(type: string, id: number, name: string): void {
    const typeNames: { [key: string]: string } = {
      'allergie': 'allergie',
      'antecedentFamilial': 'antécédent familial',
      'maladieCronique': 'maladie chronique',
      'antecedentChirurgical': 'antécédent chirurgical',
      'intolerance': 'intolérance médicamenteuse'
    };

    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer ${typeNames[type]} "${name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00B894',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDelete(type, id);
      }
    });
  }

  executeDelete(type: string, id: number): void {
    if (!this.selectedPatient) return;

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    let deleteObservable;
    let reloadFunction;

    switch (type) {
      case 'allergie':
        deleteObservable = this.vueEnsembleService.deleteAllergy(id);
        reloadFunction = () => this.loadAllergies(telephone);
        break;
      case 'antecedentFamilial':
        deleteObservable = this.vueEnsembleService.deleteFamilyHistory(id);
        reloadFunction = () => this.loadAntecedentsFamiliaux(telephone);
        break;
      case 'maladieCronique':
        deleteObservable = this.vueEnsembleService.deleteChronicDiseases(id);
        reloadFunction = () => this.loadMaladiesChroniques(telephone);
        break;
      case 'antecedentChirurgical':
        deleteObservable = this.vueEnsembleService.deleteChirurgicalHistory(id);
        reloadFunction = () => this.loadAntecedentsChirurgicaux(telephone);
        break;
      case 'intolerance':
        deleteObservable = this.vueEnsembleService.deleteDrugIntolerance(id);
        reloadFunction = () => this.loadIntolerances(telephone);
        break;
      default:
        return;
    }

    deleteObservable.subscribe({
      next: () => {
        reloadFunction();
        Swal.fire({
          title: 'Supprimé !',
          text: 'L\'élément a été supprimé avec succès',
          icon: 'success',
          confirmButtonColor: '#00B894',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la suppression',
          icon: 'error',
          confirmButtonColor: '#00B894'
        });
      }
    });
  }

  loadPatientData(): void {
    if (!this.selectedPatient) return;

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    // Charger toutes les données en parallèle
    this.loadCliniqueData(telephone);
    this.loadAllergies(telephone);
    this.loadAntecedentsFamiliaux(telephone);
    this.loadMaladiesChroniques(telephone);
    this.loadAntecedentsChirurgicaux(telephone);
    this.loadIntolerances(telephone);
    this.loadTraitements(telephone);
    this.loadSignesVitaux(telephone);
    this.loadModeDeVie(telephone);
    this.loadVaccinations(telephone);
    this.loadHospitalisations(telephone);
    this.loadOrdonnances(telephone);
    this.loadConsultations(telephone);
    this.loadCertificates();
  }

  // Données cliniques
  loadCliniqueData(telephone: string): void {
    this.vueEnsembleService.getCliniqueData(telephone).subscribe({
      next: (data) => {
        this.cliniqueData = data;
        // Mettre à jour les données du patient sélectionné
        if (this.selectedPatient) {
          this.selectedPatient.sexe = data.sex;
          this.selectedPatient.groupe = data.bloodGroup;
          this.selectedPatient.poids = data.weight;
          this.selectedPatient.taille = data.height;
          this.selectedPatient.imc = data.bmi.toString();
        }
      },
      error: (error) => console.error('Erreur lors du chargement des données cliniques:', error)
    });
  }
  loadAllergies(telephone: string): void {
    this.vueEnsembleService.getAllergy(telephone).subscribe({
      next: (data) => this.allergies = data,
      error: (error) => console.error('Erreur lors du chargement des allergies:', error)
    });
  }

  // Antécédents familiaux
  loadAntecedentsFamiliaux(telephone: string): void {
    this.vueEnsembleService.getFamilyHistory(telephone).subscribe({
      next: (data) => this.antecedentsFamiliaux = data,
      error: (error) => console.error('Erreur lors du chargement des antécédents familiaux:', error)
    });
  }

  // Maladies chroniques
  loadMaladiesChroniques(telephone: string): void {
    this.vueEnsembleService.getChronicDiseases(telephone).subscribe({
      next: (data) => this.maladiesChroniques = data,
      error: (error) => console.error('Erreur lors du chargement des maladies chroniques:', error)
    });
  }

  // Antécédents chirurgicaux
  loadAntecedentsChirurgicaux(telephone: string): void {
    this.vueEnsembleService.getChirurgicalHistory(telephone).subscribe({
      next: (data) => this.antecedentsChirurgicaux = data,
      error: (error) => console.error('Erreur lors du chargement des antécédents chirurgicaux:', error)
    });
  }

  // Intolérances médicamenteuses
  loadIntolerances(telephone: string): void {
    this.vueEnsembleService.getDrugIntolerance(telephone).subscribe({
      next: (data) => this.intolerances = data,
      error: (error) => console.error('Erreur lors du chargement des intolérances:', error)
    });
  }

  // Traitements
  loadTraitements(telephone: string): void {
    this.loadingMedicaments = true;
    this.medicamentsError = '';

    this.vueEnsembleService.getTreatment(telephone).subscribe({
      next: (data) => {
        this.traitementActuel = data;
        this.loadingMedicaments = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des traitements:', error);
        this.medicamentsError = 'Impossible de charger les médicaments';
        this.loadingMedicaments = false;
      }
    });
  }

  // Signes vitaux
  loadSignesVitaux(telephone: string): void {
    this.vitalSignsService.getVitalSigns(telephone).subscribe({
      next: (data) => this.signesVitaux = data,
      error: (error) => console.error('Erreur lors du chargement des signes vitaux:', error)
    });

    // Charger l'historique des signes vitaux
    this.vitalSignsService.getHistory(telephone, 0, 10).subscribe({
      next: (data) => this.historiqueSignesVitaux = data.content,
      error: (error) => console.error('Erreur lors du chargement de l\'historique:', error)
    });
  }

  // Mode de vie
  loadModeDeVie(telephone: string): void {
    this.loadingModeDeVie = true;
    this.modeDeVie = null;

    this.lifestyleService.getLifeStyle(telephone).subscribe({
      next: (data) => {
        this.modeDeVie = data;
        this.loadingModeDeVie = false;
      },
      error: (error) => {
        // Si 404, c'est que le mode de vie n'existe pas encore
        this.modeDeVie = null;
        this.loadingModeDeVie = false;
        if (error.status !== 404) {
          console.error('Erreur lors du chargement du mode de vie:', error);
        }
      }
    });
  }

  // Vaccinations
  loadVaccinations(telephone: string): void {
    this.vaccinationService.getVaccination(telephone, 0, 50).subscribe({
      next: (data) => this.vaccinations = data.content,
      error: (error) => console.error('Erreur lors du chargement des vaccinations:', error)
    });
  }


  // Données cliniques - Modal
  openCliniqueDataModal(): void {
    if (this.cliniqueData) {
      this.formCliniqueData = {
        sex: this.cliniqueData.sex,
        bloodGroup: this.cliniqueData.bloodGroup,
        weight: this.cliniqueData.weight,
        height: this.cliniqueData.height,
        bmi: this.cliniqueData.bmi
      };
    }
    this.showCliniqueDataModal = true;
  }

  closeCliniqueDataModal(): void {
    this.showCliniqueDataModal = false;
  }

  saveCliniqueData(): void {
    if (!this.selectedPatient) return;

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    this.vueEnsembleService.createCliniqueData(telephone, this.formCliniqueData).subscribe({
      next: (data) => {
        this.cliniqueData = data;
        if (this.selectedPatient) {
          this.selectedPatient.sexe = data.sex;
          this.selectedPatient.groupe = data.bloodGroup;
          this.selectedPatient.poids = data.weight;
          this.selectedPatient.taille = data.height;
          this.selectedPatient.imc = data.bmi.toString();
        }
        this.closeCliniqueDataModal();
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Données cliniques enregistrées avec succès', confirmButtonColor: '#00B894' });
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement:', error);
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de l\'enregistrement des données', confirmButtonColor: '#00B894' });
      }
    });
  }




  // === Méthodes recherche & accès ===

  /**
   * Recherche un patient par téléphone ou référence
   * Logique : si la saisie contient uniquement des chiffres (avec espaces/tirets) → téléphone
   * Sinon (contient des lettres) → référence
   */
  searchPatientByPhoneOrReference(searchTerm: string): void {
    const cleanedTerm = searchTerm.trim();

    // Retirer les caractères de formatage pour analyser
    const cleanedForAnalysis = cleanedTerm.replace(/[\s\-\(\)]/g, '');

    // Si contient uniquement des chiffres → téléphone
    // Sinon → référence (peut être PT-000245, REF123, ou n'importe quel format)
    if (/^\d+$/.test(cleanedForAnalysis)) {
      this.searchByPhone(cleanedTerm);
    } else {
      this.searchByReference(cleanedTerm);
    }
  }

  /**
   * Recherche par téléphone
   */
  private searchByPhone(phone: string): void {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    if (cleanPhone.length < 9) {
      Swal.fire({
        title: 'Téléphone invalide',
        text: 'Veuillez saisir un numéro de téléphone valide',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    this.authService.getUserByPhone(cleanPhone).subscribe({
      next: (user) => {
        console.log('✅ Patient trouvé par téléphone:', user);
        this.mapUserToPatient(user);

        // Sauvegarder le patientId pour les formulaires (consultation, hospitalisation, etc.)
        if ((user as any).id) {
          localStorage.setItem('selectedPatientId', (user as any).id.toString());
        }

        this.showAccessModal = true;
        this.accessType = null;
      },
      error: (error) => {
        console.error('❌ Erreur recherche par téléphone:', error);
        if (error.status === 404) {
          Swal.fire({
            title: 'Patient introuvable',
            text: 'Aucun patient trouvé avec ce numéro de téléphone',
            icon: 'error',
            confirmButtonColor: '#01b894',
            width: '400px'
          });
        } else {
          Swal.fire({
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la recherche',
            icon: 'error',
            confirmButtonColor: '#01b894',
            width: '400px'
          });
        }
      }
    });
  }

  /**
   * Recherche par référence
   */
  private searchByReference(reference: string): void {
    this.authService.getUserByReference(reference).subscribe({
      next: (patient) => {
        console.log('✅ Patient trouvé par référence:', patient);
        this.mapPatientByReferenceToPatient(patient);
        this.showAccessModal = true;
        this.accessType = null;
      },
      error: (error) => {
        console.error('❌ Erreur recherche par référence:', error);
        if (error.status === 404) {
          Swal.fire({
            title: 'Patient introuvable',
            text: 'Aucun patient trouvé avec cette référence',
            icon: 'error',
            confirmButtonColor: '#01b894',
            width: '400px'
          });
        } else {
          Swal.fire({
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la recherche',
            icon: 'error',
            confirmButtonColor: '#01b894',
            width: '400px'
          });
        }
      }
    });
  }

  /**
   * Mapper User (from getUserByPhone) vers Patient local
   */
  private mapUserToPatient(user: any): void {
    const prenom = user.prenom || user.firstName || '';
    const nom = user.nom || user.lastName || user.name || '';
    const fullName = `${prenom} ${nom}`.trim() || 'Nom non disponible';

    const initiales = this.getInitials(prenom, nom);

    this.selectedPatient = {
      id: user.reference || `ID-${user.id}`,
      nom: fullName,
      initiales: initiales,
      telephone: user.telephone || '',
      lastVisit: '',
      age: 0, // Sera mis à jour via loadHospitalisations
      dateNaissance: user.birthDate || '',
      sexe: user.sex || '',
      groupe: user.bloodGroup || '',
      poids: user.weight || 0,
      taille: user.height || 0,
      imc: user.bmi ? user.bmi.toFixed(1) : '0'
    };

    // Sauvegarder dans localStorage pour persistance
    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
  }

  /**
   * Mapper PatientByReference vers Patient local
   */
  private mapPatientByReferenceToPatient(patient: any): void {
    const prenom = patient.prenom || patient.firstName || '';
    const nom = patient.nom || patient.lastName || patient.name || '';
    const fullName = `${prenom} ${nom}`.trim() || 'Nom non disponible';
    const initiales = this.getInitials(prenom, nom);

    this.selectedPatient = {
      id: patient.reference || `ID-${patient.id}`,
      nom: fullName,
      initiales: initiales,
      telephone: patient.telephone || '',
      lastVisit: '',
      age: 0,
      dateNaissance: '',
      sexe: patient.sex || '',
      groupe: patient.bloodGroup || '',
      poids: patient.weight || 0,
      taille: patient.height || 0,
      imc: patient.bmi ? patient.bmi.toFixed(1) : '0'
    };

    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
  }

  /**
   * Générer les initiales à partir du prénom et nom
   */
  private getInitials(prenom: string, nom: string): string {
    const p = (prenom || '').charAt(0).toUpperCase();
    const n = (nom || '').charAt(0).toUpperCase();
    return p && n ? `${p}${n}` : p || n || '?';
  }

  handleOpenDossier(): void {
    if (!this.rechercheTexte.trim()) {
      Swal.fire({
        title: 'Champ vide',
        text: 'Veuillez entrer un numéro de téléphone ou une référence patient',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    this.searchPatientByPhoneOrReference(this.rechercheTexte);
  }



  handleOtpSubmit(): void {
    if (this.otpCode === '1234') {
      this.closeModal();
      this.showPatientDetail = true;
      this.activeTab = 'vue-ensemble';
    } else {
      this.otpError = 'Code OTP incorrect. Veuillez réessayer.';
    }
  }

  // Gestionnaire pour le succès OTP depuis le popup
  onOtpSuccess(): void {
    if (!this.selectedPatient) return;

    const phoneNumber = this.selectedPatient.telephone.replace(/\s/g, '');
    const otpValue = this.otpCode;

    this.otpLoading = true;

    this.smsService.validateOtp(phoneNumber, otpValue).subscribe({
      next: (isValid) => {
        this.otpLoading = false;
        if (isValid) {
          this.showOtpPopup = false;
          this.showPatientDetail = true;
          this.activeTab = 'vue-ensemble';
          this.loadPatientData();
        } else {
          this.otpError = 'Code OTP incorrect';
        }
      },
      error: (error) => {
        this.otpLoading = false;
        console.error('Erreur lors de la validation:', error);
        this.otpError = 'Erreur lors de la validation de l\'OTP';
      }
    });
  }

  // Gestionnaire pour l'annulation du popup OTP
  onOtpCancel(): void {
    this.showOtpPopup = false;
    this.otpError = '';
    this.otpCode = '';
  }

  // Gestionnaire pour renvoyer l'OTP
  onOtpResend(): void {
    this.sendOtpToPatient();
  }
  resetAccessModal(): void {
    this.accessType = null;
    this.otpCode = '';
    this.otpError = '';
    this.showAccessModal = false;
  }
  closeModal(): void {
    this.showAccessModal = false;
    this.otpCode = '';
    this.otpError = '';
  }

  selectAccessType(type: 'partiel' | 'complet'): void {
    this.accessType = type;
    this.otpError = '';
    this.otpCode = '';
  }

  handleContinue(): void {
    if (this.accessType === 'partiel') {
      this.proceedWithPartialAccess();
    } else if (this.accessType === 'complet') {
      // Envoyer l'OTP
      this.sendOtpToPatient();
    }
  }
  sendOtpToPatient(): void {
    if (!this.selectedPatient) return;

    // Formater le numéro avec l'indicatif +221
    let phoneNumber = this.selectedPatient.telephone.replace(/\s/g, '');
    if (!phoneNumber.startsWith('+221')) {
      phoneNumber = phoneNumber.startsWith('221')
        ? '+' + phoneNumber
        : '+221' + phoneNumber;
    }

    this.otpLoading = true;
    this.otpError = '';

    this.smsService.sendOtp(phoneNumber).subscribe({
      next: () => {
        this.otpLoading = false;
        this.showAccessModal = false;
        this.showOtpSentPopup = true;
      },
      error: (error) => {
        this.otpLoading = false;
        console.error('Erreur lors de l\'envoi de l\'OTP:', error);
        this.otpError = 'Impossible d\'envoyer l\'OTP. Veuillez réessayer.';
      }
    });
  }

  /** Ouvre le formulaire de saisie du code OTP après confirmation d'envoi */
  openOtpInput(): void {
    this.showOtpSentPopup = false;
    this.otpDigits = ['', '', '', ''];
    this.otpValue = '';
    this.otpError = '';
    this.showOtpPopup = true;
  }

  /** Annule depuis le popup "Code envoyé" */
  cancelOtpSent(): void {
    this.showOtpSentPopup = false;
    this.otpError = '';
    this.otpCode = '';
    this.otpDigits = ['', '', '', ''];
    this.otpValue = '';
  }

  /** Mise à jour valeur depuis ng-otp-input */
  onOtpChange(value: string): void {
    this.otpValue = value || '';
    this.otpError = '';
  }

  /** Valide le code OTP via l'API et redirige vers le dossier patient */
  validateOtpCode(): void {
    const otp = this.otpValue;
    if (otp.length < 4 || !this.selectedPatient) return;

    let phoneNumber = this.selectedPatient.telephone.replace(/\s/g, '');
    if (!phoneNumber.startsWith('+221')) {
      phoneNumber = phoneNumber.startsWith('221') ? '+' + phoneNumber : '+221' + phoneNumber;
    }

    this.otpValidating = true;
    this.otpError = '';

    this.smsService.validateOtp(phoneNumber, otp).subscribe({
      next: (isValid) => {
        this.otpValidating = false;
        if (isValid) {
          this.showOtpPopup = false;
          this.otpDigits = ['', '', '', ''];
          this.otpValue = '';
          this.showPatientDetail = true;
          this.activeTab = 'vue-ensemble';
          this.loadPatientData();
        } else {
          this.otpError = 'Code incorrect. Veuillez réessayer.';
        }
      },
      error: () => {
        this.otpValidating = false;
        this.otpError = 'Erreur de validation. Veuillez réessayer.';
      }
    });
  }

  /** Ferme le popup de saisie OTP */
  cancelOtpInput(): void {
    this.showOtpPopup = false;
    this.otpDigits = ['', '', '', ''];
    this.otpValue = '';
    this.otpError = '';
  }
  private proceedWithPartialAccess(): void {
    console.log('Accès partiel accordé');
    this.closeModal();
    this.showPatientDetail = true;
    this.activeTab = 'vue-ensemble';
    this.loadPatientData();
  }
  private proceedWithFullAccess(): void {
    console.log('Accès complet accordé avec OTP valide');
    this.closeModal();
    this.showPatientDetail = true;
    this.activeTab = 'vue-ensemble';
    // Accès total → aucune restriction
  }
  handleCloseDetail(): void {
    this.showPatientDetail = false;
    this.selectedPatient = null;
    this.activeTab = 'vue-ensemble';
    this.rechercheTexte = '';
    localStorage.removeItem('selectedPatient');
  }

  // Méthode helper pour recharger les médicaments (utilisée dans le template)
  reloadMedicaments(): void {
    if (!this.selectedPatient) return;
    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');
    this.loadTraitements(telephone);
  }

  // === Modals ===

  // Mode de vie
  openModeVieModal(isEditing: boolean = false): void {
    this.isEditingModeDeVie = isEditing;

    if (isEditing && this.modeDeVie) {
      // Préremplir le formulaire avec les données existantes
      this.formModeDeVie = {
        dietaryHabits: this.modeDeVie.dietaryHabits || '',
        physicalActivity: this.modeDeVie.physicalActivity || '',
        alcoholConsumption: this.modeDeVie.alcoholConsumption || '',
        smoker: this.modeDeVie.smoker || ''
      };
    } else {
      // Réinitialiser le formulaire pour la création
      this.formModeDeVie = {
        dietaryHabits: '',
        physicalActivity: '',
        alcoholConsumption: '',
        smoker: ''
      };
    }

    this.showModeVieModal = true;
  }

  closeModeVieModal(): void {
    this.showModeVieModal = false;
    this.formModeDeVie = {
      dietaryHabits: '',
      physicalActivity: '',
      alcoholConsumption: '',
      smoker: ''
    };
  }

  saveModeVie(): void {
    if (!this.selectedPatient) return;

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');
    this.savingModeDeVie = true;

    if (this.isEditingModeDeVie && this.modeDeVie) {
      // Modification
      const updateData = {
        id: this.modeDeVie.id,
        dietaryHabits: this.formModeDeVie.dietaryHabits,
        physicalActivity: this.formModeDeVie.physicalActivity,
        alcoholConsumption: this.formModeDeVie.alcoholConsumption,
        smoker: this.formModeDeVie.smoker
      };

      this.lifestyleService.updateLifeStyle(telephone, updateData).subscribe({
        next: (data) => {
          this.modeDeVie = data;
          this.savingModeDeVie = false;
          this.closeModeVieModal();
          Swal.fire({
            title: 'Succès',
            text: 'Mode de vie modifié avec succès',
            icon: 'success',
            confirmButtonColor: '#00B894',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          this.savingModeDeVie = false;
          console.error('Erreur lors de la modification:', error);
          Swal.fire({
            title: 'Erreur',
            text: 'Erreur lors de la modification du mode de vie',
            icon: 'error',
            confirmButtonColor: '#00B894'
          });
        }
      });
    } else {
      // Création
      const createData = {
        dietaryHabits: this.formModeDeVie.dietaryHabits,
        physicalActivity: this.formModeDeVie.physicalActivity,
        alcoholConsumption: this.formModeDeVie.alcoholConsumption,
        smoker: this.formModeDeVie.smoker
      };

      this.lifestyleService.createLifeStyle(telephone, createData).subscribe({
        next: (data) => {
          this.modeDeVie = data;
          this.savingModeDeVie = false;
          this.closeModeVieModal();
          Swal.fire({
            title: 'Succès',
            text: 'Mode de vie ajouté avec succès',
            icon: 'success',
            confirmButtonColor: '#00B894',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          this.savingModeDeVie = false;
          console.error('Erreur lors de l\'ajout:', error);
          Swal.fire({
            title: 'Erreur',
            text: 'Erreur lors de l\'ajout du mode de vie',
            icon: 'error',
            confirmButtonColor: '#00B894'
          });
        }
      });
    }
  }


  openPopup() { this.showPopup = true; }
  closePopup() {
    this.showPopup = false;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      tensionArterielle: '',
      frequenceCardiaque: '',
      frequenceRespiratoire: '',
      temperature: '',
      saturationOxygene: ''
    };
  }

  // Signes vitaux - Enregistrement
  enregistrer(): void {
    if (!this.selectedPatient) return;

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    const vitalSignData = {
      id: 0,
      bloodPressure: this.formData.tensionArterielle,
      heartRate: parseInt(this.formData.frequenceCardiaque) || 0,
      respiratoryRate: parseInt(this.formData.frequenceRespiratoire) || 0,
      temperature: parseFloat(this.formData.temperature) || 0,
      oxygenSaturation: parseInt(this.formData.saturationOxygene) || 0,
      updatedAt: new Date().toISOString()
    };

    this.vitalSignsService.createVitalSign(telephone, vitalSignData).subscribe({
      next: (data) => {
        this.signesVitaux = data;
        this.loadSignesVitaux(telephone);
        this.closePopup();
        alert('Signes vitaux enregistrés avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement:', error);
        alert('Erreur lors de l\'enregistrement des signes vitaux');
      }
    });
  }

  annuler(): void { this.closePopup(); }

  openVaccinationModal() { this.showVaccinationModal = true; }
  closeVaccinationModal() {
    this.showVaccinationModal = false;
    // Réinitialiser le formulaire
    this.newVaccination = {
      vaccineName: '',
      doseNumber: 1,
      vaccinationDate: '',
      nextDoseDate: '',
      status: 'PLANNED' as 'PLANNED' | 'DONE' | 'MISSED',
      notes: ''
    };
  }

  // Vaccination - Ajout
  addVaccination(): void {
    if (!this.selectedPatient) return;
    if (!this.newVaccination.vaccineName || !this.newVaccination.vaccinationDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');

    // Préparer les données pour l'envoi (format DD-MM-YYYY requis par l'API)
    const vaccinationData = {
      ...this.newVaccination,
      vaccinationDate: this.formatDateToBackend(this.newVaccination.vaccinationDate),
      nextDoseDate: this.newVaccination.nextDoseDate
        ? this.formatDateToBackend(this.newVaccination.nextDoseDate)
        : ''
    };

    this.vaccinationService.createVaccination(telephone, vaccinationData).subscribe({
      next: () => {
        this.loadVaccinations(telephone);
        this.closeVaccinationModal();
        alert('Vaccination ajoutée avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout:', error);
        alert('Erreur lors de l\'ajout de la vaccination');
      }
    });
  }
  deleteVaccination(id: number): void {
    if (!this.selectedPatient) return;

    Swal.fire({
      title: 'Confirmer la suppression',
      text: 'Voulez-vous vraiment supprimer cette vaccination ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      width: '400px'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const telephone = this.selectedPatient!.telephone.replace(/\s/g, '');

      this.vaccinationService.deleteVaccination(telephone, id).subscribe({
        next: () => {
          this.loadVaccinations(telephone);
          Swal.fire({
            icon: 'success',
            title: 'Supprimée',
            text: 'La vaccination a été supprimée avec succès.',
            confirmButtonColor: '#00B894',
            width: '400px'
          });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de supprimer la vaccination.',
            confirmButtonColor: '#00B894',
            width: '400px'
          });
        }
      });
    });
  }


  closeHospitalisationDetail() {
    this.showHospitalisationDetail = false;
    this.selectedHospitalisation = null;
    document.body.style.overflow = 'auto';
  }

  openAddActionModal() {
    this.nouvelleAction = {
      date: new Date().toISOString().split('T')[0],
      heure: new Date().toTimeString().slice(0, 5),
      type: '',
      description: '',
      dose: '',
      remarques: ''
    };
    this.showAddActionModal = true;
  }

  closeAddActionModal() {
    this.showAddActionModal = false;
  }

  /**
   * Ouvre la modale de création de type d'action
   */
  openCreateActionTypeModal(): void {
    this.newActionType = { name: '', description: '', icon: null };
    this.showCreateActionTypeModal = true;
  }

  /**
   * Ferme la modale de création de type d'action
   */
  closeCreateActionTypeModal(): void {
    this.showCreateActionTypeModal = false;
    this.newActionType = { name: '', description: '', icon: null };
  }

  /**
   * Gère la sélection du fichier icon
   */
  onActionTypeIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newActionType.icon = input.files[0];
    }
  }

  /**
   * Crée un nouveau type d'action via l'API (multipart/form-data)
   */
  createActionType(): void {
    if (!this.newActionType.name.trim() || !this.newActionType.icon) return;

    this.creatingActionType = true;

    const formData = new FormData();
    formData.append('name', this.newActionType.name.trim());
    formData.append('description', this.newActionType.description || '');
    formData.append('icon', this.newActionType.icon);

    this.hospitalisationService.createActionType(formData).subscribe({
      next: (createdType) => {
        this.creatingActionType = false;
        this.closeCreateActionTypeModal();

        // Rafraîchir la liste et auto-sélectionner
        this.typesActionData = [...this.typesActionData, createdType];
        this.nouvelleAction.type = createdType.id.toString();

        Swal.fire({
          title: 'Succès',
          text: 'Type d\'action créé avec succès',
          icon: 'success',
          confirmButtonColor: '#00B894',
          timer: 2000,
          showConfirmButton: false,
          width: '400px'
        });
      },
      error: (error) => {
        this.creatingActionType = false;
        console.error('Erreur création type action:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de créer le type d\'action. Veuillez réessayer.',
          icon: 'error',
          confirmButtonColor: '#00B894',
          width: '400px'
        });
      }
    });
  }





  // === Utilitaires UI ===

  /**
   * Construit l'URL complète pour une icône de type d'action
   */
  getActionTypeIconUrl(iconFilename: string | null): string {
    return buildImageUrl(iconFilename);
  }

  /**
   * Gère l'erreur de chargement d'une image en affichant le placeholder
   */
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/persona.png';
  }

  getActiveTabLabel(): string {
    return this.tabs.find(t => t.id === this.activeTab)?.label || '';
  }

  /**
   * Sélectionne un onglet et met à jour l'URL avec le query param
   */
  selectTab(tabId: string): void {
    this.activeTab = tabId;
    // Mettre à jour l'URL avec le query param pour persister l'onglet après refresh
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  getInitialesColor(initiales: string): string {
    const colors = [
      'bg-gray-100 text-black-700',
      'bg-gray-100 text-black-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-gray-100 text-black-700',
      'bg-indigo-100 text-indigo-700'
    ];
    const hash = initiales.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  getActionColor(type: string): string {
    const map: Record<string, string> = {
      medication: 'bg-blue-100 text-blue-700',
      monitoring: 'bg-green-100 text-green-700',
      meal: 'bg-yellow-100 text-yellow-700',
      care: 'bg-purple-100 text-purple-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return map[type] || 'bg-gray-100 text-gray-700';
  }

  getActionLabel(type: string): string {
    const map: Record<string, string> = {
      medication: 'Médicament',
      monitoring: 'Surveillance',
      meal: 'Repas',
      care: 'Soins',
      other: 'Autre'
    };
    return map[type] || 'Autre';
  }

  getActionIconColor(type: string): string {
    const map: Record<string, string> = {
      medication: '#EA580C',
      monitoring: '#6C5CE7',
      meal: '#F59E0B',
      care: '#8B5CF6',
      other: '#6B7280'
    };
    return map[type] || '#6B7280';
  }
  getActionIcon(type: string): SafeHtml {
    const icons: Record<string, string> = {
      medication: `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.17146 8.2446L8.24346 1.1716C8.6149 0.800159 9.05587 0.505514 9.54118 0.30449C10.0265 0.103466 10.5467 3.9138e-09 11.072 0C11.5973 -3.9138e-09 12.1174 0.103466 12.6027 0.30449C13.088 0.505514 13.529 0.800159 13.9005 1.1716C14.2719 1.54305 14.5665 1.98401 14.7676 2.46933C14.9686 2.95464 15.0721 3.4748 15.0721 4.0001C15.0721 4.5254 14.9686 5.04556 14.7676 5.53088C14.5665 6.01619 14.2719 6.45716 13.9005 6.8286L6.83046 13.8996C6.45914 14.2712 6.01827 14.5661 5.533 14.7674C5.04773 14.9686 4.52757 15.0723 4.00222 15.0726C3.47688 15.0728 2.95663 14.9695 2.47118 14.7687C1.98574 14.5679 1.5446 14.2734 1.17296 13.9021C0.801316 13.5308 0.50645 13.0899 0.305194 12.6046C0.103937 12.1194 0.000232533 11.5992 3.90603e-07 11.0739C-0.000231752 10.5485 0.103013 10.0283 0.303841 9.54283C0.504668 9.05738 0.800144 8.61624 1.17146 8.2446ZM10.2995 9.0156L13.1925 6.1226C13.4747 5.84483 13.6992 5.51392 13.8529 5.14896C14.0067 4.784 14.0866 4.39221 14.0882 3.99619C14.0898 3.60017 14.0129 3.20776 13.8621 2.84159C13.7112 2.47543 13.4894 2.14275 13.2093 1.86276C12.9292 1.58276 12.5965 1.36099 12.2303 1.21022C11.8641 1.05946 11.4717 0.982695 11.0757 0.984354C10.6796 0.986013 10.2879 1.06606 9.92295 1.21989C9.55802 1.37371 9.22716 1.59827 8.94946 1.8806L6.05646 4.7736L10.2995 9.0156Z" fill="#EA580C"/>
</svg>

    `,

      monitoring: `
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 5.5C16 5.5 13 0 8 0C3 0 0 5.5 0 5.5C0 5.5 3 11 8 11C13 11 16 5.5 16 5.5ZM1.173 5.5C1.65578 4.76459 2.21197 4.08008 2.833 3.457C4.12 2.168 5.88 1 8 1C10.12 1 11.879 2.168 13.168 3.457C13.789 4.08008 14.3452 4.76459 14.828 5.5C14.7707 5.58667 14.7057 5.68267 14.633 5.788C14.298 6.268 13.803 6.908 13.168 7.543C11.879 8.832 10.119 10 8 10C5.881 10 4.121 8.832 2.832 7.543C2.21097 6.91992 1.65578 6.23541 1.173 5.5Z" fill="#6C5CE7"/>
<path d="M8 3C7.33696 3 6.70107 3.26339 6.23223 3.73223C5.76339 4.20107 5.5 4.83696 5.5 5.5C5.5 6.16304 5.76339 6.79893 6.23223 7.26777C6.70107 7.73661 7.33696 8 8 8C8.66304 8 9.29893 7.73661 9.76777 7.26777C10.2366 6.79893 10.5 6.16304 10.5 5.5C10.5 4.83696 10.2366 4.20107 9.76777 3.73223C9.29893 3.26339 8.66304 3 8 3ZM4.5 5.5C4.5 4.57174 4.86875 3.6815 5.52513 3.02513C6.1815 2.36875 7.07174 2 8 2C8.92826 2 9.8185 2.36875 10.4749 3.02513C11.1313 3.6815 11.5 4.57174 11.5 5.5C11.5 6.42826 11.1313 7.3185 10.4749 7.97487C9.8185 8.63125 8.92826 9 8 9C7.07174 9 6.1815 8.63125 5.52513 7.97487C4.86875 7.3185 4.5 6.42826 4.5 5.5Z" fill="#6C5CE7"/>
</svg>

    `,

      meal: `
      <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.5 0.5V5.16667C0.5 5.6971 0.710714 6.20581 1.08579 6.58088C1.46086 6.95595 1.96957 7.16667 2.5 7.16667H3.16667M3.16667 7.16667H3.83333C4.36377 7.16667 4.87247 6.95595 5.24755 6.58088C5.62262 6.20581 5.83333 5.6971 5.83333 5.16667V0.5M3.16667 7.16667V0.5M3.16667 7.16667V12.8333M12.1667 12.8333V8.5M12.1667 8.5V0.857333C12.1667 0.762563 12.129 0.671674 12.062 0.604661C11.995 0.537648 11.9041 0.5 11.8093 0.5C11.02 0.5 10.2631 0.813542 9.70498 1.37165C9.14688 1.92976 8.83333 2.68672 8.83333 3.476V7.16667C8.83333 7.52029 8.97381 7.85943 9.22386 8.10948C9.47391 8.35952 9.81304 8.5 10.1667 8.5H12.1667Z" stroke="#64748B" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

    `,

      care: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg">
        <path stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364"/>
      </svg>
    `,

      other: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg">
        <path stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
    `
    };

    return this.sanitizer.bypassSecurityTrustHtml(
      icons[type] || icons['other']
    );
  }


  // Navigation externe (si tu as une page dédiée)
  openHospitalisationPage() {
    this.router.navigate(['/hospitalisations']);
  }
  openConsultationsPage() {
    this.router.navigate(['/consultations']);
  }
  goToOrdonnance() {
    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
    this.closeNouvelleDemandeModal();
    this.router.navigate(['/create-ordonnance']);
  }
  goTohospitalisations() {
    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
    this.closeNouvelleDemandeModal();
    this.router.navigate(['/hospitalisations']);
  }
  goTocertificatmedical() {
    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
    this.closeNouvelleDemandeModal();
    this.router.navigate(['/certificat-medical']);
  }
  goToanalysesmedical() {
    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
    this.closeNouvelleDemandeModal();
    this.router.navigate(['/analyses-medical']);
  }
  goToimageriemedical() {
    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
    this.closeNouvelleDemandeModal();
    this.router.navigate(['/imagerie-medical']);
  }

  goBackToList() {
    this.showPatientDetail = false;
    this.selectedPatient = null;
    localStorage.removeItem('selectedPatient');
  }

  // ========== HOSPITALISATIONS ==========

  /**
   * Charge les hospitalisations d'un patient
   */
  loadHospitalisations(telephone: string): void {
    this.loadingHospitalisations = true;

    // Récupérer l'ID du médecin connecté si disponible
    const responsibleMedicalId = this.currentUser?.id;

    this.hospitalisationService.getHospitalisationsByPatient(
      telephone,
      undefined, // facilityId
      undefined, // departmentId
      responsibleMedicalId, // ID du médecin connecté
      0,
      50
    ).subscribe({
      next: (response) => {
        this.hospitalisationsData = response.content;
        this.loadingHospitalisations = false;

        // Extraire les informations du patient (birthDate et age) depuis la première hospitalisation
        if (response.content.length > 0 && response.content[0].patient) {
          const patientData = response.content[0].patient as any;

          // Mettre à jour selectedPatient avec birthDate et age
          if (this.selectedPatient) {
            this.selectedPatient.age = patientData.age || 0;
            this.selectedPatient.dateNaissance = patientData.birthDate || '';

            // Mettre à jour le localStorage
            localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));

            console.log('✅ Informations patient mises à jour:', {
              age: this.selectedPatient.age,
              dateNaissance: this.selectedPatient.dateNaissance
            });
          }
        }

        // Charger le statut de sortie pour chaque hospitalisation
        this.loadDischargeStatusForAll();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des hospitalisations:', error);
        this.loadingHospitalisations = false;
        this.hospitalisationsData = [];
      }
    });
  }

  /**
   * Ouvre le détail d'une hospitalisation
   */
  openHospitalisationDetailData(hospitalisationId: number): void {
    this.hospitalisationService.getHospitalisationById(hospitalisationId).subscribe({
      next: (data) => {
        this.selectedHospitalisationData = data;
        this.showHospitalisationDetail = true;
        this.activeDetailTab = 'resume';
        document.body.style.overflow = 'hidden';

        // Charger les types d'actions si pas encore chargés
        if (this.typesActionData.length === 0) {
          this.loadTypesAction();
        }

        // Charger le journal infirmier
        this.loadActionsJournal(hospitalisationId);

        // Charger l'ordre de sortie si existe
        this.loadOrdreSortie(hospitalisationId);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du détail:', error);
        alert('Erreur lors du chargement des détails de l\'hospitalisation');
      }
    });
  }

  /**
   * Charge les types d'actions disponibles
   */
  loadTypesAction(): void {
    this.loadingTypesAction = true;
    this.hospitalisationService.getTypeActions().subscribe({
      next: (data) => {
        this.typesActionData = data;
        this.loadingTypesAction = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des types d\'actions:', error);
        this.loadingTypesAction = false;
      }
    });
  }

  /**
   * Charge le journal infirmier d'une hospitalisation
   */
  loadActionsJournal(hospitalisationId: number): void {
    this.loadingActions = true;

    this.hospitalisationService.getActions(hospitalisationId, 0, 50).subscribe({
      next: (response) => {
        this.actionsJournalData = response.content;
        this.loadingActions = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du journal:', error);
        this.loadingActions = false;
        this.actionsJournalData = [];
      }
    });
  }

  /**
   * Charge le statut de sortie pour toutes les hospitalisations de la liste
   */
  loadDischargeStatusForAll(): void {
    this.hospitalisationsData.forEach(hosp => {
      this.hospitalisationService.recupereOrdreSortie(hosp.id).subscribe({
        next: () => {
          // Un ordre de sortie existe
          this.dischargeOrderMap.set(hosp.id, true);
        },
        error: () => {
          // Pas d'ordre de sortie
          this.dischargeOrderMap.set(hosp.id, false);
        }
      });
    });
  }

  /**
   * Charge l'ordre de sortie d'une hospitalisation
   */
  loadOrdreSortie(hospitalisationId: number): void {
    this.hospitalisationService.recupereOrdreSortie(hospitalisationId).subscribe({
      next: (data) => {
        this.ordreSortieData = data;
        this.dischargeOrderMap.set(hospitalisationId, true);
      },
      error: (error) => {
        // Pas d'ordre de sortie - normal si l'hospitalisation est en cours
        this.ordreSortieData = null;
        this.dischargeOrderMap.set(hospitalisationId, false);
      }
    });
  }

  /**
   * Ferme le modal de détail
   */
  closeHospitalisationDetailData(): void {
    this.showHospitalisationDetail = false;
    this.selectedHospitalisationData = null;
    this.actionsJournalData = [];
    this.ordreSortieData = null;
    document.body.style.overflow = 'auto';
  }

  /**
   * Ouvre le modal d'ajout d'action
   */
  openAddActionModalData(): void {
    this.nouvelleAction = {
      date: new Date().toISOString().split('T')[0],
      heure: new Date().toTimeString().slice(0, 5),
      type: '',
      description: '',
      dose: '',
      remarques: ''
    };
    this.showAddActionModal = true;
  }

  /**
   * Sélectionne un type d'action
   */
  selectTypeActionData(typeId: number): void {
    this.nouvelleAction.type = typeId.toString();
  }

  /**
   * Ajoute une action au journal
   */
  ajouterActionData(): void {
    if (!this.selectedHospitalisationData || !this.currentUser) {
      alert('Erreur: données manquantes');
      return;
    }

    if (!this.nouvelleAction.type) {
      Swal.fire({
        title: 'Type d\'action requis',
        text: 'Veuillez sélectionner ou créer un type d\'action',
        icon: 'warning',
        confirmButtonColor: '#00B894',
        width: '400px'
      });
      return;
    }

    if (!this.nouvelleAction.date || !this.nouvelleAction.heure) {
      Swal.fire({
        title: 'Informations incomplètes',
        text: 'Veuillez renseigner la date et l\'heure de l\'action',
        icon: 'warning',
        confirmButtonColor: '#00B894',
        width: '400px'
      });
      return;
    }

    // Formater la date et l'heure
    const actionDateTime = this.formatDateTimeToBackend(
      this.nouvelleAction.date,
      this.nouvelleAction.heure
    );

    const actionRequest: CreateActionRequest = {
      hospitalizationId: this.selectedHospitalisationData.id,
      actionTypeId: parseInt(this.nouvelleAction.type),
      authorId: this.currentUser.id,
      actionDateTime: actionDateTime,
      description: this.nouvelleAction.description || '',
      remark: this.nouvelleAction.remarques || ''
    };

    this.hospitalisationService.createAction(actionRequest).subscribe({
      next: () => {
        this.loadActionsJournal(this.selectedHospitalisationData!.id);
        this.closeAddActionModal();
        Swal.fire({
          title: 'Succès',
          text: 'Action ajoutée avec succès au journal',
          icon: 'success',
          confirmButtonColor: '#00B894',
          timer: 2000,
          showConfirmButton: false,
          width: '400px'
        });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout de l\'action:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible d\'ajouter l\'action au journal. Veuillez réessayer.',
          icon: 'error',
          confirmButtonColor: '#00B894',
          width: '400px'
        });
      }
    });
  }

  /**
   * Ouvre le formulaire de sortie
   */
  ouvrirFormulaireSortieData(): void {
    if (!this.selectedHospitalisationData) return;

    const aujourdHui = new Date();
    this.formulaireSortie = {
      dateSortie: aujourdHui.toISOString().split('T')[0],
      heureSortie: aujourdHui.toTimeString().slice(0, 5),
      etatPatient: '',
      recommandations: '',
      traitementDomicile: '',
      commentaires: ''
    };

    this.showFormulaireSortie = true;
  }

  /**
   * Autorise la sortie du patient
   */
  autoriserSortieData(): void {
    if (!this.selectedHospitalisationData) return;

    if (!this.formulaireSortie.etatPatient || !this.formulaireSortie.recommandations) {
      alert('Veuillez remplir au moins l\'état du patient et les recommandations');
      return;
    }

    // Formater la date et l'heure de sortie
    const dischargeDateTime = this.formatDateTimeToBackend(
      this.formulaireSortie.dateSortie,
      this.formulaireSortie.heureSortie
    );

    const sortieRequest: CreateDischargeOrderRequest = {
      hospitalizationId: this.selectedHospitalisationData.id,
      dischargeDateTime: dischargeDateTime,
      patientCondition: this.formulaireSortie.etatPatient,
      postHospitalizationRecommendations: this.formulaireSortie.recommandations,
      homeTreatment: this.formulaireSortie.traitementDomicile || '',
      comment: this.formulaireSortie.commentaires || ''
    };

    this.hospitalisationService.createSortie(sortieRequest).subscribe({
      next: (data) => {
        this.ordreSortieData = data;
        // Mettre à jour le Map pour la liste
        this.dischargeOrderMap.set(this.selectedHospitalisationData!.id, true);

        // Recharger l'hospitalisation pour mettre à jour le statut
        if (this.selectedHospitalisationData) {
          this.loadHospitalisations(this.selectedPatient!.telephone.replace(/\s/g, ''));
          this.hospitalisationService.getHospitalisationById(this.selectedHospitalisationData.id).subscribe({
            next: (updatedHosp) => {
              this.selectedHospitalisationData = updatedHosp;
            }
          });
        }

        this.closeFormulaireSortie();
        this.activeDetailTab = 'sortie';
        alert('Sortie autorisée avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de l\'autorisation de sortie:', error);
        alert('Erreur lors de l\'autorisation de sortie');
      }
    });
  }

  /**
   * Formate une date et heure au format DD-MM-YYYY HH:mm
   */
  private formatDateTimeToBackend(date: string, time: string): string {
    if (!date || !time) return '';

    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year} ${time}`;
  }

  /**
   * Obtient l'icône d'une action depuis l'API
   */
  getActionIconFromAPI(action: JournalAction): SafeHtml {
    if (action.type && action.type.icon) {
      // Construire l'URL avec le helper centralisé
      const iconUrl = buildImageUrl(action.type.icon);
      const imgTag = `<img src="${iconUrl}" alt="${action.type.name}" class="w-8 h-8" onerror="this.src='assets/images/persona.png'" />`;
      return this.sanitizer.bypassSecurityTrustHtml(imgTag);
    }

    // Icône par défaut si pas d'icône
    const defaultIcon = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
    </svg>
  `;
    return this.sanitizer.bypassSecurityTrustHtml(defaultIcon);
  }

  /**
   * Formate une date ISO en format français
   */
  formatDateFr(isoDate: string): string {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtient le libellé de priorité traduit
   */
  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      'NORMAL': 'Normal',
      'URGENCE': 'Urgent'
    };
    return map[priority] || priority;
  }

  /**
   * Obtient le statut traduit (pour compatibilité)
   * @deprecated Utiliser getHospitalizationStatus() pour le statut réel
   */
  getStatutTraduit(priority: string): string {
    return this.getPriorityLabel(priority);
  }

  /**
   * Détermine le statut réel d'une hospitalisation
   * Le statut dépend UNIQUEMENT de l'existence d'un ordre de sortie (autorisation de sortie)
   * et NON de exitDateTime qui est juste la date de sortie prévue
   * 
   * - "en-cours" : Hospitalisation créée, pas encore d'autorisation de sortie
   * - "sortie-autorisee" : Une autorisation de sortie a été créée (hasDischargeOrder() === true)
   */
  getHospitalizationStatus(hosp: Hospitalization): 'en-cours' | 'sortie-autorisee' {
    // Pour l'hospitalisation sélectionnée, vérifier via ordreSortieData (chargé dans le modal)
    if (this.selectedHospitalisationData?.id === hosp.id && this.hasDischargeOrder()) {
      return 'sortie-autorisee';
    }
    // Pour la liste, vérifier via le Map des ordres de sortie
    if (this.dischargeOrderMap.get(hosp.id) === true) {
      return 'sortie-autorisee';
    }
    // Par défaut, l'hospitalisation est "en cours"
    return 'en-cours';
  }

  /**
   * Obtient le libellé court du statut pour les cards de la liste d'hospitalisations
   * 
   * Règles d'affichage :
   * - "En cours" : hospitalisation active, pas d'autorisation de sortie
   * - "Sortie" : version courte pour les cards, quand sortie autorisée
   * 
   * @param hosp - L'hospitalisation dont on veut le statut
   * @returns "Sortie" | "En cours"
   */
  getHospitalizationStatusLabelShort(hosp: Hospitalization): string {
    return this.getHospitalizationStatus(hosp) === 'sortie-autorisee' ? 'Sortie' : 'En cours';
  }

  /**
   * Obtient le libellé complet du statut pour le modal de détail d'hospitalisation
   * 
   * Règles d'affichage :
   * - "En cours" : hospitalisation active, pas d'autorisation de sortie
   * - "Sortie autorisée" : version longue pour le modal, quand sortie autorisée
   * 
   * @param hosp - L'hospitalisation dont on veut le statut
   * @returns "Sortie autorisée" | "En cours"
   */
  getHospitalizationStatusLabel(hosp: Hospitalization): string {
    return this.getHospitalizationStatus(hosp) === 'sortie-autorisee' ? 'Sortie autorisée' : 'En cours';
  }

  /**
   * Vérifie si le bouton "Autoriser la sortie" doit être visible
   */
  canAuthorizeDischarge(): boolean {
    if (!this.selectedHospitalisationData) return false;
    // Visible si pas d'ordre de sortie autorisé
    return !this.hasDischargeOrder();
  }

  /**
   * Vérifie si l'hospitalisation a une sortie
   */
  hasDischargeOrder(): boolean {
    return this.ordreSortieData !== null;
  }

  // ========== ORDONNANCES ==========

  /**
   * Charge les ordonnances d'un patient par téléphone
   */
  loadOrdonnances(telephone: string, page: number = 0): void {
    this.loadingOrdonnances = true;
    this.ordonnancesError = '';

    this.ordonnanceService.getOrdonnancesByPhone(telephone, page, this.pageSizeOrdonnances).subscribe({
      next: (response: OrdonnanceResponse) => {
        this.ordonnancesData = response.content;
        this.totalOrdonnances = response.totalElements;
        this.totalPagesOrdonnances = response.totalPages;
        this.currentPageOrdonnances = page;
        this.loadDoctorSpecialties(response.content);
        this.loadingOrdonnances = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ordonnances:', error);
        this.ordonnancesError = 'Impossible de charger les ordonnances';
        this.loadingOrdonnances = false;
        this.ordonnancesData = [];
      }
    });
  }

  /**
   * Change de page dans la pagination des ordonnances
   */
  changePageOrdonnances(page: number): void {
    if (!this.selectedPatient) return;
    if (page < 0 || page >= this.totalPagesOrdonnances) return;

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');
    this.loadOrdonnances(telephone, page);
  }

  /**
   * Recharge les ordonnances (première page)
   */
  reloadOrdonnances(): void {
    if (!this.selectedPatient) return;
    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');
    this.loadOrdonnances(telephone, 0);
  }

  /**
   * Obtient le libellé du statut d'une ordonnance
   */
  getOrdonnanceStatusLabel(status: string): string {
    return this.ordonnanceService.getStatusLabel(status);
  }

  /**
   * Obtient la classe CSS pour le statut d'une ordonnance
   */
  getOrdonnanceStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'PENDING': 'bg-amber-100 text-amber-700',
      'ACCEPTED': 'bg-emerald-100 text-emerald-700',
      'REJECTED': 'bg-rose-100 text-rose-700',
      'IN_PREPARATION': 'bg-blue-100 text-blue-700',
      'READY': 'bg-indigo-100 text-indigo-700',
      'DELIVERED': 'bg-teal-100 text-teal-700'
    };
    return classMap[status] || 'bg-gray-100 text-gray-700';
  }

  getDoctorSpecialty(doctorId: number): string {
    return this.doctorSpecialties[doctorId] || 'Spécialité non renseignée';
  }

  private loadDoctorSpecialties(ordonnances: OrdonnanceData[]): void {
    const uniqueDoctorIds = Array.from(new Set(ordonnances.map(o => o.doctor?.id).filter((id): id is number => !!id)));

    uniqueDoctorIds.forEach((doctorId) => {
      if (this.doctorSpecialties[doctorId]) {
        return;
      }

      this.authService.getCurrentUserById(doctorId).subscribe({
        next: (doctor) => {
          const specialty = (doctor as any)?.medicalSpecialty?.name;
          this.doctorSpecialties[doctorId] = specialty || 'Spécialité non renseignée';
        },
        error: () => {
          this.doctorSpecialties[doctorId] = 'Spécialité non renseignée';
        }
      });
    });
  }

  /**
   * Formate une date ISO en format français lisible
   */
  formatDateOrdonnance(isoDate: string): string {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formate la date d'expiration d'une ordonnance
   */
  formatExpiryDate(isoDate: string): string {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    // Ajouter 3 mois à la date de création pour l'expiration
    date.setMonth(date.getMonth() + 3);

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Télécharge ou visualise le fichier d'ordonnance
   */
  viewPrescriptionFile(ordonnance: OrdonnanceData): void {
    if (!ordonnance.prescriptionFile) {
      alert('Aucun fichier d\'ordonnance disponible');
      return;
    }

    // Construire l'URL du fichier
    const fileUrl = `https://wakana.online/pharma-delivery/api/files/${ordonnance.prescriptionFile}`;

    // Ouvrir dans un nouvel onglet
    window.open(fileUrl, '_blank');
  }

  /**
   * Obtient le nombre total de médicaments d'une ordonnance
   */
  getMedicationsCount(ordonnance: OrdonnanceData): number {
    return ordonnance.medications?.length || 0;
  }

  // ========== CONSULTATIONS ==========

  /**
   * Charge les consultations avec filtrage par téléphone du patient
   */
  loadConsultations(telephone: string, page: number = 0, size: number = 10): void {
    if (!telephone) {
      console.warn('⚠️ Téléphone non fourni pour charger les consultations');
      return;
    }

    this.loadingConsultations = true;
    this.consultationsError = '';

    // Nettoyer le téléphone (supprimer espaces)
    const cleanPhone = telephone.replace(/\s/g, '');

    console.log('📥 Chargement des consultations pour le téléphone:', cleanPhone);

    this.consultationService.getAllConsultations(cleanPhone, undefined, page, size).subscribe({
      next: (response: ConsultationPageResponse) => {
        console.log('✅ Consultations chargées:', response);
        this.consultations = response.content;
        this.loadingConsultations = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des consultations:', error);
        this.consultationsError = 'Impossible de charger les consultations';
        this.loadingConsultations = false;
        this.consultations = [];
      }
    });
  }

  /**
   * Recharge les consultations (première page)
   */
  reloadConsultations(): void {
    if (!this.selectedPatient) return;
    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');
    this.loadConsultations(telephone, 0);
  }

  // ========== CERTIFICATS MÉDICAUX ==========

  /**
   * Charge les certificats médicaux du patient
   */
  loadCertificates(page: number = 0, size: number = 10): void {
    if (!this.selectedPatient) {
      console.warn('⚠️ Aucun patient sélectionné');
      return;
    }

    this.loadingCertificats = true;
    this.certificatsError = '';

    const telephone = this.selectedPatient.telephone.replace(/\s/g, '');
    console.log('📥 Chargement des certificats médicaux pour téléphone:', telephone);

    this.certificateService.getCertificatesByPatient(telephone, page, size).subscribe({
      next: (response: CertificatePageResponse) => {
        console.log('✅ Certificats chargés:', response);
        this.certificats = response.content;
        this.loadingCertificats = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des certificats:', error);
        this.certificatsError = 'Impossible de charger les certificats';
        this.loadingCertificats = false;
        this.certificats = [];
      }
    });
  }

  /**
   * Recharge les certificats (première page)
   */
  reloadCertificates(): void {
    this.loadCertificates(0);
  }

  /**
   * Télécharge et ouvre le PDF d'un certificat
   */
  downloadCertificatePdf(certificatId: number): void {
    console.log('📥 Téléchargement du PDF du certificat:', certificatId);

    this.certificateService.downloadCertificatePdf(certificatId).subscribe({
      next: (blob: Blob) => {
        console.log('✅ PDF téléchargé');
        // Créer une URL pour le blob
        const url = window.URL.createObjectURL(blob);
        // Ouvrir dans un nouvel onglet
        window.open(url, '_blank');
        // Libérer l'URL après un délai
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      },
      error: (error) => {
        console.error('❌ Erreur lors du téléchargement du PDF:', error);
        alert('Impossible de télécharger le certificat');
      }
    });
  }
}
