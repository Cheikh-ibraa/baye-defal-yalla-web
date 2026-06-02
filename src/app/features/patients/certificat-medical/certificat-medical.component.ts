import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MedicalCertificateService, CertificateType, CreateCertificateRequest, CreateCertificateTypeRequest } from '../../../services/medical-certificate.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-certificat-medical',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificat-medical.component.html',
  styleUrl: './certificat-medical.component.css'
})
export class CertificatMedicalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  private location = inject(Location);
  private router = inject(Router);
  private certificateService = inject(MedicalCertificateService);
  private authService = inject(AuthService);

  // Date minimum (aujourd'hui)
  minDate: string = '';

  // IDs techniques (non visibles)
  private patientId: number = 0;
  private doctorId: number = 0;

  // États
  isSubmitting = false;
  loadingTypes = false;
  showAddTypeModal = false;

  // Form data
  formData = {
    nReference: '',
    nomPatient: '',
    telephone: '',
    typeId: 0,
    startDate: '',
    endDate: '',
    motif: ''
  };

  // Nouveau type
  newType = {
    code: '',
    label: '',
    description: ''
  };

  // Types de certificats chargés depuis l'API
  typesCertificat: CertificateType[] = [];

  ngOnInit() {
    // Définir la date minimum à aujourd'hui au format ISO (YYYY-MM-DD)
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    // Charger les données patient et médecin
    this.loadPatientData();
    this.loadCurrentDoctor();

    // Charger les types de certificats
    this.loadCertificateTypes();
  }

  /**
   * Charge les données du patient depuis localStorage
   */
  private loadPatientData(): void {
    const storedPatient = localStorage.getItem('selectedPatient');
    const patientIdStr = localStorage.getItem('selectedPatientId');

    if (storedPatient) {
      const patient = JSON.parse(storedPatient);
      this.formData.nReference = patient.id || '';
      this.formData.nomPatient = patient.nom || '';
      this.formData.telephone = patient.telephone || '';
    }

    if (patientIdStr) {
      this.patientId = parseInt(patientIdStr, 10);
    }

    console.log('✅ Données patient chargées:', {
      reference: this.formData.nReference,
      nom: this.formData.nomPatient,
      telephone: this.formData.telephone,
      patientId: this.patientId
    });
  }

  /**
   * Charge les informations du médecin connecté
   */
  private loadCurrentDoctor(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.doctorId = currentUser.id;
      console.log('✅ Médecin connecté:', {
        id: this.doctorId,
        nom: `${currentUser.prenom} ${currentUser.nom}`
      });
    }
  }

  /**
   * Charge les types de certificats depuis l'API
   */
  loadCertificateTypes(): void {
    this.loadingTypes = true;
    this.certificateService.getCertificateTypes().subscribe({
      next: (types) => {
        this.typesCertificat = types;
        this.loadingTypes = false;
        console.log('✅ Types de certificats chargés:', types);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des types:', error);
        this.loadingTypes = false;
      }
    });
  }

  /**
   * Ouvre le modal d'ajout de type
   */
  openAddTypeModal(): void {
    this.showAddTypeModal = true;
    this.newType = { code: '', label: '', description: '' };
  }

  /**
   * Ferme le modal d'ajout de type
   */
  closeAddTypeModal(): void {
    this.showAddTypeModal = false;
  }

  /**
   * Ajoute un nouveau type de certificat
   */
  addCertificateType(): void {
    if (!this.newType.code || !this.newType.label) {
      alert('Veuillez remplir au moins le code et le libellé');
      return;
    }

    const typeData: CreateCertificateTypeRequest = {
      id: 0,
      code: this.newType.code,
      label: this.newType.label,
      description: this.newType.description
    };

    this.certificateService.addCertificateType(typeData).subscribe({
      next: (newType) => {
        console.log('✅ Nouveau type ajouté:', newType);
        this.loadCertificateTypes(); // Recharger la liste
        this.closeAddTypeModal();
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'ajout du type:', error);
        alert('Erreur lors de l\'ajout du type');
      }
    });
  }

  onSubmit() {
    // Validation
    if (!this.formData.typeId || !this.formData.startDate || !this.formData.endDate || !this.formData.motif) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!this.patientId || !this.doctorId) {
      alert('Erreur: données patient ou médecin manquantes');
      return;
    }

    this.isSubmitting = true;

    const certificateData: CreateCertificateRequest = {
      doctorId: this.doctorId,
      patientId: this.patientId,
      typeId: this.formData.typeId,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      motif: this.formData.motif
    };

    console.log('📤 Envoi du certificat:', certificateData);

    this.certificateService.createCertificate(certificateData).subscribe({
      next: (response) => {
        console.log('✅ Certificat créé avec succès:', response);
        this.isSubmitting = false;
        alert('Certificat médical créé avec succès');
        this.router.navigate(['/patients'], { queryParams: { tab: 'certificats' } });
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création du certificat:', error);
        this.isSubmitting = false;
        const errorMessage = error.error?.message || 'Une erreur est survenue';
        alert(errorMessage);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/patients']);
  }

  goBack() {
    this.router.navigate(['/patients']);
  }
}