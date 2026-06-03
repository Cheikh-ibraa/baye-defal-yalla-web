import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { UrgencyLevel } from '../../../modele/imagerie.model';
import { Subject, of, debounceTime, distinctUntilChanged, switchMap, delay } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-imagerie-medical',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagerie-medical.component.html',
  styleUrl: './imagerie-medical.component.css'
})
export class ImagerieMedicalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  private location = inject(Location);
  private router = inject(Router);
  // Local auth mock
  private mockCurrentUser: any = { id: 999, prenom: 'Dr', nom: 'Mock' };

  // --- Local Imagerie mocks ---
  private mockImagingTypes: any[] = [
    { id: 1, name: 'Radiologie' },
    { id: 2, name: 'Échographie' }
  ];

  private mockImagingRegions: any[] = [
    { id: 1, name: 'Thorax' },
    { id: 2, name: 'Abdomen' }
  ];

  private mockCenters: any[] = [
    { id: 1, name: 'Centre Imagerie Dakar', address: 'Rue A' },
    { id: 2, name: 'Clinique N', address: 'Rue B' }
  ];

  private localGetImagingTypes() {
    return of(this.mockImagingTypes).pipe(delay(120));
  }

  private localGetImagingRegions() {
    return of(this.mockImagingRegions).pipe(delay(120));
  }

  private localSearchImagingCenters(keyword: string) {
    const res = this.mockCenters.filter(c => (c.name || '').toLowerCase().includes(keyword.toLowerCase()));
    return of(res).pipe(delay(150));
  }

  private localCreateImagingType(name: string) {
    const id = this.mockImagingTypes.length + 1;
    const created = { id, name };
    this.mockImagingTypes.push(created);
    return of(created).pipe(delay(150));
  }

  private localCreateImagingRegion(name: string) {
    const id = this.mockImagingRegions.length + 1;
    const created = { id, name };
    this.mockImagingRegions.push(created);
    return of(created).pipe(delay(150));
  }

  private localCreateImagerie(payload: any) {
    const created = { id: Math.floor(Math.random() * 10000), ...payload };
    return of(created).pipe(delay(200));
  }

  // Sections collapse state
  patientInfoExpanded = true;
  typeExamenExpanded = true;
  regionExpanded = true;
  centreExpanded = true;
  indicationExpanded = true;
  parametresExpanded = true;

  // Patient info (readonly)
  patientInfo: {
    id: number;
    reference: string;
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
    regionId: number | null;
    imagingCenterId: number | null;
    imagingCenterName: string;
    clinicalIndication: string;
    youngPatient: boolean;
    urgencyLevel: UrgencyLevel;
    needsHelp: boolean;
  } = {
      typeId: null,
      regionId: null,
      imagingCenterId: null,
      imagingCenterName: '',
      clinicalIndication: '',
      youngPatient: false,
      urgencyLevel: UrgencyLevel.NORMAL,
      needsHelp: false
    };

  // Types d'examens (chargés depuis API)
  typesExamens: any[] = [];
  loadingTypes = false;

  // Régions (chargées depuis API)
  regions: any[] = [];
  loadingRegions = false;

  // Centres d'imagerie autocomplete
  centerSearchTerm = '';
  centerResults: any[] = [];
  showCenterDropdown = false;
  loadingCenters = false;
  private searchSubject = new Subject<string>();

  // Modals
  showTypeModal = false;
  newTypeName = '';
  showRegionModal = false;
  newRegionName = '';

  // Indications cliniques prédéfinies
  indicationsPredefinies = [
    'Suspicion fracture',
    'Douleurs abdominales',
    'Surveillance post-traumatique',
    'Bilan préopératoire'
  ];

  ngOnInit() {
    this.loadPatientInfo();
    this.loadDoctorId();
    this.loadImagingTypes();
    this.loadImagingRegions();
    this.setupCenterSearch();
  }

  loadPatientInfo() {
    const selectedPatient = localStorage.getItem('selectedPatient');
    if (selectedPatient) {
      const patient = JSON.parse(selectedPatient);

      const patientIdStr = localStorage.getItem('selectedPatientId');
      let numericId = 0;

      if (patientIdStr) {
        numericId = parseInt(patientIdStr, 10);
      } else if (patient.id && typeof patient.id === 'string' && patient.id.startsWith('ID-')) {
        const idMatch = patient.id.match(/ID-(\d+)/);
        if (idMatch && idMatch[1]) {
          numericId = parseInt(idMatch[1], 10);
          console.warn('⚠️ selectedPatientId non trouvé, extraction depuis patient.id:', patient.id, '→', numericId);
        }
      }

      let displayReference = '';
      if (patient.id && typeof patient.id === 'string' && !patient.id.startsWith('ID-')) {
        displayReference = patient.id;
      } else if (patient.reference) {
        displayReference = patient.reference;
      } else {
        displayReference = patient.id || '';
      }

      this.patientInfo = {
        id: numericId,
        reference: displayReference,
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
    const currentUser = this.mockCurrentUser;
    if (currentUser) {
      this.doctorId = currentUser.id;
      console.log('✅ Médecin connecté (mock):', { id: this.doctorId, nom: `${currentUser.prenom} ${currentUser.nom}` });
    } else {
      console.error('❌ Impossible de récupérer l\'utilisateur connecté (mock)');
    }
  }

  loadImagingTypes() {
    this.loadingTypes = true;
    this.localGetImagingTypes().subscribe({
      next: (types) => {
        this.typesExamens = types;
        this.loadingTypes = false;
      },
      error: (err) => {
        console.error('Erreur chargement types d\'examens (mock):', err);
        this.loadingTypes = false;
      }
    });
  }

  loadImagingRegions() {
    this.loadingRegions = true;
    this.localGetImagingRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.loadingRegions = false;
      },
      error: (err) => {
        console.error('Erreur chargement régions (mock):', err);
        this.loadingRegions = false;
      }
    });
  }

  setupCenterSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(keyword => {
        if (keyword.length < 2) {
          this.centerResults = [];
          return of([]);
        }
        this.loadingCenters = true;
        return this.localSearchImagingCenters(keyword);
      })
    ).subscribe({
      next: (results) => {
        this.centerResults = results;
        this.showCenterDropdown = true;
        this.loadingCenters = false;
      },
      error: (err) => {
        console.error('Erreur recherche centres d\'imagerie:', err);
        this.loadingCenters = false;
      }
    });
  }

  onCenterSearch(event: any) {
    const keyword = event.target.value;
    this.centerSearchTerm = keyword;
    this.searchSubject.next(keyword);
  }

  selectCenter(center: any) {
    this.formData.imagingCenterId = center.id;
    const fullName = `${center.nom || ''} ${center.prenom || ''}`.trim();
    this.formData.imagingCenterName = fullName || center.name || 'Centre d\'imagerie';
    this.centerSearchTerm = fullName || center.name || 'Centre d\'imagerie';
    this.showCenterDropdown = false;
  }

  closeCenterDropdown() {
    setTimeout(() => {
      this.showCenterDropdown = false;
    }, 200);
  }

  // Modal Type
  addImagingType() {
    this.newTypeName = '';
    this.showTypeModal = true;
  }

  submitNewType() {
    if (!this.newTypeName || !this.newTypeName.trim()) {
      Swal.fire({
        title: 'Champ requis',
        text: 'Veuillez entrer le nom du type d\'examen',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }

    this.localCreateImagingType(this.newTypeName.trim()).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Succès!',
          text: 'Type d\'examen créé avec succès',
          icon: 'success',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        });
        this.closeTypeModal();
        this.loadImagingTypes();
      },
      error: (err) => {
        console.error('❌ Erreur création type d\'examen:', err);
        Swal.fire({
          title: 'Erreur!',
          text: 'Erreur lors de la création du type d\'examen',
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

  // Modal Région
  addImagingRegion() {
    this.newRegionName = '';
    this.showRegionModal = true;
  }

  submitNewRegion() {
    if (!this.newRegionName || !this.newRegionName.trim()) {
      Swal.fire({
        title: 'Champ requis',
        text: 'Veuillez entrer le nom de la région',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }

    this.localCreateImagingRegion(this.newRegionName.trim()).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Succès!',
          text: 'Région créée avec succès',
          icon: 'success',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        });
        this.closeRegionModal();
        this.loadImagingRegions();
      },
      error: (err) => {
        console.error('❌ Erreur création région:', err);
        Swal.fire({
          title: 'Erreur!',
          text: 'Erreur lors de la création de la région',
          icon: 'error',
          confirmButtonColor: '#01b894',
          confirmButtonText: 'OK',
          width: '400px'
        });
      }
    });
  }

  closeRegionModal() {
    this.showRegionModal = false;
    this.newRegionName = '';
  }

  toggleSection(section: string) {
    switch (section) {
      case 'patient':
        this.patientInfoExpanded = !this.patientInfoExpanded;
        break;
      case 'typeExamen':
        this.typeExamenExpanded = !this.typeExamenExpanded;
        break;
      case 'region':
        this.regionExpanded = !this.regionExpanded;
        break;
      case 'centre':
        this.centreExpanded = !this.centreExpanded;
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
        text: 'Veuillez sélectionner un type d\'examen',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }
    if (!this.formData.regionId) {
      Swal.fire({
        title: 'Champ manquant',
        text: 'Veuillez sélectionner une région',
        icon: 'warning',
        confirmButtonColor: '#01b894',
        confirmButtonText: 'OK',
        width: '400px'
      });
      return;
    }
    if (!this.formData.imagingCenterId) {
      Swal.fire({
        title: 'Champ manquant',
        text: 'Veuillez sélectionner un centre d\'imagerie',
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
      imagingCenterId: this.formData.imagingCenterId,
      typeId: this.formData.typeId,
      regionId: this.formData.regionId,
      clinicalIndication: this.formData.clinicalIndication,
      youngPatient: this.formData.youngPatient,
      urgencyLevel: this.formData.urgencyLevel,
      needsHelp: this.formData.needsHelp
    };

    console.log('📤 Envoi demande d\'imagerie:', payload);

    this.localCreateImagerie(payload).subscribe({
      next: (response) => {
        console.log('✅ Demande créée avec succès:', response);
        Swal.fire({
          title: 'Succès!',
          text: 'La demande d\'imagerie a été créée avec succès',
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