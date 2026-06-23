import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED:   { label: 'Acceptée',   color: 'bg-blue-100 text-blue-800'     },
  FUNDED:     { label: 'Financée',   color: 'bg-purple-100 text-purple-800' },
  ADMITTED:   { label: 'Admis',      color: 'bg-indigo-100 text-indigo-800' },
  DISCHARGED: { label: 'Sorti',      color: 'bg-green-100 text-green-800'   },
  REJECTED:   { label: 'Rejeté',     color: 'bg-red-100 text-red-800'       },
};

@Component({
  selector: 'app-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalisation.component.html',
  styleUrl: './hospitalisation.component.css'
})
export class HospitalisationComponent implements OnInit {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private api    = environment.baseUrl;

  // ── vue ──────────────────────────────────────────────────────────────────
  viewMode: 'list' | 'detail' | 'create' = 'list';
  selectedOrder: any = null;

  // ── liste ─────────────────────────────────────────────────────────────────
  hospitalisations: any[] = [];
  loadingList = false;
  listError   = '';

  // ── recherche & pagination ─────────────────────────────────────────────────
  searchQuery  = '';
  currentPage  = 1;
  readonly pageSize = 10;

  // ── Sections collapse ─────────────────────────────────────────────────────
  patientInfoExpanded   = true;
  generalInfoExpanded   = true;
  datesExpanded         = true;
  responsableExpanded   = true;
  complementaryExpanded = true;

  // ── Hôpitaux ──────────────────────────────────────────────────────────────
  allHospitals: any[]      = [];
  filteredHospitals: any[] = [];
  hospitalSearch           = '';
  hospitalKeycloakId       = '';
  showHospitalDropdown     = false;

  // ── Patient ───────────────────────────────────────────────────────────────
  selectedPatient: any = null;
  currentUser: any     = null;

  // ── Recherche patient ──────────────────────────────────────────────────────
  patientSearch        = '';
  patientSearchResults: any[] = [];
  patientSearchLoading = false;

  // ── Form data ─────────────────────────────────────────────────────────────
  formData = {
    patientId:             '',
    facilityName:          '',
    departmentName:        '',
    doctorName:            '',
    serviceContact:        '',
    hospitalizationReason: '',
    initialDiagnosis:      '',
    observation:           '',
    entryDate:             '',
    entryTime:             '',
    exitDate:              '',
    room:                  '',
    bedNumber:             '',
    priority:              'Normal',
  };

  isSaving = false;

  // ── pagination computed ────────────────────────────────────────────────────
  get filteredOrders(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.hospitalisations;
    return this.hospitalisations.filter(h =>
      h.patientName?.toLowerCase().includes(q) ||
      h.establishmentName?.toLowerCase().includes(q) ||
      h.department?.toLowerCase().includes(q) ||
      h.motif?.toLowerCase().includes(q) ||
      STATUS_LABELS[h.status]?.label.toLowerCase().includes(q)
    );
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize)); }

  get paginatedOrders(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  minVal(a: number, b: number): number { return Math.min(a, b); }

  onSearch(): void { this.currentPage = 1; }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  openDetail(order: any): void {
    this.selectedOrder = order;
    this.viewMode = 'detail';
  }

  printOrder(): void {
    const h = this.selectedOrder;
    if (!h) return;
    const st = this.statusInfo(h.status);
    const date = h.admissionDate ? new Date(h.admissionDate).toLocaleDateString('fr-FR') : '—';
    const exitDate = h.expectedDischargeDate ? new Date(h.expectedDischargeDate).toLocaleDateString('fr-FR') : '—';
    const created = h.createdAt ? new Date(h.createdAt).toLocaleDateString('fr-FR') : '—';
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Demande d'hospitalisation</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#222;font-size:14px}
  h1{color:#104382;border-bottom:2px solid #104382;padding-bottom:8px}
  h2{color:#104382;font-size:15px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:16px}
  .field label{font-weight:600;color:#555;font-size:12px}
  .field p{margin:2px 0 0;font-size:14px}
  @media print{body{margin:20px}}
</style></head><body>
<h1>Demande d'hospitalisation</h1>
<p style="color:#555;font-size:13px">Date de création : <strong>${created}</strong> &nbsp;|&nbsp; Statut : <strong>${st.label}</strong></p>
<h2>Patient</h2>
<div class="grid">
  <div class="field"><label>Nom</label><p>${h.patientName ?? '—'}</p></div>
</div>
<h2>Établissement</h2>
<div class="grid">
  <div class="field"><label>Établissement</label><p>${h.establishmentName ?? h.hospitalName ?? '—'}</p></div>
  <div class="field"><label>Service</label><p>${h.department ?? '—'}</p></div>
</div>
<h2>Informations médicales</h2>
<div class="grid">
  <div class="field"><label>Motif</label><p>${h.motif ?? '—'}</p></div>
  <div class="field"><label>Diagnostic initial</label><p>${h.initialDiagnosis ?? '—'}</p></div>
  <div class="field"><label>Priorité</label><p>${h.priority ?? 'Normal'}</p></div>
  <div class="field"><label>Chambre / Lit</label><p>${h.room ?? '—'} / ${h.bed ?? '—'}</p></div>
</div>
<h2>Dates</h2>
<div class="grid">
  <div class="field"><label>Date d'entrée</label><p>${date}</p></div>
  <div class="field"><label>Date prévisionnelle de sortie</label><p>${exitDate}</p></div>
</div>
<h2>Responsable médical</h2>
<div class="grid">
  <div class="field"><label>Médecin référent</label><p>${h.referentDoctorName ?? '—'}</p></div>
  <div class="field"><label>Contact service</label><p>${h.serviceContact ?? '—'}</p></div>
</div>
${h.medicalObservations ? `<h2>Observations</h2><p>${h.medicalObservations}</p>` : ''}
</body></html>`;
    const w = window.open('', '_blank', 'width=800,height=700');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
  }

  statusInfo(status: string) {
    return STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' };
  }

  ngOnInit(): void {
    this.loadList();
    this.loadDoctor();
    this.loadHospitals();
    if (localStorage.getItem('openCreateMode') === '1') {
      localStorage.removeItem('openCreateMode');
      if (localStorage.getItem('selectedPatient')) {
        this.openCreate();
      }
    }
  }

  // ── Liste ──────────────────────────────────────────────────────────────────

  loadList(): void {
    this.loadingList = true;
    this.listError   = '';
    this.http.get<any>(`${this.api}/medical/hospitalizations/doctor`).subscribe({
      next: (data) => {
        this.hospitalisations = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        this.loadingList = false;
      },
      error: () => {
        this.listError   = 'Impossible de charger les hospitalisations.';
        this.loadingList = false;
      }
    });
  }

  openCreate(): void {
    this.loadPatientFromStorage();
    this.formData = {
      patientId:             localStorage.getItem('selectedPatientId') || this.selectedPatient?.id || '',
      facilityName:          '',
      departmentName:        '',
      doctorName:            this.getDoctorFullName(),
      serviceContact:        this.currentUser?.telephone ?? '',
      hospitalizationReason: '',
      initialDiagnosis:      '',
      observation:           '',
      entryDate:             '',
      entryTime:             '',
      exitDate:              '',
      room:                  '',
      bedNumber:             '',
      priority:              'Normal',
    };
    this.hospitalSearch    = '';
    this.hospitalKeycloakId = '';
    this.viewMode = 'create';
  }

  // ── Chargement données ────────────────────────────────────────────────────

  private loadDoctor(): void {
    this.http.get<any>(`${this.api}/users/me`).subscribe({
      next: (me) => {
        this.currentUser = {
          id:        me.keycloakId ?? me.id,
          nom:       me.lastName  ?? '',
          prenom:    me.firstName ?? '',
          telephone: me.phone     ?? '',
        };
        this.formData.doctorName    = this.getDoctorFullName();
        this.formData.serviceContact = this.currentUser.telephone || '';
      },
      error: () => {
        const raw = localStorage.getItem('user_data');
        if (raw) {
          try { this.currentUser = JSON.parse(raw); } catch { /* ignore */ }
        }
        if (this.currentUser) {
          this.formData.doctorName    = this.getDoctorFullName();
          this.formData.serviceContact = this.currentUser.telephone || '';
        }
      }
    });
  }

  loadHospitals(): void {
    this.http.get<any[]>(`${this.api}/admin/hospitals`).subscribe({
      next:  (data) => { this.allHospitals = data ?? []; },
      error: ()     => { this.allHospitals = []; }
    });
  }

  private loadPatientFromStorage(): void {
    const stored = localStorage.getItem('selectedPatient');
    if (stored) {
      this.selectedPatient = JSON.parse(stored);
      const id = localStorage.getItem('selectedPatientId') ?? this.selectedPatient?.id ?? '';
      if (id) {
        this.formData.patientId = String(id);
      }
      this.patientSearch = this.getPatientFullName();
    }
  }

  // ── Recherche patient ──────────────────────────────────────────────────────

  searchPatient(q: string): void {
    if (q.trim().length < 2) { this.patientSearchResults = []; return; }
    this.patientSearchLoading = true;
    this.http.get<any[]>(`${this.api}/users/patients/search`, { params: { q } }).subscribe({
      next:  (r) => { this.patientSearchResults = r ?? []; this.patientSearchLoading = false; },
      error: ()  => { this.patientSearchResults = [];      this.patientSearchLoading = false; }
    });
  }

  selectPatient(p: any): void {
    const id = p.keycloakId ?? p.id ?? '';
    this.selectedPatient = {
      id,
      nom:       p.lastName  ?? p.nom    ?? '',
      prenom:    p.firstName ?? p.prenom ?? '',
      telephone: p.phone     ?? p.telephone ?? '',
      age:       p.age       ?? null,
    };
    this.formData.patientId = String(id);
    this.patientSearch = this.getPatientFullName();
    this.patientSearchResults = [];
    localStorage.setItem('selectedPatient', JSON.stringify(this.selectedPatient));
    localStorage.setItem('selectedPatientId', String(id));
  }

  // ── Hôpital autocomplete ───────────────────────────────────────────────────

  onHospitalInput(): void {
    const q = this.hospitalSearch.toLowerCase().trim();
    this.formData.facilityName = this.hospitalSearch.trim();
    this.hospitalKeycloakId    = '';
    this.filteredHospitals     = q.length < 1
      ? this.allHospitals.slice(0, 10)
      : this.allHospitals.filter(h => h.name?.toLowerCase().includes(q)).slice(0, 10);
    this.showHospitalDropdown  = true;
  }

  selectHospital(h: any): void {
    this.hospitalSearch      = h.name;
    this.formData.facilityName = h.name;
    this.hospitalKeycloakId  = h.keycloakId ?? h.id ?? '';
    this.showHospitalDropdown = false;
    this.filteredHospitals    = [];
  }

  clearHospital(): void {
    this.hospitalSearch      = '';
    this.formData.facilityName = '';
    this.hospitalKeycloakId  = '';
    this.filteredHospitals   = [];
    this.showHospitalDropdown = false;
  }

  onHospitalBlur(): void {
    setTimeout(() => { this.showHospitalDropdown = false; }, 200);
  }

  // ── Sections collapse ─────────────────────────────────────────────────────

  toggleSection(section: string): void {
    switch (section) {
      case 'patient':       this.patientInfoExpanded   = !this.patientInfoExpanded;   break;
      case 'general':       this.generalInfoExpanded   = !this.generalInfoExpanded;   break;
      case 'dates':         this.datesExpanded         = !this.datesExpanded;         break;
      case 'responsable':   this.responsableExpanded   = !this.responsableExpanded;   break;
      case 'complementary': this.complementaryExpanded = !this.complementaryExpanded; break;
    }
  }

  // ── Soumission ────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.formData.patientId) {
      Swal.fire({ title: 'Patient manquant', text: 'Veuillez sélectionner un patient.', icon: 'error', confirmButtonColor: '#104382', width: '400px' });
      return;
    }
    if (!this.formData.facilityName.trim() || !this.formData.departmentName.trim()) {
      Swal.fire({ title: 'Informations incomplètes', text: 'Veuillez renseigner l\'établissement et le service.', icon: 'warning', confirmButtonColor: '#104382', width: '400px' });
      return;
    }
    if (!this.formData.hospitalizationReason || !this.formData.initialDiagnosis) {
      Swal.fire({ title: 'Informations incomplètes', text: 'Veuillez remplir le motif et le diagnostic initial.', icon: 'warning', confirmButtonColor: '#104382', width: '400px' });
      return;
    }
    if (!this.formData.entryDate || !this.formData.entryTime) {
      Swal.fire({ title: 'Date d\'entrée manquante', text: 'Veuillez renseigner la date et l\'heure d\'entrée.', icon: 'warning', confirmButtonColor: '#104382', width: '400px' });
      return;
    }

    const payload: Record<string, any> = {
      patientId:            this.formData.patientId,
      patientName:          this.getPatientFullName() || undefined,
      patientAge:           this.selectedPatient?.age ?? undefined,
      hospitalId:           this.hospitalKeycloakId || undefined,
      establishmentName:    this.formData.facilityName,
      department:           this.formData.departmentName,
      motif:                this.formData.hospitalizationReason,
      initialDiagnosis:     this.formData.initialDiagnosis || undefined,
      admissionDate:        `${this.formData.entryDate}T${this.formData.entryTime}:00`,
      expectedDischargeDate: this.formData.exitDate || undefined,
      referentDoctorName:   this.formData.doctorName || undefined,
      serviceContact:       this.formData.serviceContact || undefined,
      room:                 this.formData.room || undefined,
      bed:                  this.formData.bedNumber || undefined,
      priority:             this.formData.priority,
      medicalObservations:  this.formData.observation || undefined,
    };

    this.isSaving = true;
    this.http.post(`${this.api}/medical/hospitalizations`, payload).subscribe({
      next: () => {
        this.isSaving = false;
        Swal.fire({
          title: 'Demande envoyée !',
          text: 'La demande d\'hospitalisation a été transmise à l\'établissement.',
          icon: 'success', confirmButtonColor: '#104382', confirmButtonText: 'OK', width: '420px'
        }).then(() => {
          this.router.navigate(['/doctor/patients'], { queryParams: { tab: 'hospitalisation' } });
        });
      },
      error: (err) => {
        this.isSaving = false;
        Swal.fire({ title: 'Erreur', text: err?.error?.message ?? 'Erreur lors de la création.', icon: 'error', confirmButtonColor: '#104382', width: '400px' });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getPatientFullName(): string {
    if (!this.selectedPatient) return '';
    return `${this.selectedPatient.prenom ?? ''} ${this.selectedPatient.nom ?? ''}`.trim();
  }

  getDoctorFullName(): string {
    if (!this.currentUser) return '';
    return `Dr. ${this.currentUser.prenom ?? ''} ${this.currentUser.nom ?? ''}`.trim();
  }

  goBack(): void   { this.viewMode = 'list'; }
  onCancel(): void { this.viewMode = 'list'; }
}
