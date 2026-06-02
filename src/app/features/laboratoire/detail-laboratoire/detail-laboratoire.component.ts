import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LaboratoireService } from '../../../services/laboratoire/laboratoire.service';
import { Laboratoire } from '../../../modele/laboratoir';
import { Location } from '@angular/common';

interface ResultatBiologique {
  parametre: string;
  valeur: number;
  unite: string;
  reference: string;
  etat: 'Normal' | 'Attention' | 'Anormal';
}

interface Toast {
  id: number;
  message: string;
}

@Component({
  selector: 'app-detail-laboratoire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-laboratoire.component.html',
  styleUrl: './detail-laboratoire.component.css'
})
export class DetailLaboratoireComponent implements OnInit {

  // ======================
  // API SOURCE
  // ======================
  examApi!: Laboratoire;
  loading = false;
  error = '';

  // ======================
  // TOAST SYSTEM
  // ======================
  toasts: Toast[] = [];
  private toastIdCounter = 0;

  // ======================
  // UI STATE
  // ======================


  // ======================
  // MODALS
  // ======================
  showEditRdvModal = false;
  showEditRdvSuccess = false;

  showValidateCompteRenduModal = false;
  showValidateCompteRenduSuccess = false;

  showValidationDemandeModal = false;
  showValidationDemandeSuccess = false;

  // PDF password modal (before opening PDF)
  showPdfPasswordModal = false;
  pdfPasswordModalInput = '';
  showPdfModalPasswordInput = false;
  pdfUrlToOpen: string | null = null;

  // Password visibility in form & aperçu
  showPdfPasswordInput = false;
  showPdfPasswordInApercu = false;

  // Keep password after publish for aperçu display
  lastSubmittedPdfPassword = '';


  // ======================
  // DATA
  // ======================
  examen = { code: '', type: '', urgence: false, statut: '' };

  patient = { initials: '', name: '', role: 'Patient' };

  prescripteur = { name: '', specialite: '' };

  prescription = {
    typeExamen: '',
    indications: [] as string[],
    dateReception: ''
  };

  rendezVous = { date: '—', heure: '—' };


  // ======================
  // FORMS
  // ======================
  rendezVousForm = { date: '', heure: '', note: '' };
  compteRenduForm = { description: '', pdfPassword: '' };




  // Validation demande
  selectedLaboratoireId: number | null = null;
  validationDemandeForm = {
    date: '',
    heure: '',
    note: ''
  };

  // Compte rendu
  compteRenduFile: File | null = null;
  compteRenduFilePreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private laboratoireService: LaboratoireService,
    private location: Location
  ) { }

  // ======================
  // INIT
  // ======================
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadExamen(id);
    }
  }

  // ======================
  // TOAST METHODS
  // ======================
  showErrorToast(message: string): void {
    const toast: Toast = {
      id: this.toastIdCounter++,
      message
    };

    this.toasts.push(toast);

    // Auto-remove après 5 secondes
    setTimeout(() => {
      this.removeToast(toast.id);
    }, 5000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // ======================
  // API DETAIL
  // ======================
  loadExamen(id: number): void {
    this.loading = true;

    this.laboratoireService.getLaboratoireById(id).subscribe({
      next: (data) => {
        this.examApi = data;
        console.log('Détail examen laboratoire', this.examApi);

        this.examen = {
          code: `LAB-${data.id}`,
          type: data.type,
          urgence: data.urgencyLevel === 'URGENT',
          statut: data.status
        };

        this.patient = {
          initials: data.patientName.split(' ').map(n => n[0]).join(''),
          name: data.patientName,
          role: 'Patient'
        };

        this.prescripteur = {
          name: data.doctorName,
          specialite: 'Médecin prescripteur'
        };

        this.prescription = {
          typeExamen: data.type,
          indications: data.clinicalIndication ? [data.clinicalIndication] : [],
          dateReception: new Date(data.createdAt).toLocaleString()
        };

        this.rendezVous = {
          date: data.appointmentDate || '—',
          heure: data.appointmentTime || '—'
        };

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du détail';
        this.loading = false;
        this.showErrorToast('Impossible de charger les détails de l\'examen');
        console.error('Erreur chargement examen:', err);
      }
    });
  }

  // ======================
  // LOGIQUE
  // ======================
  canValidate(): boolean {
    return (
      this.examApi?.status === 'PENDING' &&
      !this.examApi?.appointmentDate &&
      !this.examApi?.appointmentTime
    );
  }

  get examenStatus(): string {
    return this.examApi?.status as string;
  }

  isCompteRenduPublie(): boolean {
    return this.examenStatus === 'COMPLETED';
  }

  canEditCompteRendu(): boolean {
    return this.examenStatus === 'PENDING' || this.examenStatus === 'ACCEPTED';
  }

  isExamenCancelled(): boolean {
    return this.examenStatus === 'CANCELLED';
  }

  // ======================
  // MODALS RDV
  // ======================
  openEditRdv() {
    this.showEditRdvModal = true;
  }

  closeEditRdv() {
    this.showEditRdvModal = false;
  }

  confirmerEditRdv() {
    if (!this.rendezVousForm.date || !this.rendezVousForm.heure) {
      this.showErrorToast('Veuillez renseigner la date et l\'heure');
      return;
    }

    // TODO: Appel API pour modifier le RDV
    this.showEditRdvModal = false;
    this.showEditRdvSuccess = true;

    setTimeout(() => {
      this.showEditRdvSuccess = false;
    }, 2000);
  }

  closeEditRdvSuccess() {
    this.showEditRdvSuccess = false;
  }

  // ======================
  // MODALS VALIDATION
  // ======================
  openValidationDemande(): void {
    if (!this.examApi) {
      this.showErrorToast('Examen non chargé');
      return;
    }

    this.selectedLaboratoireId = this.examApi.id;
    this.patient.name = this.examApi.patientName || 'le patient';

    this.validationDemandeForm = {
      date: '',
      heure: '',
      note: ''
    };

    this.showValidationDemandeModal = true;
  }

  closeValidationDemande(): void {
    this.showValidationDemandeModal = false;
    this.selectedLaboratoireId = null;
  }

  private formatDateToJJMMAAAA(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  confirmerValidationDemande(): void {
    if (!this.selectedLaboratoireId) {
      this.showErrorToast('Aucune demande sélectionnée');
      return;
    }

    if (!this.compteRenduForm.description) {
      this.showErrorToast('Veuillez saisir le compte rendu');
      return;
    }


    const payload = {
      requestId: this.selectedLaboratoireId,
      date: this.formatDateToJJMMAAAA(this.validationDemandeForm.date),
      time: this.validationDemandeForm.heure
    };

    this.laboratoireService.acceptLaboratoire(payload).subscribe({
      next: (res) => {
        console.log('✅ Demande validée:', res);

        this.showValidationDemandeModal = false;
        this.showValidationDemandeSuccess = true;

        setTimeout(() => {
          this.showValidationDemandeSuccess = false;
          // Recharger les données
          if (this.examApi) {
            this.loadExamen(this.examApi.id);
          }
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Erreur validation demande:', err);
        this.showErrorToast('Erreur lors de la validation de la demande');
      }
    });
  }

  closeValidationDemandeSuccess(): void {
    this.showValidationDemandeSuccess = false;
  }


  // ======================
  // COMPTE RENDU
  // ======================
  genererAvecIA() {
    this.compteRenduForm.description = 'Compte rendu généré automatiquement par l\'IA.';
  }

  openValiderCompteRendu() {
    if (!this.compteRenduForm.description) {
      this.showErrorToast('Veuillez saisir le compte rendu');
      return;
    }
    if (!this.compteRenduFile) {
      this.showErrorToast('Veuillez joindre un fichier PDF (obligatoire)');
      return;
    }
    if (!this.compteRenduForm.pdfPassword) {
      this.showErrorToast('Veuillez renseigner le mot de passe du PDF');
      return;
    }
    this.showValidateCompteRenduModal = true;
  }


  closeValidateCompteRendu() {
    this.showValidateCompteRenduModal = false;
  }

  closeCompteRenduSuccess() {
    this.showValidateCompteRenduSuccess = false;
  }

  closeValidateCompteRenduSuccess() {
    this.showValidateCompteRenduSuccess = false;
  }

  getCurrentDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onCompteRenduFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // PDF uniquement
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.showErrorToast('Seuls les fichiers PDF sont acceptés');
      input.value = '';
      return;
    }

    // Validation de la taille (10 MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showErrorToast('Le fichier est trop volumineux (max 10 MB)');
      input.value = '';
      return;
    }

    this.compteRenduFile = file;
    this.compteRenduFilePreview = null;
    console.log('📄 Fichier sélectionné:', this.compteRenduFile.name);
  }

  removeCompteRenduFile(): void {
    this.compteRenduFile = null;
    this.compteRenduFilePreview = null;
  }

  confirmerPublierCompteRendu(): void {
    if (!this.examApi) {
      this.showErrorToast('Examen non chargé');
      return;
    }

    if (!this.compteRenduForm.description) {
      this.showErrorToast('Veuillez remplir tous les champs obligatoires');
      return;
    }

    console.log('📤 Envoi du compte rendu...');

    const pdfPwd = this.compteRenduForm.pdfPassword;

    this.laboratoireService.submitAnalysisReport({
      requestId: this.examApi.id,
      report: this.compteRenduForm.description,
      reportFile: this.compteRenduFile || undefined,
      pdfPassword: pdfPwd || undefined
    }).subscribe({
      next: (response) => {
        console.log('✅ Compte rendu publié:', response);

        // Conserver le mot de passe pour affichage dans l'aperçu
        this.lastSubmittedPdfPassword = this.compteRenduForm.pdfPassword;

        if (this.examApi) {
          this.examApi.status = 'COMPLETED';
        }

        this.showValidateCompteRenduModal = false;
        this.showValidateCompteRenduSuccess = true;

        setTimeout(() => {
          this.showValidateCompteRenduSuccess = false;
          if (this.examApi) {
            this.loadExamen(this.examApi.id);
          }
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Erreur publication compte rendu:', err);
        this.showErrorToast('Erreur lors de la publication du compte rendu');
      }
    });
  }

  // ======================
  // PDF PASSWORD HELPERS
  // ======================

  getPdfPassword(): string {
    return this.examApi?.pdfPassword || this.lastSubmittedPdfPassword || '';
  }

  copyPdfPassword(): void {
    const pwd = this.compteRenduForm.pdfPassword;
    if (!pwd) return;
    navigator.clipboard.writeText(pwd).then(() => {
      // feedback silencieux
    });
  }

  copyPdfPasswordFromApercu(): void {
    const pwd = this.getPdfPassword();
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
  }

  openPdfPage(url: string): void {
    const encoded = encodeURIComponent(url);
    window.open(`/pdf-viewer?url=${encoded}`, '_blank');
  }

  openPdfPasswordModal(url: string): void {
    this.pdfUrlToOpen = url;
    this.pdfPasswordModalInput = '';
    this.showPdfModalPasswordInput = false;
    this.showPdfPasswordModal = true;
  }

  closePdfPasswordModal(): void {
    this.showPdfPasswordModal = false;
    this.pdfUrlToOpen = null;
    this.pdfPasswordModalInput = '';
  }

  confirmOpenPdf(): void {
    const expected = this.getPdfPassword();
    if (expected && this.pdfPasswordModalInput !== expected) {
      this.showErrorToast('Mot de passe incorrect');
      return;
    }
    if (this.pdfUrlToOpen) {
      window.open(this.pdfUrlToOpen, '_blank');
    }
    this.closePdfPasswordModal();
  }

  // ======================
  // UTILS
  // ======================
  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Validée';
      case 'REJECTED':
        return 'Annulée';
      case 'COMPLETED':
        return 'Terminée';
      default:
        return statut;
    }
  }

  goBack(): void {
    this.location.back();
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0].toUpperCase())
      .join('');
  }

}
