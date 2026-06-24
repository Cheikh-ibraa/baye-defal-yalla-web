import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ResultatBiologique {
  parametre: string;
  valeur: number | string;
  unite: string;
  reference: string;
  etat: string;
}

interface Toast { id: number; message: string; }

@Component({
  selector: 'app-detail-laboratoire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-laboratoire.component.html',
  styleUrl: './detail-laboratoire.component.css'
})
export class DetailLaboratoireComponent implements OnInit, OnDestroy {

  private readonly api = environment.baseUrl;

  // ── state ──────────────────────────────────────────────────────────────────
  examApi: any = null;
  orderId = '';
  loading = false;
  error = '';
  isSaving = false;

  toasts: Toast[] = [];
  private toastIdCounter = 0;
  private pollInterval: any = null;

  ongletActif: 'resultats' | 'compte-rendu' = 'resultats';

  // ── data ───────────────────────────────────────────────────────────────────
  examen      = { code: '', type: '', urgence: false, statut: '' };
  patient     = { initials: '', name: '', role: 'Patient' };
  prescripteur = { name: '', specialite: '' };
  prescription = { typeExamen: '', indications: [] as string[], dateReception: '' };
  rendezVous  = { date: '—', heure: '—' };

  resultats: ResultatBiologique[] = [];

  // ── forms ──────────────────────────────────────────────────────────────────
  validationDemandeForm = { date: '', heure: '', prix: '', note: '' };
  rendezVousForm        = { date: '', heure: '', note: '' };
  compteRenduForm       = { description: '', pdfPassword: '' };

  // ── modals ─────────────────────────────────────────────────────────────────
  showValidationDemandeModal   = false;
  showValidationDemandeSuccess = false;
  showArriveePatientModal      = false;
  showArriveePatientSuccess    = false;
  arriveeNote                  = '';
  showEditRdvModal             = false;
  showEditRdvSuccess           = false;
  showValidateCompteRenduModal    = false;
  showValidateCompteRenduSuccess  = false;
  showPdfPasswordModal         = false;
  pdfPasswordModalInput        = '';
  showPdfModalPasswordInput    = false;
  pdfUrlToOpen: string | null  = null;
  showPdfPasswordInput         = false;
  showPdfPasswordInApercu      = false;
  lastSubmittedPdfPassword     = '';

  // ── file ───────────────────────────────────────────────────────────────────
  compteRenduFile: File | null        = null;
  compteRenduFilePreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private http: HttpClient
  ) {}

  // ── init ───────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadExamen(id);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (this.examen.statut !== 'ACCEPTED') { this.stopPolling(); return; }
      this.http.get<any>(`${this.api}/diagnostic/lab-orders/${this.orderId}`).subscribe({
        next: (order) => {
          if (order?.status !== 'ACCEPTED') {
            this.examApi = order;
            this.examen.statut = order.status;
            this.stopPolling();
          }
        },
        error: () => {}
      });
    }, 8000);
  }

  private stopPolling(): void {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  loadExamen(id: string): void {
    this.loading = true;
    this.orderId = id;

    this.http.get<any>(`${this.api}/diagnostic/lab-orders/${id}`).subscribe({
      next: (order) => {
        this.examApi = order;

        this.examen = {
          code:    order.labOrderRef ?? `LAB-${id.slice(0, 6).toUpperCase()}`,
          type:    (order.categories ?? []).join(', '),
          urgence: order.urgency === 'URGENT',
          statut:  order.status
        };

        if (order.status === 'ACCEPTED') this.startPolling();
        else this.stopPolling();

        this.prescription = {
          typeExamen:    (order.categories ?? []).join(', '),
          indications:   order.clinicalIndication ? [order.clinicalIndication] : [],
          dateReception: this.formatDate(order.receivedAt ?? order.createdAt)
        };

        if (order.appointmentDate) {
          const d = new Date(order.appointmentDate);
          this.rendezVous = {
            date:  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          };
        } else {
          this.rendezVous = { date: '—', heure: '—' };
        }

        if ((order.structuredResults ?? []).length > 0) {
          this.resultats = order.structuredResults;
        }

        if (order.observations) {
          this.compteRenduForm.description = order.observations;
        }

        this.resolveNames(order.patientId, order.doctorId);
      },
      error: () => {
        this.error = 'Erreur lors du chargement de l\'examen';
        this.loading = false;
      }
    });
  }

  private resolveNames(patientId: string, doctorId: string): void {
    const ids = [patientId, doctorId].filter(Boolean);
    if (!ids.length) { this.loading = false; return; }

    this.http.get<{ keycloakId: string; firstName: string; lastName: string }[]>(
      `${this.api}/users/names?ids=${ids.join(',')}`
    ).subscribe({
      next: (names) => {
        const map: Record<string, string> = {};
        for (const n of names) {
          map[n.keycloakId] = `${n.firstName ?? ''} ${n.lastName ?? ''}`.trim();
        }
        const patientName = map[patientId] || 'Patient';
        const doctorName  = map[doctorId]  || 'Médecin';

        this.patient = { initials: this.getInitials(patientName), name: patientName, role: 'Patient' };
        this.prescripteur = {
          name:      `Dr. ${doctorName}`,
          specialite: 'Médecin prescripteur'
        };
        this.loading = false;
      },
      error: () => {
        this.patient = { initials: 'P', name: 'Patient', role: 'Patient' };
        this.prescripteur = { name: 'Dr.', specialite: 'Médecin prescripteur' };
        this.loading = false;
      }
    });
  }

  // ── status helpers ─────────────────────────────────────────────────────────
  canValidate(): boolean {
    return this.examApi?.status === 'PENDING';
  }

  get examenStatus(): string { return this.examApi?.status ?? ''; }

  isCompteRenduPublie(): boolean { return this.examenStatus === 'COMPLETED'; }

  canEditCompteRendu(): boolean {
    return ['ACCEPTED', 'FUNDED', 'IN_PROGRESS'].includes(this.examenStatus);
  }

  isExamenCancelled(): boolean {
    return ['REJECTED', 'EXPIRED'].includes(this.examenStatus);
  }

  // ── modal: valider demande (accept + RDV) ──────────────────────────────────
  openValidationDemande(): void {
    this.validationDemandeForm = { date: '', heure: '', prix: '', note: '' };
    this.showValidationDemandeModal = true;
  }

  closeValidationDemande(): void { this.showValidationDemandeModal = false; }

  confirmerValidationDemande(): void {
    const { date, heure, prix, note } = this.validationDemandeForm;
    if (!date || !heure) { this.showErrorToast('Veuillez renseigner la date et l\'heure'); return; }
    if (!prix || isNaN(+prix) || +prix <= 0) { this.showErrorToast('Veuillez saisir un montant valide'); return; }

    const appointmentDate = new Date(`${date}T${heure}:00`).toISOString();
    const body = { price: +prix, appointmentDate, ...(note ? { note } : {}) };

    this.isSaving = true;
    this.http.patch(`${this.api}/diagnostic/lab-orders/${this.orderId}/accept`, body).subscribe({
      next: () => {
        this.isSaving = false;
        this.showValidationDemandeModal = false;
        this.showValidationDemandeSuccess = true;
        setTimeout(() => { this.showValidationDemandeSuccess = false; this.loadExamen(this.orderId); }, 2000);
      },
      error: (err) => {
        this.isSaving = false;
        this.showErrorToast(err?.error?.message ?? 'Erreur lors de la validation');
      }
    });
  }

  closeValidationDemandeSuccess(): void { this.showValidationDemandeSuccess = false; }

  // ── modal: confirmer arrivée patient ──────────────────────────────────────
  openArriveePatient(): void {
    this.arriveeNote = '';
    this.showArriveePatientModal = true;
  }

  closeArriveePatient(): void { this.showArriveePatientModal = false; }

  confirmerArriveePatient(): void {
    this.isSaving = true;
    this.http.patch(`${this.api}/diagnostic/lab-orders/${this.orderId}/start`, {
      appointmentDate: new Date().toISOString(),
      notes: this.arriveeNote || undefined
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showArriveePatientModal = false;
        this.showArriveePatientSuccess = true;
        setTimeout(() => { this.showArriveePatientSuccess = false; this.loadExamen(this.orderId); }, 2000);
      },
      error: (err) => {
        this.isSaving = false;
        this.showErrorToast(err?.error?.message ?? 'Erreur lors de la confirmation');
      }
    });
  }

  // ── modal: modifier RDV ────────────────────────────────────────────────────
  openEditRdv(): void { this.showEditRdvModal = true; }
  closeEditRdv(): void { this.showEditRdvModal = false; }

  confirmerEditRdv(): void {
    if (!this.rendezVousForm.date || !this.rendezVousForm.heure) {
      this.showErrorToast('Veuillez renseigner la date et l\'heure'); return;
    }
    const appointmentDate = new Date(`${this.rendezVousForm.date}T${this.rendezVousForm.heure}:00`).toISOString();

    this.http.patch(`${this.api}/diagnostic/lab-orders/${this.orderId}/start`, {
      appointmentDate,
      notes: this.rendezVousForm.note || undefined
    }).subscribe({
      next: () => {
        this.showEditRdvModal = false;
        this.showEditRdvSuccess = true;
        setTimeout(() => { this.showEditRdvSuccess = false; this.loadExamen(this.orderId); }, 2000);
      },
      error: (err) => this.showErrorToast(err?.error?.message ?? 'Erreur lors de la modification')
    });
  }

  closeEditRdvSuccess(): void { this.showEditRdvSuccess = false; }

  // ── résultats biologiques ──────────────────────────────────────────────────
  ajouterResultat(): void {
    this.resultats.push({ parametre: '', valeur: 0, unite: '', reference: '', etat: 'Normal' });
  }

  supprimerResultat(index: number): void {
    this.resultats.splice(index, 1);
  }

  // ── compte rendu ───────────────────────────────────────────────────────────
  genererAvecIA(): void {
    if (!this.orderId) return;
    this.http.post<{ report: string }>(`${this.api}/diagnostic/lab-orders/${this.orderId}/generate-report`, {}).subscribe({
      next: (res) => { this.compteRenduForm.description = res.report; },
      error: () => this.showErrorToast('Erreur lors de la génération IA')
    });
  }

  openValiderCompteRendu(): void {
    this.showValidateCompteRenduModal = true;
  }

  closeValidateCompteRendu(): void { this.showValidateCompteRenduModal = false; }

  confirmerPublierCompteRendu(): void {
    this.isSaving = true;

    const doSubmit = (resultFileUrl?: string) => {
      const payload: any = { structuredResults: this.resultats };
      if (this.compteRenduForm.description) payload.observations  = this.compteRenduForm.description;
      if (resultFileUrl)                    payload.resultFileUrl = resultFileUrl;

      this.http.patch(`${this.api}/diagnostic/lab-orders/${this.orderId}/results`, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.examApi = { ...this.examApi, status: 'COMPLETED' };
          this.showValidateCompteRenduModal  = false;
          this.showValidateCompteRenduSuccess = true;
          setTimeout(() => { this.showValidateCompteRenduSuccess = false; this.loadExamen(this.orderId); }, 2000);
        },
        error: (err) => {
          this.isSaving = false;
          this.showErrorToast(err?.error?.message ?? 'Erreur lors de la publication');
        },
      });
    };

    if (this.compteRenduFile) {
      const formData = new FormData();
      formData.append('file', this.compteRenduFile);
      this.http.post<{ resultFileUrl: string }>(
        `${this.api}/diagnostic/lab-orders/${this.orderId}/report-file`,
        formData,
      ).subscribe({
        next:  (res) => doSubmit(res?.resultFileUrl),
        error: ()    => doSubmit(),
      });
    } else {
      doSubmit();
    }
  }

  closeCompteRenduSuccess(): void   { this.showValidateCompteRenduSuccess = false; }
  closeValidateCompteRenduSuccess(): void { this.showValidateCompteRenduSuccess = false; }

  // ── fichier PDF ────────────────────────────────────────────────────────────
  onCompteRenduFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) { this.showErrorToast('Seuls les fichiers PDF sont acceptés'); input.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { this.showErrorToast('Le fichier est trop volumineux (max 10 MB)'); input.value = ''; return; }
    this.compteRenduFile = file;
    this.compteRenduFilePreview = null;
  }

  removeCompteRenduFile(): void { this.compteRenduFile = null; this.compteRenduFilePreview = null; }

  // ── PDF helpers ────────────────────────────────────────────────────────────
  getPdfPassword(): string { return this.examApi?.pdfPassword ?? this.lastSubmittedPdfPassword ?? ''; }

  copyPdfPassword(): void {
    if (this.compteRenduForm.pdfPassword) navigator.clipboard.writeText(this.compteRenduForm.pdfPassword);
  }

  copyPdfPasswordFromApercu(): void {
    const pwd = this.getPdfPassword();
    if (pwd) navigator.clipboard.writeText(pwd);
  }

  openPdfPasswordModal(url: string): void {
    this.pdfUrlToOpen = url; this.pdfPasswordModalInput = ''; this.showPdfModalPasswordInput = false; this.showPdfPasswordModal = true;
  }

  closePdfPasswordModal(): void { this.showPdfPasswordModal = false; this.pdfUrlToOpen = null; }

  confirmOpenPdf(): void {
    const expected = this.getPdfPassword();
    if (expected && this.pdfPasswordModalInput !== expected) { this.showErrorToast('Mot de passe incorrect'); return; }
    if (this.pdfUrlToOpen) window.open(this.pdfUrlToOpen, '_blank');
    this.closePdfPasswordModal();
  }

  // ── toasts ─────────────────────────────────────────────────────────────────
  showErrorToast(message: string): void {
    const toast = { id: this.toastIdCounter++, message };
    this.toasts.push(toast);
    setTimeout(() => this.removeToast(toast.id), 5000);
  }

  removeToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }

  // ── utils ──────────────────────────────────────────────────────────────────
  goBack(): void { this.location.back(); }

  getInitials(fullName: string): string {
    return (fullName ?? '').split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('').slice(0, 2);
  }

  getCurrentDate(): string {
    const now = new Date();
    return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', ACCEPTED: 'Validée', FUNDED: 'Financée',
      IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', REJECTED: 'Annulée', EXPIRED: 'Expirée'
    };
    return map[statut] ?? statut;
  }

  private formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }
}
