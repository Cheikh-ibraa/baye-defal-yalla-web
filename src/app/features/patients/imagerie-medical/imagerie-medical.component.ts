import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface ExamTypeOption  { label: string; value: string; }
interface BodyRegionOption { label: string; }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'En attente',   color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED:    { label: 'Acceptée',     color: 'bg-blue-100 text-blue-800'    },
  FUNDED:      { label: 'Financée',     color: 'bg-purple-100 text-purple-800'},
  IN_PROGRESS: { label: 'En cours',     color: 'bg-indigo-100 text-indigo-800'},
  COMPLETED:   { label: 'Terminée',     color: 'bg-green-100 text-green-800'  },
  REJECTED:    { label: 'Rejetée',      color: 'bg-red-100 text-red-800'      },
  EXPIRED:     { label: 'Expirée',      color: 'bg-gray-100 text-gray-600'    },
};

@Component({
  selector: 'app-imagerie-medical',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagerie-medical.component.html',
  styleUrl: './imagerie-medical.component.css'
})
export class ImagerieMedicalComponent implements OnInit {
  private http     = inject(HttpClient);
  private router   = inject(Router);
  private readonly api = environment.baseUrl;

  // ── vue ──────────────────────────────────────────────────────────────────
  viewMode: 'list' | 'detail' | 'create' = 'list';
  selectedOrder: any = null;

  // ── liste ─────────────────────────────────────────────────────────────────
  imagingOrders: any[] = [];
  loadingList   = false;
  listError     = '';

  // ── recherche & pagination ─────────────────────────────────────────────────
  searchQuery  = '';
  currentPage  = 1;
  readonly pageSize = 10;

  // ── Sections (form) ───────────────────────────────────────────────────────
  patientInfoExpanded  = true;
  typeExamenExpanded   = true;
  regionExpanded       = true;
  indicationExpanded   = true;
  parametresExpanded   = true;

  // ── Patient ───────────────────────────────────────────────────────────────
  patientInfo = { id: '', reference: '', nom: '', prenom: '', assurance: '' };

  patientSearch        = '';
  patientSearchResults: any[] = [];
  patientSearchLoading = false;

  // ── Médecin ───────────────────────────────────────────────────────────────
  doctorId       = '';
  doctorName     = '';
  doctorSpecialty = '';

  // ── Types d'examens ────────────────────────────────────────────────────────
  readonly examTypes: ExamTypeOption[] = [
    { label: 'Radiographie',   value: 'XRAY'         },
    { label: 'Échographie',    value: 'ULTRASOUND'   },
    { label: 'Scanner (CT)',   value: 'SCANNER'      },
    { label: 'IRM',            value: 'MRI'          },
    { label: 'Mammographie',   value: 'MAMMOGRAPHY'  },
    { label: 'Doppler',        value: 'DOPPLER'      },
    { label: 'Densitométrie',  value: 'DENSITOMETRY' },
    { label: 'Autres examens', value: 'OTHER'        },
  ];

  readonly bodyRegions: BodyRegionOption[] = [
    { label: 'Crâne'                  },
    { label: 'Thorax'                 },
    { label: 'Abdomen'                },
    { label: 'Bassin'                 },
    { label: 'Membre supérieur droit' },
    { label: 'Colonne lombaire'       },
    { label: 'Sein droit / gauche'    },
  ];

  selectedExamType   = '';
  selectedBodyRegion = '';
  clinicalIndication = '';

  showCustomExamInput    = false;
  customExamLabel        = '';
  showCustomRegionInput  = false;
  customRegionLabel      = '';
  fasting            = false;
  urgency: 'NORMAL' | 'PRIORITY' | 'URGENT' = 'NORMAL';

  readonly indicationsPredefinies = [
    'Suspicion fracture',
    'Douleur abdominale chronique',
    'Suivi lésion hépatique',
    'Suspicion AVC',
  ];

  submitting = false;

  // ── pagination computed ────────────────────────────────────────────────────
  get filteredOrders(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.imagingOrders;
    return this.imagingOrders.filter(o =>
      o.imagingOrderRef?.toLowerCase().includes(q) ||
      o.patientName?.toLowerCase().includes(q) ||
      (o.examTypes ?? []).join(' ').toLowerCase().includes(q) ||
      (o.bodyRegions ?? []).join(' ').toLowerCase().includes(q) ||
      STATUS_LABELS[o.status]?.label.toLowerCase().includes(q)
    );
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize)); }

  get paginatedOrders(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  minVal(a: number, b: number): number { return Math.min(a, b); }

  statusInfo(status: string) {
    return STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' };
  }

  examTypeLabel(value: string): string {
    return this.examTypes.find(t => t.value === value)?.label ?? value;
  }

  urgencyLabel(u: string): string {
    return u === 'URGENT' ? 'Urgent' : u === 'PRIORITY' ? 'Prioritaire' : 'Normal';
  }

  ngOnInit(): void {
    this.loadList();
    this.loadDoctor();
    if (localStorage.getItem('openCreateMode') === '1') {
      localStorage.removeItem('openCreateMode');
      if (localStorage.getItem('selectedPatient')) {
        this.openCreate();
      }
    }
  }

  // ── liste ─────────────────────────────────────────────────────────────────

  loadList(): void {
    this.loadingList = true;
    this.listError   = '';
    this.http.get<any>(`${this.api}/diagnostic/imaging-orders/doctor`).subscribe({
      next: (data) => { this.imagingOrders = Array.isArray(data) ? data : (data?.data ?? []); this.loadingList = false; },
      error: () => { this.listError = 'Impossible de charger les imageries.'; this.loadingList = false; }
    });
  }

  onSearch(): void { this.currentPage = 1; }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  openDetail(order: any): void {
    this.selectedOrder = order;
    this.viewMode = 'detail';
  }

  printOrder(): void {
    const o = this.selectedOrder;
    if (!o) return;
    const urgLabel = this.urgencyLabel(o.urgency);
    const st = this.statusInfo(o.status);
    const exams   = (o.examTypes ?? []).map((v: string) => this.examTypeLabel(v)).join(', ') || '—';
    const regions = (o.bodyRegions ?? []).join(', ') || '—';
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—';
    const rdv  = o.appointmentDate ? new Date(o.appointmentDate).toLocaleDateString('fr-FR') : '—';
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Demande d'imagerie — ${o.imagingOrderRef ?? ''}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#222;font-size:14px}
  h1{color:#104382;border-bottom:2px solid #104382;padding-bottom:8px}
  h2{color:#104382;font-size:15px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:16px}
  .field label{font-weight:600;color:#555;font-size:12px}
  .field p{margin:2px 0 0;font-size:14px}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600}
  @media print{body{margin:20px}}
</style></head><body>
<h1>Demande d'imagerie médicale</h1>
<p style="color:#555;font-size:13px">Référence : <strong>${o.imagingOrderRef ?? '—'}</strong> &nbsp;|&nbsp; Date : <strong>${date}</strong></p>
<h2>Patient</h2>
<div class="grid">
  <div class="field"><label>Nom</label><p>${o.patientName ?? '—'}</p></div>
  <div class="field"><label>Assurance</label><p>${o.patientInsurance ?? '—'}</p></div>
</div>
<h2>Prescripteur</h2>
<div class="grid">
  <div class="field"><label>Médecin</label><p>${o.doctorName ?? '—'}</p></div>
  <div class="field"><label>Spécialité</label><p>${o.doctorSpecialty ?? '—'}</p></div>
</div>
<h2>Examens prescrits</h2>
<div class="grid">
  <div class="field"><label>Types d'examen</label><p>${exams}</p></div>
  <div class="field"><label>Régions anatomiques</label><p>${regions}</p></div>
  <div class="field"><label>Indication clinique</label><p>${o.clinicalIndication ?? '—'}</p></div>
  <div class="field"><label>À jeun</label><p>${o.fasting ? 'Oui' : 'Non'}</p></div>
  <div class="field"><label>Urgence</label><p>${urgLabel}</p></div>
</div>
<h2>Statut & Rendez-vous</h2>
<div class="grid">
  <div class="field"><label>Statut</label><p>${st.label}</p></div>
  <div class="field"><label>Date RDV</label><p>${rdv}</p></div>
  <div class="field"><label>Centre accepté</label><p>${o.acceptedCenterName ?? '—'}</p></div>
  <div class="field"><label>Adresse</label><p>${o.acceptedCenterAddress ?? '—'}</p></div>
  ${o.acceptedPrice ? `<div class="field"><label>Coût estimé</label><p>${Number(o.acceptedPrice).toLocaleString('fr-FR')} FCFA</p></div>` : ''}
</div>
${o.observations ? `<h2>Observations</h2><p>${o.observations}</p>` : ''}
</body></html>`;
    const w = window.open('', '_blank', 'width=800,height=700');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
  }

  // ── form ──────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.loadPatient();
    this.selectedExamType      = '';
    this.selectedBodyRegion    = '';
    this.clinicalIndication    = '';
    this.fasting               = false;
    this.urgency               = 'NORMAL';
    this.showCustomExamInput   = false;
    this.customExamLabel       = '';
    this.showCustomRegionInput = false;
    this.customRegionLabel     = '';
    this.viewMode = 'create';
  }

  private loadPatient(): void {
    const raw = localStorage.getItem('selectedPatient');
    if (!raw) return;
    const p = JSON.parse(raw) as any;
    const id = localStorage.getItem('selectedPatientId') ?? p.id ?? '';
    this.patientInfo = {
      id,
      reference: p.reference ?? p.id ?? '',
      nom:       p.nom    ?? '',
      prenom:    p.prenom ?? '',
      assurance: p.assurance ?? p.mutuelle ?? '',
    };
    this.patientSearch = `${this.patientInfo.prenom} ${this.patientInfo.nom}`.trim();
  }

  private loadDoctor(): void {
    this.http.get<any>(`${this.api}/users/me`).subscribe({
      next: (me) => {
        this.doctorId       = me.keycloakId ?? me.id ?? '';
        this.doctorName     = `Dr. ${me.firstName ?? ''} ${me.lastName ?? ''}`.trim();
        this.doctorSpecialty = me.doctorProfile?.specialty ?? me.specialty ?? '';
      },
      error: () => {
        const raw = localStorage.getItem('user_data');
        if (raw) {
          const u = JSON.parse(raw);
          this.doctorId   = u.id ?? '';
          this.doctorName = `Dr. ${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
        }
      },
    });
  }

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
    this.patientInfo = {
      id,
      reference: p.reference ?? id,
      nom:       p.lastName  ?? p.nom    ?? '',
      prenom:    p.firstName ?? p.prenom ?? '',
      assurance: p.patientProfile?.insurance ?? p.assurance ?? '',
    };
    this.patientSearch = `${this.patientInfo.prenom} ${this.patientInfo.nom}`.trim();
    this.patientSearchResults = [];
    localStorage.setItem('selectedPatient', JSON.stringify({ id, nom: this.patientInfo.nom, prenom: this.patientInfo.prenom }));
    localStorage.setItem('selectedPatientId', id);
  }

  toggleSection(section: string): void {
    switch (section) {
      case 'patient':    this.patientInfoExpanded  = !this.patientInfoExpanded;  break;
      case 'typeExamen': this.typeExamenExpanded    = !this.typeExamenExpanded;   break;
      case 'region':     this.regionExpanded        = !this.regionExpanded;       break;
      case 'indication': this.indicationExpanded    = !this.indicationExpanded;   break;
      case 'parametres': this.parametresExpanded    = !this.parametresExpanded;   break;
    }
  }

  addIndicationTag(tag: string): void {
    this.clinicalIndication = this.clinicalIndication ? `${this.clinicalIndication}, ${tag}` : tag;
  }

  onSubmit(): void {
    if (!this.patientInfo.id) { alert('Veuillez sélectionner un patient.'); return; }
    if (!this.selectedExamType) { alert('Veuillez sélectionner un type d\'examen.'); return; }
    if (!this.selectedBodyRegion) { alert('Veuillez sélectionner une région anatomique.'); return; }
    if (!this.clinicalIndication.trim()) { alert('Veuillez renseigner l\'indication clinique.'); return; }

    const payload = {
      patientId:          this.patientInfo.id,
      patientName:        `${this.patientInfo.nom} ${this.patientInfo.prenom}`.trim() || undefined,
      patientInsurance:   this.patientInfo.assurance || undefined,
      doctorName:         this.doctorName || undefined,
      doctorSpecialty:    this.doctorSpecialty || undefined,
      examTypes:          [this.selectedExamType],
      bodyRegions:        [this.selectedBodyRegion],
      clinicalIndication: this.clinicalIndication.trim(),
      fasting:            this.fasting,
      urgency:            this.urgency,
    };

    this.submitting = true;
    this.http.post<any>(`${this.api}/diagnostic/imaging-orders`, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/doctor/patients'], { queryParams: { tab: 'imagerie' } });
      },
      error: (err) => {
        this.submitting = false;
        alert(err?.error?.message ?? 'Erreur lors de la création de la demande.');
      },
    });
  }

  isCustomExam(): boolean {
    return !!this.selectedExamType && !this.examTypes.some(t => t.value === this.selectedExamType);
  }

  addCustomExam(): void {
    const label = this.customExamLabel.trim();
    if (!label) return;
    this.selectedExamType      = label;
    this.showCustomExamInput   = false;
    this.customExamLabel       = '';
  }

  isCustomRegion(): boolean {
    return !!this.selectedBodyRegion && !this.bodyRegions.some(r => r.label === this.selectedBodyRegion);
  }

  addCustomRegion(): void {
    const label = this.customRegionLabel.trim();
    if (!label) return;
    this.selectedBodyRegion     = label;
    this.showCustomRegionInput  = false;
    this.customRegionLabel      = '';
  }

  goBack(): void   { this.viewMode = 'list'; }
  onCancel(): void { this.viewMode = 'list'; }
}
