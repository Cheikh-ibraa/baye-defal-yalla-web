import { AuthService } from './../../../services/auth.service';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import {
  HospitalisationService,
  Facility,
  Department,
  CreateHospitalizationRequest
} from '../../../services/hospitalisation.service';

@Component({
  selector: 'app-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalisation.component.html',
  styleUrl: './hospitalisation.component.css'
})
export class HospitalisationComponent implements OnInit {
  private router = inject(Router);
  private hospitalisationService = inject(HospitalisationService);
  private authService = inject(AuthService);

  // Sections collapse state
  patientInfoExpanded = true;
  generalInfoExpanded = true;
  datesExpanded = true;
  responsableExpanded = true;
  complementaryExpanded = true;

  // Données des listes
  etablissements: Facility[] = [];
  departements: Department[] = [];
  departementsFiltered: Department[] = [];

  // Patient sélectionné
  selectedPatient: any = null;
  currentUser: any = null;

  // État de chargement du patient
  isLoadingPatient = false;
  patientLoadError: string | null = null;

  // Form data
  formData = {
    patientId: 0,
    facilityId: 0,
    departmentId: 0,
    responsibleMedicalId: 0,
    hospitalizationReason: '',
    initialDiagnosis: '',
    observation: '',
    entryDate: '',
    entryTime: '',
    exitDate: '',
    exitTime: '',
    room: '',
    bedNumber: '',
    priority: 'NORMAL'
  };

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.formData.responsibleMedicalId = this.currentUser.id;
      console.log('Médecin responsable (token):', this.currentUser);

      // Charger le profil complet du médecin pour obtenir nom et prenom
      this.authService.getCurrentUserById(this.currentUser.id).subscribe({
        next: (fullUser) => {
          this.currentUser = { ...this.currentUser, ...fullUser };
          console.log('✅ Profil médecin complet chargé:', this.currentUser);
        },
        error: (error) => {
          console.error('Erreur lors du chargement du profil médecin:', error);
        }
      });
    }

    // S'abonner aux mises à jour du currentUser
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user && user.nom) {
          this.currentUser = user;
          console.log('✅ currentUser mis à jour via subscription:', this.currentUser);
        }
      }
    });

    // Récupérer le patient sélectionné depuis localStorage
    const storedPatient = localStorage.getItem('selectedPatient');
    if (storedPatient) {
      this.selectedPatient = JSON.parse(storedPatient);
      console.log('Patient sélectionné depuis localStorage:', this.selectedPatient);

      // Récupérer l'ID réel du patient via l'API
      this.loadPatientIdFromApi();
    }

    // Charger les établissements
    this.loadEtablissements();
  }

  loadEtablissements(): void {
    this.hospitalisationService.getEtablissements().subscribe({
      next: (data) => {
        this.etablissements = data;
        console.log('Établissements chargés:', this.etablissements);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des établissements:', error);
        if (error.status === 403) {
          alert('Accès refusé. Veuillez vous reconnecter.');
        } else {
          alert('Erreur lors du chargement des établissements');
        }
      }
    });
  }

  /**
   * Récupère l'ID réel du patient via l'API
   * Utilise le téléphone ou la référence pour obtenir l'ID numérique
   */
  private loadPatientIdFromApi(): void {
    if (!this.selectedPatient) {
      this.patientLoadError = 'Aucun patient sélectionné';
      return;
    }

    this.isLoadingPatient = true;
    this.patientLoadError = null;

    // Priorité 1: Si on a déjà un ID numérique valide (non PT-)
    if (this.selectedPatient.id && typeof this.selectedPatient.id === 'number' && this.selectedPatient.id > 0) {
      this.formData.patientId = this.selectedPatient.id;
      this.isLoadingPatient = false;
      console.log('✅ ID patient déjà numérique:', this.formData.patientId);
      return;
    }

    // Priorité 2: Recherche par téléphone
    const telephone = this.selectedPatient.telephone || this.selectedPatient.phone;
    if (telephone) {
      this.fetchPatientByPhone(telephone);
      return;
    }

    // Priorité 3: Recherche par référence
    const reference = this.selectedPatient.reference || this.selectedPatient.id;
    if (reference) {
      this.fetchPatientByReference(reference.toString());
      return;
    }

    // Aucune donnée pour rechercher
    this.isLoadingPatient = false;
    this.patientLoadError = 'Impossible de récupérer les informations du patient';
    console.error('❌ Aucune donnée disponible pour rechercher le patient');
  }

  /**
   * Recherche le patient par numéro de téléphone
   */
  private fetchPatientByPhone(phone: string): void {
    console.log('🔍 Recherche patient par téléphone:', phone);

    this.authService.getUserByPhone(phone).subscribe({
      next: (user) => {
        this.handlePatientFound(user);
      },
      error: (error) => {
        console.warn('⚠️ Patient non trouvé par téléphone, essai par référence...');
        // Fallback: essayer par référence si disponible
        const reference = this.selectedPatient.reference || this.selectedPatient.id;
        if (reference) {
          this.fetchPatientByReference(reference.toString());
        } else {
          this.handlePatientNotFound(error);
        }
      }
    });
  }

  /**
   * Recherche le patient par référence
   */
  private fetchPatientByReference(reference: string): void {
    console.log('🔍 Recherche patient par référence:', reference);

    this.authService.getUserByReference(reference).subscribe({
      next: (user) => {
        this.handlePatientFound(user);
      },
      error: (error) => {
        this.handlePatientNotFound(error);
      }
    });
  }

  /**
   * Gère le cas où le patient est trouvé via l'API
   */
  private handlePatientFound(user: any): void {
    this.isLoadingPatient = false;
    this.patientLoadError = null;

    if (user && user.id) {
      // Mettre à jour l'ID du patient
      this.formData.patientId = user.id;

      // Enrichir les données du patient sélectionné
      this.selectedPatient = {
        ...this.selectedPatient,
        id: user.id,
        nom: user.nom || this.selectedPatient.nom,
        prenom: user.prenom || this.selectedPatient.prenom,
        telephone: user.telephone || this.selectedPatient.telephone,
        adress: user.adress || this.selectedPatient.adress,
        reference: user.reference || this.selectedPatient.reference
      };

      console.log('✅ Patient trouvé via API:', {
        id: this.formData.patientId,
        nom: this.selectedPatient.nom,
        prenom: this.selectedPatient.prenom
      });
    } else {
      this.patientLoadError = 'Données patient invalides';
      console.error('❌ Réponse API invalide:', user);
    }
  }

  /**
   * Gère le cas où le patient n'est pas trouvé
   */
  private handlePatientNotFound(error: any): void {
    this.isLoadingPatient = false;
    this.patientLoadError = 'Patient non trouvé dans le système';
    console.error('❌ Patient non trouvé:', error);
  }

  onEtablissementChange(): void {
    if (this.formData.facilityId) {
      // Réinitialiser le département sélectionné
      this.formData.departmentId = 0;
      this.departementsFiltered = [];

      // Charger les départements de l'établissement sélectionné
      this.hospitalisationService.getDepartements(this.formData.facilityId).subscribe({
        next: (data) => {
          this.departementsFiltered = data;
          console.log('Départements chargés:', this.departementsFiltered);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des départements:', error);
          if (error.status === 403) {
            alert('Accès refusé. Veuillez vous reconnecter.');
          } else {
            alert('Erreur lors du chargement des départements');
          }
        }
      });
    } else {
      this.departementsFiltered = [];
    }
  }

  /**
   * Formate une date et heure au format attendu par le backend: DD-MM-YYYY HH:mm
   */
  private formatDateTimeToBackend(date: string, time: string): string {
    if (!date || !time) return '';

    // date est au format YYYY-MM-DD (input HTML)
    // time est au format HH:mm (input HTML)
    const [year, month, day] = date.split('-');

    // Retourner au format DD-MM-YYYY HH:mm
    return `${day}-${month}-${year} ${time}`;
  }

  /**
   * Formate une date du format YYYY-MM-DD vers DD-MM-YYYY
   */
  private formatDateToBackend(dateString: string): string {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }

  toggleSection(section: string) {
    switch (section) {
      case 'patient':
        this.patientInfoExpanded = !this.patientInfoExpanded;
        break;
      case 'general':
        this.generalInfoExpanded = !this.generalInfoExpanded;
        break;
      case 'dates':
        this.datesExpanded = !this.datesExpanded;
        break;
      case 'responsable':
        this.responsableExpanded = !this.responsableExpanded;
        break;
      case 'complementary':
        this.complementaryExpanded = !this.complementaryExpanded;
        break;
    }
  }

  onSubmit() {
    // Vérifier si le chargement du patient est en cours
    if (this.isLoadingPatient) {
      Swal.fire({
        title: 'Chargement en cours',
        text: 'Veuillez patienter, les informations du patient sont en cours de chargement...',
        icon: 'info',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    // Validation du patient
    if (!this.formData.patientId || this.formData.patientId === 0) {
      const errorText = this.patientLoadError
        ? `${this.patientLoadError}. Veuillez retourner à la liste des patients et réessayer.`
        : 'Impossible de récupérer l\'ID du patient. Veuillez sélectionner un patient et réessayer.';

      Swal.fire({
        title: 'Patient manquant',
        text: errorText,
        icon: 'error',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    // Validation du médecin responsable
    if (!this.formData.responsibleMedicalId || this.formData.responsibleMedicalId === 0) {
      Swal.fire({
        title: 'Médecin responsable manquant',
        text: 'Veuillez vous reconnecter pour continuer.',
        icon: 'error',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    // Validation établissement et service
    if (!this.formData.facilityId || !this.formData.departmentId) {
      Swal.fire({
        title: 'Informations incomplètes',
        text: 'Veuillez sélectionner un établissement et un service',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    // Validation motif et diagnostic
    if (!this.formData.hospitalizationReason || !this.formData.initialDiagnosis) {
      Swal.fire({
        title: 'Informations incomplètes',
        text: 'Veuillez remplir le motif d\'hospitalisation et le diagnostic initial',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    // Validation dates
    if (!this.formData.entryDate || !this.formData.entryTime) {
      Swal.fire({
        title: 'Date d\'entrée manquante',
        text: 'Veuillez renseigner la date et l\'heure d\'entrée',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    // Validation chambre
    if (!this.formData.room) {
      Swal.fire({
        title: 'Chambre manquante',
        text: 'Veuillez renseigner le numéro de chambre',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        width: '400px'
      });
      return;
    }

    // Préparer les données pour l'API
    const requestData: CreateHospitalizationRequest = {
      patientId: this.formData.patientId,
      facilityId: this.formData.facilityId,
      departmentId: this.formData.departmentId,
      responsibleMedicalId: this.formData.responsibleMedicalId,
      hospitalizationReason: this.formData.hospitalizationReason,
      initialDiagnosis: this.formData.initialDiagnosis,
      observation: this.formData.observation,
      entryDateTime: this.formatDateTimeToBackend(this.formData.entryDate, this.formData.entryTime),
      exitDateTime: this.formData.exitDate && this.formData.exitTime
        ? this.formatDateTimeToBackend(this.formData.exitDate, this.formData.exitTime)
        : '',
      room: this.formData.room,
      bedNumber: this.formData.bedNumber,
      priority: this.formData.priority
    };

    console.log('📤 Données envoyées à l\'API:', requestData);

    // Appel API
    this.hospitalisationService.createHospitalisation(requestData).subscribe({
      next: (response) => {
        console.log('✅ Hospitalisation créée:', response);
        Swal.fire({
          title: 'Succès!',
          text: 'Hospitalisation enregistrée avec succès',
          icon: 'success',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        }).then(() => {
          this.router.navigate(['/patients']);
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création:', error);
        const errorMessage = error.error?.message || error.message || 'Une erreur est survenue lors de l\'enregistrement';
        Swal.fire({
          title: 'Erreur!',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        });
      }
    });
  }

  getPatientFullName(): string {
    if (!this.selectedPatient) {
      return 'Aucun patient sélectionné';
    }

    const firstName = this.selectedPatient.prenom || this.selectedPatient.firstName || '';
    const lastName = this.selectedPatient.nom || this.selectedPatient.lastName || this.selectedPatient.name || '';

    if (!firstName && !lastName) {
      return 'Nom non disponible';
    }

    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Retourne le nom complet du médecin référent formaté
   * Format: "Dr. Prénom Nom"
   */
  getDoctorFullName(): string {
    if (!this.currentUser) {
      return 'Non défini';
    }

    const firstName = this.currentUser.prenom || this.currentUser.firstName || '';
    const lastName = this.currentUser.nom || this.currentUser.lastName || this.currentUser.name || '';

    if (!firstName && !lastName) {
      return 'Dr. Non défini';
    }

    return `Dr. ${firstName} ${lastName}`.trim();
  }

  onCancel() {
    this.router.navigate(['/patients']);
  }

  goBack() {
    this.router.navigate(['/patients']);
  }
}