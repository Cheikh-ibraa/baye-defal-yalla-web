import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { LaboratoireService } from '../../../services/laboratoire/laboratoire.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-analyses-medical',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analyses-medical.component.html',
  styleUrl: './analyses-medical.component.css'
})
export class AnalysesMedicalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  private location = inject(Location);
  private router = inject(Router);
  private laboratoireService = inject(LaboratoireService);
  private authService = inject(AuthService);

  // Sections collapse state
  patientInfoExpanded = true;
  examensExpanded = true;
  laboratoireExpanded = true;
  indicationExpanded = true;
  parametresExpanded = true;

  // Patient info (readonly)
  patientInfo: {
    id: number;  // ID numérique pour l'API
    reference: string;  // Référence string pour l'affichage
    nom: string;
    prenom: string;
    telephone: string;
  } = {
      id: 0,
      reference: '',
      nom: '',
      prenom: '',
      telephone: ''
    };

  // Doctor ID (récupéré depuis auth)
  doctorId: number = 0;

  // Form data
  formData: {
    typeId: number | null;
    laboratoryId: number | null;
    laboratoryName: string;
    clinicalIndication: string;
    youngPatient: boolean;
    urgencyLevel: 'NORMAL' | 'PRIORITAIRE' | 'URGENT';
    needsHelp: boolean;
  } = {
      typeId: null,
      laboratoryId: null,
      laboratoryName: '',
      clinicalIndication: '',
      youngPatient: false,
      urgencyLevel: 'NORMAL',
      needsHelp: false
    };

  // Types d'examens (chargés depuis API)
  typesExamens: any[] = [];
  loadingTypes = false;

  // Laboratoires autocomplete
  laboratorySearchTerm = '';
  laboratoryResults: any[] = [];
  showLaboratoryDropdown = false;
  loadingLaboratories = false;
  private searchSubject = new Subject<string>();

  // Modal création type d'analyse
  showTypeModal = false;
  newTypeName = '';

  // Indications cliniques prédéfinies
  indicationsPredefinies = [
    'Suspicion diabète',
    'Suivi traitement HTA',
    'Bilan préopératoire'
  ];

  ngOnInit() {
    this.loadPatientInfo();
    this.loadDoctorId();
    this.loadAnalysisTypes();
    this.setupLaboratorySearch();
  }

  loadPatientInfo() {
    // Récupérer les infos patient depuis localStorage
    const selectedPatient = localStorage.getItem('selectedPatient');
    if (selectedPatient) {
      const patient = JSON.parse(selectedPatient);

      // Récupérer l'ID numérique du patient
      const patientIdStr = localStorage.getItem('selectedPatientId');
      let numericId = 0;

      if (patientIdStr) {
        // ID trouvé dans localStorage
        numericId = parseInt(patientIdStr, 10);
      } else if (patient.id && typeof patient.id === 'string' && patient.id.startsWith('ID-')) {
        // Extraire l'ID depuis le format "ID-XXX"
        const idMatch = patient.id.match(/ID-(\d+)/);
        if (idMatch && idMatch[1]) {
          numericId = parseInt(idMatch[1], 10);
          console.warn('⚠️ selectedPatientId non trouvé, extraction depuis patient.id:', patient.id, '→', numericId);
        }
      }

      // Déterminer la référence à afficher
      let displayReference = '';
      if (patient.id && typeof patient.id === 'string' && !patient.id.startsWith('ID-')) {
        // patient.id contient déjà la référence (ex: "NDIAYE-00000025")
        displayReference = patient.id;
      } else if (patient.reference) {
        // Utiliser patient.reference si disponible
        displayReference = patient.reference;
      } else {
        // Fallback sur patient.id
        displayReference = patient.id || '';
      }

      this.patientInfo = {
        id: numericId,  // ID numérique pour l'API
        reference: displayReference,  // Référence string pour l'affichage
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        telephone: patient.telephone || ''
      };

      console.log('✅ Données patient chargées:', {
        reference: this.patientInfo.reference,
        patientId: this.patientInfo.id,
        nom: `${this.patientInfo.nom} ${this.patientInfo.prenom}`
      });

      if (!numericId || numericId === 0) {
        console.error('❌ ERREUR: Impossible de récupérer l\'ID numérique du patient');
      }
    }
  }

  loadDoctorId() {
    // Récupérer le doctorId via AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.doctorId = currentUser.id;
      console.log('✅ Médecin connecté:', {
        id: this.doctorId,
        nom: `${currentUser.prenom} ${currentUser.nom}`
      });
    } else {
      console.error('❌ Impossible de récupérer l\'utilisateur connecté');
    }
  }

  loadAnalysisTypes() {
    this.loadingTypes = true;
    this.laboratoireService.getAnalysisTypes().subscribe({
      next: (types) => {
        this.typesExamens = types;
        this.loadingTypes = false;
      },
      error: (err) => {
        console.error('Erreur chargement types d\'analyses:', err);
        this.loadingTypes = false;
      }
    });
  }

  setupLaboratorySearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(keyword => {
        if (keyword.length < 2) {
          this.laboratoryResults = [];
          return [];
        }
        this.loadingLaboratories = true;
        return this.laboratoireService.searchLaboratories(keyword);
      })
    ).subscribe({
      next: (results) => {
        this.laboratoryResults = results;
        this.showLaboratoryDropdown = true;
        this.loadingLaboratories = false;
      },
      error: (err) => {
        console.error('Erreur recherche laboratoires:', err);
        this.loadingLaboratories = false;
      }
    });
  }

  onLaboratorySearch(event: any) {
    const keyword = event.target.value;
    this.laboratorySearchTerm = keyword;
    this.searchSubject.next(keyword);
  }

  selectLaboratory(lab: any) {
    this.formData.laboratoryId = lab.id;
    const fullName = `${lab.nom || ''} ${lab.prenom || ''}`.trim();
    this.formData.laboratoryName = fullName || lab.name || 'Laboratoire';
    this.laboratorySearchTerm = fullName || lab.name || 'Laboratoire';
    this.showLaboratoryDropdown = false;
  }

  closeLaboratoryDropdown() {
    setTimeout(() => {
      this.showLaboratoryDropdown = false;
    }, 200);
  }

  addAnalysisType() {
    // Ouvrir le modal de création
    this.newTypeName = '';
    this.showTypeModal = true;
  }

  submitNewType() {
    // Validation du nom
    if (!this.newTypeName || !this.newTypeName.trim()) {
      Swal.fire({
        title: 'Champ requis',
        text: 'Veuillez entrer le nom du type d\'analyse',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }

    // Créer le type via l'API
    this.laboratoireService.createAnalysisType(this.newTypeName.trim()).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Succès!',
          text: 'Type d\'analyse créé avec succès',
          icon: 'success',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        });
        this.closeTypeModal();
        this.loadAnalysisTypes(); // Recharger la liste
      },
      error: (err) => {
        console.error('❌ Erreur création type d\'analyse:', err);
        Swal.fire({
          title: 'Erreur!',
          text: 'Erreur lors de la création du type d\'analyse',
          icon: 'error',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        });
      }
    });
  }

  closeTypeModal() {
    this.showTypeModal = false;
    this.newTypeName = '';
  }

  toggleSection(section: string) {
    switch (section) {
      case 'patient':
        this.patientInfoExpanded = !this.patientInfoExpanded;
        break;
      case 'examens':
        this.examensExpanded = !this.examensExpanded;
        break;
      case 'laboratoire':
        this.laboratoireExpanded = !this.laboratoireExpanded;
        break;
      case 'indication':
        this.indicationExpanded = !this.indicationExpanded;
        break;
      case 'parametres':
        this.parametresExpanded = !this.parametresExpanded;
        break;
    }
  }

  addIndicationTag(indication: string) {
    if (this.formData.clinicalIndication) {
      this.formData.clinicalIndication += ', ' + indication;
    } else {
      this.formData.clinicalIndication = indication;
    }
  }

  onSubmit() {
    // Validation des données patient et docteur
    if (!this.patientInfo.id || this.patientInfo.id === 0) {
      Swal.fire({
        title: 'Patient non sélectionné',
        text: 'Aucun patient sélectionné. Veuillez retourner à la liste des patients.',
        icon: 'error',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }

    if (!this.doctorId || this.doctorId === 0) {
      Swal.fire({
        title: 'Erreur médecin',
        text: 'Impossible de récupérer l\'identifiant du médecin. Veuillez vous reconnecter.',
        icon: 'error',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }

    // Validation du formulaire
    if (!this.formData.typeId) {
      Swal.fire({
        title: 'Champ manquant',
        text: 'Veuillez sélectionner un type d\'analyse',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }
    if (!this.formData.laboratoryId) {
      Swal.fire({
        title: 'Champ manquant',
        text: 'Veuillez sélectionner un laboratoire',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }
    if (!this.formData.clinicalIndication) {
      Swal.fire({
        title: 'Champ manquant',
        text: 'Veuillez renseigner l\'indication clinique',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }

    // Préparer le payload selon le format API
    const payload = {
      patientId: this.patientInfo.id,
      doctorId: this.doctorId,
      laboratoryId: this.formData.laboratoryId,
      typeId: this.formData.typeId,
      clinicalIndication: this.formData.clinicalIndication,
      youngPatient: this.formData.youngPatient,
      urgencyLevel: this.formData.urgencyLevel,
      needsHelp: this.formData.needsHelp
    };

    console.log('📤 Envoi demande d\'analyses:', payload);
    console.log('📋 Patient Info:', this.patientInfo);
    console.log('👨‍⚕️ Doctor ID:', this.doctorId);
    console.log('📝 Form Data:', this.formData);

    this.laboratoireService.createLaboratoire(payload).subscribe({
      next: (response) => {
        console.log('✅ Demande créée avec succès:', response);
        Swal.fire({
          title: 'Succès!',
          text: 'La demande d\'analyses a été créée avec succès',
          icon: 'success',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        }).then(() => {
          this.router.navigate(['/patients']);
        });
      },
      error: (err) => {
        console.error('❌ Erreur création demande:', err);
        console.error('❌ Payload envoyé:', payload);
        Swal.fire({
          title: 'Erreur!',
          text: 'Erreur lors de la création de la demande. Veuillez réessayer.',
          icon: 'error',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        });
      }
    });
  }

  onCancel() {
    console.log('Demande annulée');
    this.router.navigate(['/patients']);
  }

  goBack() {
    this.router.navigate(['/patients']);
  }
}