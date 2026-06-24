import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface Toast { id: number; message: string; }

type OrderStatus = 'PENDING' | 'ACCEPTED' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

interface ExamData {
  id:                 string;
  status:             OrderStatus;
  urgency:            string;
  patientId:          string;
  doctorId:           string;
  patientName:        string;
  doctorName:         string;
  categories:         string[];
  clinicalIndication: string;
  createdAt:          string;
  imagingOrderRef:    string;
  appointmentDate:    string | null;
  accessionNumber:    string;
  pictures:           string[];
  report:             string | null;
  reportFile:         string | null;
}

@Component({
  selector: 'app-detail-examen-imagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-examen-imagerie.component.html',
  styleUrl: './detail-examen-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailExamenImagerieComponent implements OnInit, OnDestroy {

  private readonly api      = environment.baseUrl;
  private readonly filesBase = environment.filesUrl;

  // ── FILES ──────────────────────────────────────────────────────────────────
  selectedFiles: File[] = [];
  previewUrls:   string[] = [];

  // ── TOASTS ─────────────────────────────────────────────────────────────────
  toasts: Toast[] = [];
  private toastIdCounter = 0;

  // ── STATE ──────────────────────────────────────────────────────────────────
  examId   = '';
  examApi!: ExamData;
  loading  = false;
  isSaving = false;
  error    = '';
  private pollInterval: any = null;

  // ── TABS ───────────────────────────────────────────────────────────────────
  ongletActif: 'images' | 'compte-rendu' = 'images';

  // ── MODALS ─────────────────────────────────────────────────────────────────
  showValidationDemandeModal    = false;
  showValidationDemandeSuccess  = false;
  showArriveePatientModal       = false;
  showArriveePatientSuccess     = false;
  arriveeNote                   = '';
  showImportImageModal          = false;
  showImportImageSuccess        = false;
  showViewImageModal            = false;
  showDeleteImageModal          = false;
  showDeleteImageSuccess        = false;
  showValidateCompteRenduModal  = false;
  showValidateCompteRenduSuccess = false;

  // ── DISPLAY DATA ───────────────────────────────────────────────────────────
  examen = { code: '', type: '', urgence: false, statut: '' };
  patient = { initials: '', name: '', role: 'Patient' };
  prescripteur = { name: '', specialite: '' };
  prescription = {
    typeExamen:        '',
    zone:              '',
    indications:       [] as string[],
    contreIndications: null as any,
    dateReception:     ''
  };
  rendezVous = { date: '—', heure: '—' };
  imagesMedicales: { id: number; titre: string; name: string; url: string }[] = [];
  selectedImage: any = null;

  // ── FORMS ──────────────────────────────────────────────────────────────────
  validationDemandeForm = { date: '', heure: '', prix: '', note: '' };
  compteRenduForm       = { description: '' };
  compteRenduFile: File | null        = null;
  compteRenduFilePreview: string | null = null;

  // ── DICOM VIEWER ───────────────────────────────────────────────────────────
  accessionNumber      = '';
  viewerRefreshTrigger = 0;
  dicomFullscreen      = false;

  constructor(
    private route:    ActivatedRoute,
    private location: Location,
    private http:     HttpClient,
    private cdr:      ChangeDetectorRef
  ) {}

  // ── INIT ───────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (id) {
      this.examId = id;
      this.loadExamen(id);
    }
  }

  // ── LOAD ───────────────────────────────────────────────────────────────────
  loadExamen(id: string): void {
    this.loading = true;
    this.http.get<any>(`${this.api}/diagnostic/imaging-orders/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        if (!data) {
          this.error   = 'Impossible de charger les détails de l\'examen';
          this.loading = false;
          this.showErrorToast('Impossible de charger les détails de l\'examen');
          this.cdr.markForCheck();
          return;
        }
        this.resolveNames(data);
      });
  }

  private resolveNames(data: any): void {
    const ids = [...new Set([data.patientId, data.doctorId].filter(Boolean))] as string[];
    if (!ids.length) { this.build(data, {}); return; }

    this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
      `${this.api}/users/names?ids=${ids.join(',')}`
    ).pipe(catchError(() => of([]))).subscribe(names => {
      const m: Record<string, string> = {};
      for (const n of names) m[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
      this.build(data, m);
    });
  }

  private build(data: any, names: Record<string, string>): void {
    const pName = names[data.patientId] || `Patient ${(data.patientId ?? '').slice(-6).toUpperCase()}`;
    const dName = names[data.doctorId]  ? `Dr. ${names[data.doctorId]}` : (data.doctorName || 'Médecin');
    const cats  = (data.categories ?? data.examTypes ?? []) as string[];
    const type  = cats.length > 0 ? cats.join(', ') : (data.type ?? 'Examen');

    let apptDate = '—';
    let apptTime = '—';
    if (data.appointmentDate) {
      const d = new Date(data.appointmentDate);
      apptDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      apptTime = data.appointmentTime ?? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    this.examApi = {
      id:                 data.id,
      status:             data.status as OrderStatus,
      urgency:            data.urgency ?? '',
      patientId:          data.patientId,
      doctorId:           data.doctorId,
      patientName:        pName,
      doctorName:         dName,
      categories:         cats,
      clinicalIndication: data.clinicalIndication ?? '',
      createdAt:          data.createdAt ?? '',
      imagingOrderRef:    data.imagingOrderRef ?? '—',
      appointmentDate:    data.appointmentDate ?? null,
      accessionNumber:    data.accessionNumber ?? '',
      pictures:           data.imageUrls ?? data.pictures ?? [],
      report:             data.observations ?? data.report ?? null,
      reportFile:         data.resultFileUrl ?? data.reportFile ?? null,
    };

    this.examen = {
      code:   data.imagingOrderRef ?? `IMG-${(data.id ?? '').slice(-6).toUpperCase()}`,
      type,
      urgence: data.urgency === 'URGENT',
      statut:  data.status,
    };

    this.patient = {
      initials: pName.split(' ').filter((w: string) => w.length > 0).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      name: pName,
      role: 'Patient',
    };

    this.prescripteur = {
      name:      dName,
      specialite: data.doctorSpecialite || 'Médecin prescripteur',
    };

    this.prescription = {
      typeExamen:        type,
      zone:              data.region ?? '',
      indications:       data.clinicalIndication ? [data.clinicalIndication] : [],
      contreIndications: data.contreIndications ?? null,
      dateReception:     data.createdAt ? new Date(data.createdAt).toLocaleString('fr-FR') : '—',
    };

    this.rendezVous = { date: apptDate, heure: apptTime };

    this.imagesMedicales = (data.imageUrls ?? data.pictures ?? []).map((url: string, i: number) => {
      const fullUrl = url.startsWith('http') ? url : `${this.filesBase}/${url}`;
      return { id: i + 1, titre: `Image ${i + 1}`, name: url, url: fullUrl };
    });

    this.accessionNumber = data.accessionNumber ?? '';

    if (data.report) {
      this.compteRenduForm.description = data.report;
    }

    this.loading = false;
    this.cdr.markForCheck();

    if (data.status === 'ACCEPTED') {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      this.http.get<any>(`${this.api}/diagnostic/imaging-orders/${this.examId}`)
        .pipe(catchError(() => of(null)))
        .subscribe(d => {
          if (d && d.status !== 'ACCEPTED') {
            this.stopPolling();
            this.resolveNames(d);
          }
        });
    }, 10_000);
  }

  private stopPolling(): void {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  ngOnDestroy(): void { this.stopPolling(); }

  // ── GUARDS ─────────────────────────────────────────────────────────────────
  get examenStatus(): string { return this.examApi?.status as string ?? ''; }
  isCompteRenduPublie(): boolean  { return this.examenStatus === 'COMPLETED'; }
  canEditCompteRendu(): boolean   { return this.examenStatus === 'IN_PROGRESS'; }
  canUploadImages(): boolean      { return this.examenStatus === 'IN_PROGRESS'; }
  isExamenCancelled(): boolean    { return ['REJECTED', 'EXPIRED'].includes(this.examenStatus); }

  // ── MODAL : VALIDER DEMANDE (PENDING → ACCEPTED) ───────────────────────────
  openValidationDemande(): void {
    this.validationDemandeForm = { date: '', heure: '', prix: '', note: '' };
    this.showValidationDemandeModal = true;
    this.cdr.markForCheck();
  }

  closeValidationDemande(): void {
    this.showValidationDemandeModal = false;
    this.cdr.markForCheck();
  }

  confirmerValidationDemande(): void {
    const { date, heure, prix, note } = this.validationDemandeForm;
    if (!date || !heure) { this.showErrorToast('Veuillez renseigner la date et l\'heure'); return; }
    if (!prix || isNaN(+prix) || +prix <= 0) { this.showErrorToast('Veuillez saisir un montant valide'); return; }

    const appointmentDate = new Date(`${date}T${heure}:00`).toISOString();
    const body: any = { price: +prix, appointmentDate };
    if (note) body['note'] = note;

    this.isSaving = true;
    this.cdr.markForCheck();

    this.http.patch(`${this.api}/diagnostic/imaging-orders/${this.examId}/accept`, body)
      .pipe(finalize(() => { this.isSaving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.showValidationDemandeModal  = false;
          this.showValidationDemandeSuccess = true;
          this.cdr.markForCheck();
          setTimeout(() => { this.showValidationDemandeSuccess = false; this.loadExamen(this.examId); }, 2000);
        },
        error: (err) => {
          this.showErrorToast(err?.error?.message ?? 'Erreur lors de la validation');
        }
      });
  }

  closeValidationDemandeSuccess(): void { this.showValidationDemandeSuccess = false; this.cdr.markForCheck(); }

  // ── MODAL : PATIENT ARRIVÉ (FUNDED → IN_PROGRESS) ─────────────────────────
  openArriveePatient(): void {
    this.arriveeNote = '';
    this.showArriveePatientModal = true;
    this.cdr.markForCheck();
  }

  closeArriveePatient(): void {
    this.showArriveePatientModal = false;
    this.cdr.markForCheck();
  }

  confirmerArriveePatient(): void {
    this.isSaving = true;
    this.cdr.markForCheck();

    this.http.patch(`${this.api}/diagnostic/imaging-orders/${this.examId}/start`, {
      appointmentDate: new Date().toISOString(),
      notes: this.arriveeNote || undefined
    }).pipe(finalize(() => { this.isSaving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.showArriveePatientModal  = false;
          this.showArriveePatientSuccess = true;
          this.cdr.markForCheck();
          setTimeout(() => { this.showArriveePatientSuccess = false; this.loadExamen(this.examId); }, 2000);
        },
        error: (err) => {
          this.showErrorToast(err?.error?.message ?? 'Erreur lors de la confirmation');
        }
      });
  }

  // ── MODAL : IMAGES ─────────────────────────────────────────────────────────
  openImportImage(): void { this.showImportImageModal = true; this.cdr.markForCheck(); }

  closeImportImage(): void {
    this.showImportImageModal = false;
    this.selectedFiles = [];
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewUrls = [];
    this.cdr.markForCheck();
  }

  uploadProgress = 0;

  confirmerImportImage(): void {
    if (this.selectedFiles.length === 0) {
      this.showErrorToast('Veuillez sélectionner au moins une image');
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append('files', file));

    this.isSaving      = true;
    this.uploadProgress = 0;
    this.cdr.markForCheck();

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${this.api}/diagnostic/imaging-orders/${this.examId}/pictures`);

    const token = localStorage.getItem('access_token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.timeout = 120_000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        this.uploadProgress = Math.round((e.loaded / e.total) * 100);
        this.cdr.markForCheck();
      }
    };

    xhr.onload = () => {
      this.isSaving       = false;
      this.uploadProgress  = 0;
      if (xhr.status >= 200 && xhr.status < 300) {
        this.showImportImageModal   = false;
        this.showImportImageSuccess = true;
        this.selectedFiles          = [];
        this.previewUrls            = [];
        this.cdr.markForCheck();
        setTimeout(() => { this.showImportImageSuccess = false; this.cdr.markForCheck(); }, 2000);
        this.loadExamen(this.examId);
      } else {
        let msg = `Erreur ${xhr.status}`;
        try { msg = JSON.parse(xhr.responseText)?.message ?? msg; } catch {}
        this.showErrorToast(msg);
        this.cdr.markForCheck();
      }
    };

    xhr.onerror = () => {
      this.isSaving       = false;
      this.uploadProgress  = 0;
      this.showErrorToast('Erreur réseau — vérifiez votre connexion');
      this.cdr.markForCheck();
    };

    xhr.ontimeout = () => {
      this.isSaving       = false;
      this.uploadProgress  = 0;
      this.showErrorToast('Délai dépassé — le serveur ne répond pas');
      this.cdr.markForCheck();
    };

    xhr.send(formData);
  }

  closeImportImageSuccess(): void { this.showImportImageSuccess = false; this.cdr.markForCheck(); }

  openViewImage(img: any): void  { this.selectedImage = img; this.showViewImageModal = true; this.cdr.markForCheck(); }
  closeViewImage(): void          { this.showViewImageModal = false; this.selectedImage = null; this.cdr.markForCheck(); }
  openDeleteImageFromView(): void { this.showDeleteImageModal = true; this.cdr.markForCheck(); }

  confirmerDeleteImage(): void {
    if (!this.selectedImage) { this.showErrorToast('Aucune image sélectionnée'); return; }
    const name = encodeURIComponent(this.selectedImage.url);

    this.http.delete(`${this.api}/diagnostic/imaging-orders/${this.examId}/pictures/${name}`)
      .subscribe({
        next: () => {
          this.showDeleteImageModal  = false;
          this.showViewImageModal    = false;
          this.showDeleteImageSuccess = true;
          this.cdr.markForCheck();
          setTimeout(() => { this.showDeleteImageSuccess = false; this.cdr.markForCheck(); }, 2000);
          this.loadExamen(this.examId);
          this.selectedImage = null;
        },
        error: () => this.showErrorToast('Erreur lors de la suppression de l\'image')
      });
  }

  closeDeleteImage(): void       { this.showDeleteImageModal   = false; this.cdr.markForCheck(); }
  closeDeleteImageSuccess(): void { this.showDeleteImageSuccess = false; this.cdr.markForCheck(); }

  // ── COMPTE RENDU ───────────────────────────────────────────────────────────
  genererAvecIA(): void {
    if (!this.examId) return;
    this.http.post<{ report: string }>(`${this.api}/diagnostic/imaging-orders/${this.examId}/generate-report`, {})
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (res?.report) { this.compteRenduForm.description = res.report; this.cdr.markForCheck(); }
        else this.showErrorToast('Erreur lors de la génération IA');
      });
  }

  openValiderCompteRendu(): void {
    if (!this.compteRenduForm.description) { this.showErrorToast('Veuillez saisir le compte rendu'); return; }
    this.showValidateCompteRenduModal = true;
    this.cdr.markForCheck();
  }

  closeValidateCompteRendu(): void  { this.showValidateCompteRenduModal   = false; this.cdr.markForCheck(); }
  closeCompteRenduSuccess(): void    { this.showValidateCompteRenduSuccess  = false; this.cdr.markForCheck(); }
  closeValidateCompteRenduSuccess(): void { this.showValidateCompteRenduSuccess = false; this.cdr.markForCheck(); }

  confirmerPublierCompteRendu(): void {
    if (!this.examApi)                     { this.showErrorToast('Examen non chargé');          return; }
    if (!this.compteRenduForm.description) { this.showErrorToast('Veuillez saisir le compte rendu'); return; }

    this.isSaving = true;
    this.cdr.markForCheck();

    const doComplete = (resultFileUrl?: string) => {
      const body: Record<string, string> = { observations: this.compteRenduForm.description };
      if (this.examApi.imagingOrderRef) body['reportTitle'] = this.examApi.imagingOrderRef;
      if (resultFileUrl)                body['resultFileUrl'] = resultFileUrl;

      this.http.patch(`${this.api}/diagnostic/imaging-orders/${this.examId}/complete`, body)
        .pipe(finalize(() => { this.isSaving = false; this.cdr.markForCheck(); }))
        .subscribe({
          next: () => {
            this.examApi = { ...this.examApi, status: 'COMPLETED' };
            this.showValidateCompteRenduModal  = false;
            this.showValidateCompteRenduSuccess = true;
            this.cdr.markForCheck();
            setTimeout(() => { this.showValidateCompteRenduSuccess = false; this.loadExamen(this.examId); }, 2000);
          },
          error: (err) => {
            this.showErrorToast(err?.error?.message ?? 'Erreur lors de la publication du compte rendu');
          },
        });
    };

    if (this.compteRenduFile) {
      const formData = new FormData();
      formData.append('file', this.compteRenduFile);
      this.http.post<{ resultFileUrl: string }>(
        `${this.api}/diagnostic/imaging-orders/${this.examId}/report-file`,
        formData,
      ).subscribe({
        next:  (res) => doComplete(res?.resultFileUrl),
        error: ()    => doComplete(),
      });
    } else {
      doComplete();
    }
  }

  getCurrentDate(): string {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }

  onCompteRenduFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.compteRenduFile = input.files[0];
    if (this.compteRenduFile.size > 10 * 1024 * 1024) {
      this.showErrorToast('Le fichier est trop volumineux (max 10 MB)');
      this.compteRenduFile = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { this.compteRenduFilePreview = reader.result as string; this.cdr.markForCheck(); };
    reader.readAsDataURL(this.compteRenduFile);
  }

  removeCompteRenduFile(): void {
    this.compteRenduFile        = null;
    this.compteRenduFilePreview = null;
    this.cdr.markForCheck();
  }

  // ── FILES ──────────────────────────────────────────────────────────────────
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    Array.from(input.files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        this.showErrorToast(`Le fichier ${file.name} est trop volumineux (max 10 MB)`);
        return;
      }
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrls.push(reader.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
    this.cdr.markForCheck();
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
    this.cdr.markForCheck();
  }

  // ── DICOM ──────────────────────────────────────────────────────────────────
  openDicomFullscreen():  void { this.dicomFullscreen = true;  this.cdr.markForCheck(); }
  closeDicomFullscreen(): void { this.dicomFullscreen = false; this.cdr.markForCheck(); }
  copyAccessionNumber():  void { if (this.accessionNumber) navigator.clipboard.writeText(this.accessionNumber); }

  // ── TOASTS ─────────────────────────────────────────────────────────────────
  showErrorToast(message: string): void {
    const toast: Toast = { id: this.toastIdCounter++, message };
    this.toasts.push(toast);
    setTimeout(() => this.removeToast(toast.id), 5000);
    this.cdr.markForCheck();
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.markForCheck();
  }

  // ── UTILS ──────────────────────────────────────────────────────────────────
  getStatutLabel(statut: string): string {
    const m: Record<string, string> = {
      PENDING:     'En attente',
      ACCEPTED:    'Validée',
      FUNDED:      'Financée',
      IN_PROGRESS: 'En cours',
      COMPLETED:   'Terminée',
      REJECTED:    'Annulée',
      EXPIRED:     'Expirée',
    };
    return m[statut] ?? statut;
  }

  goBack():    void { this.location.back(); }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName.split(' ').filter(n => n.length > 0).map(n => n[0].toUpperCase()).join('').slice(0, 2);
  }
}
