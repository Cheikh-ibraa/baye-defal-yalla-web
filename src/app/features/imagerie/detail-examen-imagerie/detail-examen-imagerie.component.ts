import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, delay } from 'rxjs';
import { Examen } from '../../../modele/imagerie.model';
import { Location } from '@angular/common';
import { StandalonePacsViewerComponent } from '../../../core/utils/standalone-pacs-viewer.component';

interface Toast {
  id: number;
  message: string;
}

@Component({
  selector: 'app-detail-examen-imagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, StandalonePacsViewerComponent],
  templateUrl: './detail-examen-imagerie.component.html',
  styleUrl: './detail-examen-imagerie.component.css'
})
export class DetailExamenImagerieComponent implements OnInit {
  imageBaseUrl = 'https://wakana.online/repertoire_chantier/';
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  // ======================
  // TOAST SYSTEM
  // ======================
  toasts: Toast[] = [];
  private toastIdCounter = 0;

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    Array.from(input.files).forEach(file => {
      // Validation de la taille (10 MB max par fichier)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.showErrorToast(`Le fichier ${file.name} est trop volumineux (max 10 MB)`);
        return;
      }

      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrls.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });

    // reset input pour pouvoir re-sélectionner les mêmes fichiers
    input.value = '';
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  // ======================
  // API SOURCE
  // ======================
  examApi!: Examen;
  loading = false;
  error = '';

  // ======================
  // UI STATE
  // ======================
  ongletActif: 'images' | 'compte-rendu' | 'dicom' = 'dicom';

  // ======================
  // MODALS
  // ======================
  showEditRdvModal = false;
  showEditRdvSuccess = false;

  showImportImageModal = false;
  showImportImageSuccess = false;

  showViewImageModal = false;

  showEditImageModal = false;
  showEditImageSuccess = false;

  showDeleteImageModal = false;
  showDeleteImageSuccess = false;

  showValidateCompteRenduModal = false;
  showValidateCompteRenduSuccess = false;

  showValidationDemandeModal = false;
  showValidationDemandeSuccess = false;

  // ======================
  // DATA
  // ======================
  examen = { code: '', type: '', urgence: false, statut: '' };

  patient = { initials: '', name: '', role: 'Patient' };

  prescripteur = { name: '', specialite: '' };

  prescription = {
    typeExamen: '',
    zone: '',
    indications: [] as string[],
    contreIndications: null as any,
    dateReception: ''
  };

  rendezVous = { date: '—', heure: '—' };

  imagesMedicales: {
    id: number;
    titre: string;
    name: string;
    url: string;
  }[] = [];

  selectedImage: any = null;

  // ======================
  // FORMS
  // ======================
  rendezVousForm = { date: '', heure: '', note: '' };
  imageForm = { titre: '', fichier: null as File | null };
  compteRenduForm = { description: '' };


  // Validation demande
  selectedImagerieId: number | null = null;
  validationDemandeForm = {
    date: '',
    heure: '',
    note: ''
  };

  // Compte rendu
  compteRenduFile: File | null = null;
  compteRenduFilePreview: string | null = null;

  // ======================
  // DICOM UPLOAD
  // ======================
  dicomFile: File | null = null;
  dicomFileName: string = '';
  dicomFileError: string = '';
  dicomUploading: boolean = false;
  dicomUploadSuccess: boolean = false;
  dicomUploadError: string = '';
  showDicomUploadModal: boolean = false;
  showDicomUploadSuccess: boolean = false;

  // ======================
  // DICOM VIEWER
  // ======================
  accessionNumber: string = '';
  viewerRefreshTrigger: number = 0;
  dicomFullscreen: boolean = false;

  openDicomFullscreen(): void {
    this.dicomFullscreen = true;
  }

  closeDicomFullscreen(): void {
    this.dicomFullscreen = false;
  }

  copyAccessionNumber(): void {
    if (this.accessionNumber) {
      navigator.clipboard.writeText(this.accessionNumber);
    }
  }

  // ======================
  // RESULTATS
  // ======================
  resultats = [
    { parametre: 'Hémoglobine', valeur: 0, unite: 'g/dL', reference: '12.0 - 16.0', etat: 'Normal' },
    { parametre: 'Leucocytes', valeur: 0, unite: 'g/L', reference: '4.0 - 10.0', etat: 'Normal' },
    { parametre: 'Plaquettes', valeur: 0, unite: 'g/L', reference: '150 - 400', etat: 'Normal' }
  ];

  constructor(
    private route: ActivatedRoute,
    
    private location: Location,
  ) { }

  // --- Local imagerie mocks/helpers ---
  private mockExamenStore: any[] = [
    {
      id: 1,
      type: 'Radiologie',
      urgencyLevel: 'NORMAL',
      status: 'PENDING',
      patientName: 'DIAW M',
      doctorName: 'Dr Mock',
      clinicalIndication: 'Douleur thoracique',
      createdAt: new Date().toISOString(),
      pictures: ['img1.jpg','img2.jpg'],
      accessionNumber: 'ACC-1',
      appointmentDate: null,
      appointmentTime: null
    }
  ];

  private localGetImagerieById(id: number) {
    const found = this.mockExamenStore.find(e => e.id === id) || null;
    return of(found).pipe(delay(120));
  }

  private localAcceptImagerie(payload: any) {
    // find and update status
    const item = this.mockExamenStore.find(e => e.id === payload.requestId);
    if (item) { item.status = 'ACCEPTED'; item.appointmentDate = payload.date; item.appointmentTime = payload.time; }
    return of('OK').pipe(delay(120));
  }

  private localUploadMultiplePictures(requestId: number, formData: FormData) {
    // simulate adding picture names
    const item = this.mockExamenStore.find(e => e.id === requestId);
    if (item) {
      item.pictures = item.pictures.concat(['new1.jpg']);
    }
    return of('OK').pipe(delay(200));
  }

  private localDeleteImagingPicture(requestId: number, pictureName: string) {
    const item = this.mockExamenStore.find(e => e.id === requestId);
    if (item) {
      item.pictures = (item.pictures || []).filter((p: string) => p !== pictureName);
    }
    return of('OK').pipe(delay(120));
  }

  private localSubmitImagingReport(payload: any) {
    const item = this.mockExamenStore.find(e => e.id === payload.requestId);
    if (item) item.status = 'COMPLETED';
    return of('OK').pipe(delay(150));
  }

  private localUploadDicomFile(accessionNumber: string, file: File) {
    // pretend success
    return of('OK').pipe(delay(300));
  }

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

    this.localGetImagerieById(id).subscribe({
      next: (data) => {
        this.examApi = data;

        this.examen = {
          code: `IMG-${data.id}`,
          type: data.type,
          urgence: data.urgencyLevel === 'URGENT',
          statut: data.status
        };

        this.patient = {
          initials: data.patientName.split(' ').map((n: string) => n[0]).join(''),
          name: data.patientName,
          role: 'Patient'
        };

        this.prescripteur = {
          name: data.doctorName,
          specialite: 'Médecin prescripteur'
        };

        this.prescription = {
          typeExamen: data.type,
          zone: data.region,
          indications: data.clinicalIndication ? [data.clinicalIndication] : [],
          contreIndications: null,
          dateReception: new Date(data.createdAt).toLocaleString()
        };

        this.rendezVous = {
          date: data.appointmentDate || '—',
          heure: data.appointmentTime || '—'
        };

        // URLs DIRECTES avec imageBaseUrl
        this.imagesMedicales = (data.pictures || []).map((fileName: string, i: number) => ({
          id: i + 1,
          titre: `Image ${i + 1}`,
          name: fileName,
          url: `${this.imageBaseUrl}${fileName}`
        }));

        // Récupérer accessionNumber pour DICOM
        this.accessionNumber = data.accessionNumber || '';

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
  // MODALS VALIDATION DEMANDE
  // ======================
  openValidationDemande(): void {
    if (!this.examApi) {
      this.showErrorToast('Examen non chargé');
      return;
    }

    this.selectedImagerieId = this.examApi.id;
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
    this.selectedImagerieId = null;
  }

  private formatDateToJJMMAAAA(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  confirmerValidationDemande(): void {
    if (!this.selectedImagerieId) {
      this.showErrorToast('Aucune demande sélectionnée');
      return;
    }

    if (!this.validationDemandeForm.date || !this.validationDemandeForm.heure) {
      this.showErrorToast('Veuillez renseigner la date et l\'heure');
      return;
    }

    const payload = {
      requestId: this.selectedImagerieId,
      date: this.formatDateToJJMMAAAA(this.validationDemandeForm.date),
      time: this.validationDemandeForm.heure
    };

    this.localAcceptImagerie(payload).subscribe({
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
  // MODALS IMAGES
  // ======================
  openImportImage() {
    this.showImportImageModal = true;
  }

  closeImportImage(): void {
    this.showImportImageModal = false;
    this.selectedFiles = [];
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewUrls = [];
  }

  confirmerImportImage(): void {
    if (!this.examApi || this.selectedFiles.length === 0) {
      this.showErrorToast('Veuillez sélectionner au moins une image');
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    this.localUploadMultiplePictures(this.examApi.id, formData)
      .subscribe({
        next: () => {
          this.showImportImageModal = false;
          this.showImportImageSuccess = true;
          this.selectedFiles = [];
          this.previewUrls = [];

          setTimeout(() => {
            this.showImportImageSuccess = false;
          }, 2000);

          this.loadExamen(this.examApi.id);
        },
        error: (err) => {
          console.error('❌ Erreur upload images:', err);
          this.showErrorToast('Erreur lors de l\'importation des images');
        }
      });
  }

  closeImportImageSuccess() {
    this.showImportImageSuccess = false;
  }

  openViewImage(img: any): void {
    this.selectedImage = img;
    this.showViewImageModal = true;
  }

  closeViewImage() {
    this.showViewImageModal = false;
    this.selectedImage = null;
  }

  openEditImageFromView() {
    this.showEditImageModal = true;
  }

  confirmerEditImage() {
    this.showEditImageSuccess = true;

    setTimeout(() => {
      this.showEditImageSuccess = false;
    }, 2000);
  }

  closeEditImage() {
    this.showEditImageModal = false;
  }

  closeEditImageSuccess() {
    this.showEditImageSuccess = false;
  }

  openDeleteImageFromView() {
    this.showDeleteImageModal = true;
  }

  confirmerDeleteImage(): void {
    if (!this.selectedImage || !this.examApi) {
      this.showErrorToast('Aucune image sélectionnée');
      return;
    }

    this.localDeleteImagingPicture(this.examApi.id, this.selectedImage.name)
      .subscribe({
        next: () => {
          this.showDeleteImageModal = false;
          this.showViewImageModal = false;
          this.showDeleteImageSuccess = true;

          setTimeout(() => {
            this.showDeleteImageSuccess = false;
          }, 2000);

          this.loadExamen(this.examApi.id);
          this.selectedImage = null;
        },
        error: (err: any) => {
          console.error('❌ Erreur suppression image:', err);
          this.showErrorToast('Erreur lors de la suppression de l\'image');
        }
      });
  }

  closeDeleteImage() {
    this.showDeleteImageModal = false;
  }

  closeDeleteImageSuccess() {
    this.showDeleteImageSuccess = false;
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

    this.showValidateCompteRenduModal = true;
  }

  closeValidateCompteRendu() {
    this.showValidateCompteRenduModal = false;
  }

  closeCompteRenduSuccess() {
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

    this.compteRenduFile = input.files[0];

    // Validation de la taille (10 MB max)
    const maxSize = 10 * 1024 * 1024;
    if (this.compteRenduFile.size > maxSize) {
      this.showErrorToast('Le fichier est trop volumineux (max 10 MB)');
      this.compteRenduFile = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.compteRenduFilePreview = reader.result as string;
    };
    reader.readAsDataURL(this.compteRenduFile);

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
      this.showErrorToast('Veuillez saisir le compte rendu');
      return;
    }


    console.log('📤 Envoi du compte rendu...');

    this.localSubmitImagingReport({
      requestId: this.examApi.id,
      report: this.compteRenduForm.description,
      reportFile: this.compteRenduFile || undefined
    }).subscribe({
      next: (response) => {
        console.log('✅ Compte rendu publié:', response);

        if (this.examApi) {
          this.examApi.status = 'COMPLETED';
        }

        this.showValidateCompteRenduModal = false;
        this.showValidateCompteRenduSuccess = true;

        setTimeout(() => {
          this.showValidateCompteRenduSuccess = false;
          // Recharger les données
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
  // DICOM UPLOAD
  // ======================
  openDicomUpload(): void {
    this.dicomFile = null;
    this.dicomFileName = '';
    this.dicomFileError = '';
    this.dicomUploadError = '';
    this.showDicomUploadModal = true;
  }

  closeDicomUpload(): void {
    this.showDicomUploadModal = false;
    this.dicomFile = null;
    this.dicomFileName = '';
    this.dicomFileError = '';
    this.dicomUploadError = '';
  }

  closeDicomUploadSuccess(): void {
    this.showDicomUploadSuccess = false;
  }

  onDicomFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileName = file.name.toLowerCase();

    // Validation stricte .dcm uniquement
    if (!fileName.endsWith('.dcm')) {
      this.dicomFileError = 'Format invalide. Seuls les fichiers .dcm sont acceptés.';
      this.dicomFile = null;
      this.dicomFileName = '';
      input.value = '';
      return;
    }

    // Validation taille (50 MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.dicomFileError = 'Le fichier est trop volumineux (max 50 MB).';
      this.dicomFile = null;
      this.dicomFileName = '';
      input.value = '';
      return;
    }

    this.dicomFileError = '';
    this.dicomFile = file;
    this.dicomFileName = file.name;
    input.value = '';
  }

  removeDicomFile(): void {
    this.dicomFile = null;
    this.dicomFileName = '';
    this.dicomFileError = '';
  }

  confirmerDicomUpload(): void {
    if (!this.dicomFile) {
      this.dicomFileError = 'Veuillez sélectionner un fichier DICOM (.dcm).';
      return;
    }

    if (!this.accessionNumber) {
      this.dicomUploadError = 'Accession Number introuvable. Impossible de procéder à l\'upload.';
      return;
    }

    this.dicomUploading = true;
    this.dicomUploadError = '';

    this.localUploadDicomFile(this.accessionNumber, this.dicomFile).subscribe({
      next: () => {
        this.dicomUploading = false;
        this.showDicomUploadModal = false;
        this.showDicomUploadSuccess = true;

        setTimeout(() => {
          this.showDicomUploadSuccess = false;
        }, 3000);

        // Rafraîchir le viewer DICOM après upload
        this.viewerRefreshTrigger++;
      },
      error: (err) => {
        console.error('❌ Erreur upload DICOM:', err);
        this.dicomUploading = false;

        if (err.status === 400) {
          this.dicomUploadError = 'Format de fichier invalide ou accession number incorrect.';
        } else if (err.status === 404) {
          this.dicomUploadError = 'Accession Number introuvable sur le serveur.';
        } else if (err.status === 413) {
          this.dicomUploadError = 'Le fichier est trop volumineux pour le serveur.';
        } else {
          this.dicomUploadError = 'Erreur serveur lors de l\'upload. Veuillez réessayer.';
        }
      }
    });
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
