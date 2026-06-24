import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

const CATEGORIES = [
  'Hématologie', 'Biochimie', 'Hormonologie', 'Sérologie',
  'Microbiologie', 'Urines', 'Coagulation', 'Autres examens'
];

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
  selector: 'app-analyses-medical',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analyses-medical.component.html',
  styleUrl: './analyses-medical.component.css'
})
export class AnalysesMedicalComponent implements OnInit {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private api    = environment.baseUrl;

  // ── vue ──────────────────────────────────────────────────────────────────
  viewMode: 'list' | 'detail' | 'create' = 'list';
  selectedOrder: any = null;

  // ── liste ─────────────────────────────────────────────────────────────────
  labOrders: any[] = [];
  loadingList = false;
  listError   = '';

  // ── recherche & pagination ─────────────────────────────────────────────────
  searchQuery  = '';
  currentPage  = 1;
  readonly pageSize = 10;

  // ── sections collapse (form) ──────────────────────────────────────────────
  patientInfoExpanded  = true;
  examensExpanded      = true;
  indicationExpanded   = true;
  parametresExpanded   = true;

  // ── patient ───────────────────────────────────────────────────────────────
  patientId        = '';
  patientReference = '';
  patientName      = '';
  patientInsurance = '';

  patientSearch        = '';
  patientSearchResults: any[] = [];
  patientSearchLoading = false;

  // ── form ───────────────────────────────────────────────────────────────────
  categories      = CATEGORIES;
  selectedCats    = new Set<string>();
  clinicalIndication = '';
  fasting         = true;
  urgency: 'NORMAL' | 'PRIORITY' | 'URGENT' = 'NORMAL';
  indicationsPredefinies = ['Suspicion diabète', 'Suivi traitement HTA', 'Bilan préopératoire'];
  isSaving = false;

  get selectedCatsList(): string[] { return [...this.selectedCats]; }

  // ── pagination computed ────────────────────────────────────────────────────
  get filteredOrders(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.labOrders;
    return this.labOrders.filter(o =>
      o.labOrderRef?.toLowerCase().includes(q) ||
      o.patientName?.toLowerCase().includes(q) ||
      (o.categories ?? []).join(' ').toLowerCase().includes(q) ||
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

  urgencyLabel(u: string): string {
    return u === 'URGENT' ? 'Urgent' : u === 'PRIORITY' ? 'Prioritaire' : 'Normal';
  }

  ngOnInit(): void {
    this.loadList();
    if (localStorage.getItem('openCreateMode') === '1') {
      localStorage.removeItem('openCreateMode');
      if (localStorage.getItem('selectedPatient')) {
        this.openCreate();
      }
    }
  }

  // ── liste ──────────────────────────────────────────────────────────────────

  loadList(): void {
    this.loadingList = true;
    this.listError   = '';
    this.http.get<any>(`${this.api}/diagnostic/lab-orders/doctor`).subscribe({
      next: (data) => {
        this.labOrders = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingList = false;
      },
      error: () => { this.listError = 'Impossible de charger les analyses.'; this.loadingList = false; }
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
    const cats = (o.categories ?? []).join(', ') || '—';
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—';
    const rdv  = o.appointmentDate ? new Date(o.appointmentDate).toLocaleDateString('fr-FR') : '—';
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Demande d'analyses — ${o.labOrderRef ?? ''}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#222;font-size:14px}
  h1{color:#104382;border-bottom:2px solid #104382;padding-bottom:8px}
  h2{color:#104382;font-size:15px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:16px}
  .field label{font-weight:600;color:#555;font-size:12px}
  .field p{margin:2px 0 0;font-size:14px}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600}
  .URGENT{background:#fee2e2;color:#b91c1c}
  .PRIORITY{background:#ffedd5;color:#c2410c}
  .NORMAL{background:#f3f4f6;color:#374151}
  @media print{body{margin:20px}}
</style></head><body>
<h1>Demande d'analyses biologiques</h1>
<p style="color:#555;font-size:13px">Référence : <strong>${o.labOrderRef ?? '—'}</strong> &nbsp;|&nbsp; Date : <strong>${date}</strong></p>
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
<h2>Analyses prescrites</h2>
<div class="grid">
  <div class="field"><label>Catégories</label><p>${cats}</p></div>
  <div class="field"><label>Indication clinique</label><p>${o.clinicalIndication ?? '—'}</p></div>
  <div class="field"><label>À jeun</label><p>${o.fasting ? 'Oui' : 'Non'}</p></div>
  <div class="field"><label>Urgence</label><p><span class="badge ${o.urgency}">${urgLabel}</span></p></div>
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

  // ── form ───────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.loadPatientFromStorage();
    this.selectedCats.clear();
    this.clinicalIndication = '';
    this.fasting = true;
    this.urgency = 'NORMAL';
    this.viewMode = 'create';
  }

  private loadPatientFromStorage(): void {
    const stored = localStorage.getItem('selectedPatient');
    this.patientId = localStorage.getItem('selectedPatientId') ?? '';
    if (stored) {
      const p = JSON.parse(stored);
      this.patientName      = `${p.prenom ?? p.firstName ?? ''} ${p.nom ?? p.lastName ?? ''}`.trim();
      this.patientReference = p.id ?? '';
      this.patientSearch    = this.patientName;
    }
    if (this.patientId) {
      this.http.get<any>(`${this.api}/users/${this.patientId}`).subscribe({
        next: (user) => { this.patientInsurance = user?.patientProfile?.insurance ?? ''; }
      });
    }
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
    this.patientId        = p.keycloakId ?? p.id ?? '';
    this.patientName      = `${p.firstName ?? p.prenom ?? ''} ${p.lastName ?? p.nom ?? ''}`.trim();
    this.patientInsurance = p.patientProfile?.insurance ?? p.assurance ?? '';
    this.patientSearch    = this.patientName;
    this.patientSearchResults = [];
    localStorage.setItem('selectedPatient', JSON.stringify({ id: this.patientId, nom: this.patientName }));
    localStorage.setItem('selectedPatientId', this.patientId);
  }

  toggleCategory(cat: string): void {
    if (this.selectedCats.has(cat)) this.selectedCats.delete(cat);
    else                            this.selectedCats.add(cat);
  }

  addIndicationTag(tag: string): void {
    this.clinicalIndication = this.clinicalIndication ? `${this.clinicalIndication}, ${tag}` : tag;
  }

  toggleSection(s: string): void {
    if (s === 'patient')    this.patientInfoExpanded  = !this.patientInfoExpanded;
    if (s === 'examens')    this.examensExpanded      = !this.examensExpanded;
    if (s === 'indication') this.indicationExpanded   = !this.indicationExpanded;
    if (s === 'parametres') this.parametresExpanded   = !this.parametresExpanded;
  }

  onSubmit(): void {
    if (!this.patientId) {
      Swal.fire({ title: 'Patient non sélectionné', text: 'Recherchez et sélectionnez un patient.', icon: 'error', confirmButtonColor: '#104382', width: '400px' });
      return;
    }
    if (this.selectedCats.size === 0) {
      Swal.fire({ title: 'Examens manquants', text: 'Sélectionnez au moins un type d\'examen.', icon: 'warning', confirmButtonColor: '#104382', width: '400px' });
      return;
    }
    const payload = {
      patientId:          this.patientId,
      categories:         [...this.selectedCats],
      clinicalIndication: this.clinicalIndication || undefined,
      fasting:            this.fasting,
      urgency:            this.urgency,
      patientInsurance:   this.patientInsurance || undefined,
    };
    this.isSaving = true;
    this.http.post(`${this.api}/diagnostic/lab-orders`, payload).subscribe({
      next: () => {
        this.isSaving = false;
        Swal.fire({
          title: 'Demande envoyée !',
          text: 'La demande d\'analyses a été créée.',
          icon: 'success', confirmButtonColor: '#104382', confirmButtonText: 'OK', width: '420px'
        }).then(() => {
          this.router.navigate(['/doctor/patients'], { queryParams: { tab: 'examens' } });
        });
      },
      error: (err) => {
        this.isSaving = false;
        Swal.fire({ title: 'Erreur', text: err?.error?.message ?? 'Erreur lors de la création.', icon: 'error', confirmButtonColor: '#104382', width: '400px' });
      }
    });
  }

  goBack(): void { this.viewMode = 'list'; }
}
