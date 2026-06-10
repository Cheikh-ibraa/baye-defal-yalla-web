import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface Authority {
  authority: string;
}

interface User {
  id: number;
  reference: string | null;
  lat: number;
  lon: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  adress: string;
  technicalSheet: string | null;
  profil: string;
  activated: boolean;
  notifiable: boolean;
  online: boolean;
  telephone: string;
  funds: number;
  photo: string | null;
  validated: boolean;
  accountNonExpired: boolean;
  credentialsNonExpired: boolean;
  authorities: Authority[];
  username: string;
  accountNonLocked: boolean;
  averageRating: number;
  enabled: boolean;
}

interface FacilityType {
  id: number;
  name: string;
}

interface Facility {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  type: FacilityType;
}

interface Department {
  id: number;
  name: string;
  description: string;
  facility: Facility;
}

interface Hospitalization {
  id: number;
  patient: User;
  facility: Facility;
  department: Department;
  responsibleMedical: User;
  hospitalizationReason: string;
  initialDiagnosis: string;
  observation: string;
  entryDateTime: string;
  exitDateTime: string | null;
  room: string;
  bedNumber: string;
  priority: 'NORMAL' | 'URGENCE';
}

interface CreateHospitalizationRequest {
  patientId: number;
  facilityId: number;
  departmentId: number;
  responsibleMedicalId: number;
  hospitalizationReason: string;
  initialDiagnosis: string;
  observation: string;
  entryDateTime: string;
  exitDateTime: string;
  room: string;
  bedNumber: string;
  priority: string;
}

@Component({
  selector: 'app-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalisation.component.html',
  styleUrl: './hospitalisation.component.css'
})
export class HospitalisationComponent implements OnInit {
  private router = inject(Router);

  // Local auth mock
  private mockCurrentUser: any = { id: 999, nom: 'Dr Mock', prenom: 'User', telephone: '+221700000000' };

  private localGetCurrentUserById(id: number) {
    return of({ ...this.mockCurrentUser, id }).pipe(delay(120));
  }

  private localGetUserByPhone(phone: string) {
    return of({ ...this.mockCurrentUser, telephone: phone, id: Math.floor(Math.random() * 1000) }).pipe(delay(150));
  }

  private localGetUserByReference(reference: string) {
    return of({ ...this.mockCurrentUser, reference, id: Math.floor(Math.random() * 1000) }).pipe(delay(150));
  }

  // Local mocks (sandbox)
  private mockEtablissements: Facility[] = [
    { id: 1, name: 'Hôpital Central', address: 'Rue Principale', phone: '000000000', email: 'contact@hopital.example', type: { id: 1, name: 'Hôpital' } }
  ];

  private mockDepartements: Department[] = [
    { id: 10, name: 'Urgences', description: 'Service des urgences', facility: this.mockEtablissements[0] }
  ];

  private localGetEtablissements() {
    return of(this.mockEtablissements).pipe(delay(120));
  }

  private localGetDepartements(facilityId: number) {
    const deps = this.mockDepartements.filter(d => d.facility && d.facility.id === facilityId);
    return of(deps.length ? deps : this.mockDepartements).pipe(delay(120));
  }

  private localCreateHospitalisation(request: CreateHospitalizationRequest) {
    const created: Hospitalization = {
      id: Math.floor(Math.random() * 100000),
      patient: {
        id: request.patientId,
        reference: null,
        lat: 0,
        lon: 0,
        nom: this.selectedPatient?.nom || 'Nom',
        prenom: this.selectedPatient?.prenom || 'Prenom',
        email: '',
        password: '',
        adress: '',
        technicalSheet: null,
        profil: 'PATIENT',
        activated: true,
        notifiable: false,
        online: false,
        telephone: this.selectedPatient?.telephone || '',
        funds: 0,
        photo: null,
        validated: true,
        accountNonExpired: true,
        credentialsNonExpired: true,
        authorities: [],
        username: `${this.selectedPatient?.nom || 'user'}`,
        accountNonLocked: true,
        averageRating: 0,
        enabled: true
      },
      facility: this.mockEtablissements.find(e => e.id === request.facilityId) || this.mockEtablissements[0],
      department: this.mockDepartements.find(d => d.id === request.departmentId) || this.mockDepartements[0],
      responsibleMedical: this.currentUser || {
        id: request.responsibleMedicalId,
        reference: null,
        lat: 0,
        lon: 0,
        nom: 'Dr',
        prenom: 'Responsable',
        email: '',
        password: '',
        adress: '',
        technicalSheet: null,
        profil: 'DOCTOR',
        activated: true,
        notifiable: false,
        online: false,
        telephone: '',
        funds: 0,
        photo: null,
        validated: true,
        accountNonExpired: true,
        credentialsNonExpired: true,
        authorities: [],
        username: 'dr',
        accountNonLocked: true,
        averageRating: 0,
        enabled: true
      },
      hospitalizationReason: request.hospitalizationReason,
      initialDiagnosis: request.initialDiagnosis,
      observation: request.observation,
      entryDateTime: request.entryDateTime,
      exitDateTime: request.exitDateTime || null,
      room: request.room,
      bedNumber: request.bedNumber,
      priority: (request.priority as any) || 'NORMAL'
    } as Hospitalization;
    return of(created).pipe(delay(200));
  }

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
    facilityName: '',
    departmentId: 0,
    departmentName: '',
    responsibleMedicalId: 0,
    doctorName: '',
    serviceContact: '',
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
    // Local current user
    this.currentUser = this.mockCurrentUser;
    if (this.currentUser) {
      this.formData.responsibleMedicalId = this.currentUser.id;
      this.formData.doctorName = this.getDoctorFullName();
    }

    // Récupérer le patient sélectionné depuis localStorage
    const storedPatient = localStorage.getItem('selectedPatient');
    if (storedPatient) {
      this.selectedPatient = JSON.parse(storedPatient);
      console.log('Patient sélectionné depuis localStorage:', this.selectedPatient);

      // Récupérer l'ID réel du patient via l'API
      this.loadPatientIdFromApi();
    }

    // Charger les établissements (mock)
    this.loadEtablissements();
  }

  loadEtablissements(): void {
    this.localGetEtablissements().subscribe({
      next: (data) => {
        this.etablissements = data;
        console.log('Établissements mock chargés:', this.etablissements);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des établissements (mock):', error);
        this.etablissements = [];
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

    this.localGetUserByPhone(phone).subscribe({
      next: (user) => {
        this.handlePatientFound(user);
      },
      error: (error) => {
        console.warn('⚠️ Patient non trouvé par téléphone (mock), essai par référence...');
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

    this.localGetUserByReference(reference).subscribe({
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
      // Charger les départements (mock)
      this.localGetDepartements(this.formData.facilityId).subscribe({
        next: (data) => {
          this.departementsFiltered = data;
          console.log('Départements mock chargés:', this.departementsFiltered);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des départements (mock):', error);
          this.departementsFiltered = [];
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
    if (!this.formData.facilityName.trim() || !this.formData.departmentName.trim()) {
      Swal.fire({
        title: 'Informations incomplètes',
        text: 'Veuillez renseigner l\'établissement de santé et le service',
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
      facilityId: this.formData.facilityId || 1,
      departmentId: this.formData.departmentId || 1,
      responsibleMedicalId: this.formData.responsibleMedicalId,
      hospitalizationReason: this.formData.hospitalizationReason,
      initialDiagnosis: this.formData.initialDiagnosis,
      observation: this.formData.observation,
      entryDateTime: this.formatDateTimeToBackend(this.formData.entryDate, this.formData.entryTime),
      exitDateTime: this.formData.exitDate
        ? this.formatDateTimeToBackend(this.formData.exitDate, this.formData.exitTime || '00:00')
        : '',
      room: this.formData.room,
      bedNumber: this.formData.bedNumber,
      priority: this.formData.priority
    };

    console.log('📤 Données envoyées à l\'API:', requestData);

    // Mock create
    this.localCreateHospitalisation(requestData).subscribe({
      next: (response) => {
        console.log('✅ Hospitalisation mock créée:', response);
        Swal.fire({
          title: 'Succès!',
          text: 'Hospitalisation enregistrée (mock)',
          icon: 'success',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        }).then(() => {
          this.router.navigate(['/patients']);
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création (mock):', error);
        Swal.fire({
          title: 'Erreur!',
          text: 'Une erreur est survenue lors de l\'enregistrement (mock)',
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