import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsultationService, CreateConsultationRequest } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';

interface ConsultationForm {
  nReferent: string;
  nomPatient: string;
  date: string;
  titre: string;
  typeConsultation: 'TELECONSULTATION' | 'PRESENTIEL' | '';
  observations: string;
  recommandations: string;
  traitementsPrescrits: string;
  planSuivi: string;
  examens: string;
}

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultations.component.html',
  styleUrl: './consultations.component.css'
})
export class ConsultationsComponent implements OnInit {
  showPopup = false;
  popupType: 'success' | 'error' | 'warning' | 'info' = 'info';
  popupTitle = '';
  popupMessage = '';
  popupConfirmText = 'OK';
  popupCancelText = 'Annuler';
  popupShowCancel = false;
  isSubmitting = false;

  // IDs techniques (non visibles dans le formulaire)
  private patientId: number = 0;
  private doctorId: number = 0;

  // Données du formulaire
  formData: ConsultationForm = {
    nReferent: '',
    nomPatient: '',
    date: '',
    titre: '',
    typeConsultation: '',
    observations: '',
    recommandations: '',
    traitementsPrescrits: '',
    planSuivi: '',
    examens: ''
  };

  constructor(
    private router: Router,
    private consultationService: ConsultationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadPatientData();
    this.loadCurrentDoctor();
  }
  /**
   * Charge les données du patient depuis localStorage
   */
  private loadPatientData(): void {
    const storedPatient = localStorage.getItem('selectedPatient');
    if (storedPatient) {
      const patient = JSON.parse(storedPatient);
      this.formData.nReferent = patient.id || '';
      this.formData.nomPatient = patient.nom || '';

      // Extraire le patientId depuis les données stockées
      // Supposons que patient.id contient la référence, nous devons récupérer l'ID numérique
      // via l'API ou le stocker dans localStorage
      const patientIdStr = localStorage.getItem('selectedPatientId');
      if (patientIdStr) {
        this.patientId = parseInt(patientIdStr, 10);
      }

      console.log('✅ Données patient chargées:', {
        reference: this.formData.nReferent,
        nom: this.formData.nomPatient,
        patientId: this.patientId
      });
    }
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

  showAlert(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string; showCancel?: boolean }
  ) {
    this.popupType = type;
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupConfirmText = options?.confirmText || 'OK';
    this.popupCancelText = options?.cancelText || 'Annuler';
    this.popupShowCancel = options?.showCancel || false;
    this.showPopup = true;
  }

  onPopupConfirm() {
    this.showPopup = false;
    if (this.popupType === 'success') {
      // Rediriger vers la page patients avec l'onglet consultations
      this.router.navigate(['/patients'], { queryParams: { tab: 'consultations' } });
    }
  }

  onPopupCancel() {
    this.showPopup = false;
  }

  /**
   * Soumet le formulaire de consultation
   */
  onSubmit(): void {
    // Validation des champs obligatoires
    if (!this.formData.date || !this.formData.titre || !this.formData.typeConsultation) {
      this.showAlert('warning', 'Champs manquants', 'Veuillez remplir tous les champs obligatoires (Date, Titre, Type de consultation)');
      return;
    }

    // Validation des IDs techniques
    if (!this.patientId || !this.doctorId) {
      this.showAlert('error', 'Erreur', 'Impossible de créer la consultation : données patient ou médecin manquantes');
      return;
    }

    this.isSubmitting = true;

    // Convertir le format de date de datetime-local vers DD-MM-YYYY HH:mm
    const formattedDate = this.formatDateForAPI(this.formData.date);

    // Préparer la requête selon le contrat API
    const consultationData: CreateConsultationRequest = {
      patientId: this.patientId,
      doctorId: this.doctorId,
      date: formattedDate,
      title: this.formData.titre,
      observation: this.formData.observations || '',
      recommendation: this.formData.recommandations || '',
      type: this.formData.typeConsultation as 'TELECONSULTATION' | 'PRESENTIEL'
    };

    console.log('📤 Envoi de la consultation:', consultationData);

    this.consultationService.createConsultation(consultationData).subscribe({
      next: (response) => {
        console.log('✅ Consultation créée avec succès:', response);
        this.isSubmitting = false;
        this.showAlert('success', 'Succès', 'La consultation a été enregistrée avec succès');
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création de la consultation:', error);
        this.isSubmitting = false;
        const errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'enregistrement de la consultation';
        this.showAlert('error', 'Erreur', errorMessage);
      }
    });
  }

  /**
   * Convertit le format datetime-local (YYYY-MM-DDTHH:mm) vers DD-MM-YYYY HH:mm
   */
  private formatDateForAPI(datetimeLocal: string): string {
    if (!datetimeLocal) return '';

    // datetime-local format: "2026-02-11T12:00"
    const [datePart, timePart] = datetimeLocal.split('T');
    const [year, month, day] = datePart.split('-');

    return `${day}-${month}-${year} ${timePart}`;
  }

  onCancel(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les données non sauvegardées seront perdues.')) {
      this.goBack();
    }
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }
}