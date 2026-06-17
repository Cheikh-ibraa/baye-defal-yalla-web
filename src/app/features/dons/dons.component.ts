import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


interface Donor {
  name: string;
  date: string;
  amount: string;
}

interface DonationItem {
  id: string;
  type: string;
  urgency: string;
  urgencyColor: string;
  urgencyBg: string;
  patientName: string;
  patientAge: number;
  indication: string;
  doctorName: string;
  doctorSpecialty: string;
  description: string;
  objectif: number;
  collected: number;
  percentage: number;
  progressColor: string;
  donors: Donor[];
  patientPhoto?: string;
  doctorPhoto?: string;
  docType?: 'photo' | 'pdf';
  docName?: string;
  docUrl?: string;
  choicesOption?: '100' | '100_50';
  contributionOptions?: number[];
  reference?: string;
  items?: { medicationName: string; dosage: string; quantity: number; duration: string; unitPrice: number }[];
}

@Component({
  selector: 'app-dons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dons.component.html'
})
export class DonsComponent implements OnInit, OnDestroy {

  filters = [
    { label: 'Tous',       value: 'all' },
    { label: 'Ordonnance', value: 'ORDONNANCE' },
    { label: 'Analyse',    value: 'ANALYSE' },
    { label: 'Imagerie',   value: 'IMAGERIE' }
  ];

  activeFilter = 'all';

  donations: DonationItem[] = [];
  filteredDonations: DonationItem[] = [];
  selectedDonation: DonationItem | null = null;
  showDonationModal = false;
  isLoadingDons = true;
  donsError: string | null = null;

  selectedContribution: '100' | '50' = '100';
  showDonorsList = true;

  showPrescription = false;

  paymentStep: 'idle' | 'success' | 'failed' = 'idle';
  paymentError: string | null = null;

  readonly today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.loadCampaigns();
    this.handlePaymentReturn();
    this.checkPendingPayment();
  }

  ngOnDestroy(): void {}

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  private loadCampaigns(type?: string): void {
    this.isLoadingDons = true;
    this.donsError = null;

    let url = `${environment.baseUrl}/campaigns?limit=20`;
    if (type && type !== 'all') url += `&type=${type}`;

    this.http.get<any>(url, { headers: this.authHeaders }).subscribe({
      next: (res) => {
        const raw: any[] = res.data ?? res ?? [];
        this.donations = raw.map(c => this.mapCampaign(c));
        this.filteredDonations = [...this.donations];
        this.isLoadingDons = false;
      },
      error: () => {
        this.donsError = null;
        this.donations = STATIC_DONATIONS;
        this.filteredDonations = [...this.donations];
        this.isLoadingDons = false;
      },
    });
  }

  private mapCampaign(c: any): DonationItem {
    const TYPE_LABEL: Record<string, string> = {
      ORDONNANCE:      'Ordonnance',
      ANALYSE:         'Analyse médicale',
      IMAGERIE:        'Imagerie médicale',
      HOSPITALISATION: 'Hospitalisation',
    };
    const URGENCY_LABEL: Record<string, string> = {
      URGENT: 'Urgent', MOYEN: 'Moyen', FAIBLE: 'Faible',
    };
    const URGENCY_BG: Record<string, string> = {
      URGENT: 'bg-[#E74C3C]', MOYEN: 'bg-[#F29900]', FAIBLE: 'bg-[#58D68D]',
    };

    const objectif  = Number(c.targetAmount ?? 0);
    const collected = Number(c.collectedAmount ?? 0);
    const pct       = objectif > 0 ? Math.min(100, Math.round((collected / objectif) * 100)) : 0;

    const donors: Donor[] = (c.contributions ?? []).map((ct: any) => ({
      name:   'Donateur',
      date:   new Date(ct.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      amount: `+${Number(ct.amount).toLocaleString('fr-FR')} FCFA`,
    }));

    const hasFile = !!c.prescriptionFileUrl;
    const isPdf   = hasFile && (c.prescriptionFileUrl as string).endsWith('.pdf');

    return {
      id:            c.id,
      type:          TYPE_LABEL[c.type] ?? c.type,
      urgency:       URGENCY_LABEL[c.urgency] ?? c.urgency,
      urgencyColor:  'text-white',
      urgencyBg:     URGENCY_BG[c.urgency] ?? 'bg-gray-400',
      patientName:   c.patientName ?? 'Patient',
      patientAge:    c.patientAge  ?? 0,
      indication:    c.treatment   ?? '',
      patientPhoto:  c.patientPhotoUrl ?? undefined,
      doctorPhoto:   c.doctorPhotoUrl  ?? undefined,
      doctorName:    c.doctorName  ?? '',
      doctorSpecialty: c.doctorSpecialty ?? '',
      description:   c.description ?? '',
      objectif,
      collected,
      percentage:    pct,
      progressColor: 'bg-[#2AB396]',
      donors,
      docType:       hasFile ? (isPdf ? 'pdf' : 'photo') : undefined,
      docUrl:        (!isPdf && hasFile) ? c.prescriptionFileUrl : undefined,
      docName:       isPdf ? c.prescriptionFileUrl?.split('/').pop() : undefined,
      choicesOption: c.urgency === 'URGENT' ? '100' : '100_50',
      contributionOptions: c.contributionOptions,
      reference: c.reference ?? null,
      items: Array.isArray(c.items) ? c.items : [],
    };
  }

  setFilter(value: string): void {
    this.activeFilter = value;
    this.loadCampaigns(value);
  }

  formatAmount(amount: number): string {
    return (amount ?? 0).toLocaleString('fr-FR');
  }

  trackByDon(_: number, don: DonationItem): string {
    return don.id;
  }

  // ── TouchPay payment flow (SDK JS frontend) ─────────────────────────────────

  /** Détecte le retour de redirection TouchPay (?payment=success|failed).
   *  La donation est déjà enregistrée côté backend via le callback TouchPay.
   *  Le frontend affiche juste la bannière de résultat. */
  private handlePaymentReturn(): void {
    const params    = this.route.snapshot.queryParamMap;
    const errorCode = params.get('errorCode');
    const reference = params.get('reference');

    if (!reference && !errorCode) return;

    if (errorCode === '200' && reference) {
      sessionStorage.removeItem('bdy_pending_ref');
      const transactionId = params.get('num_transaction_from_gu')
        ?? params.get('num_command') ?? '';
      this.http.post(
        `${environment.baseUrl}/payments/confirm`,
        { reference, transactionId },
        { headers: this.authHeaders },
      ).subscribe({
        next:  () => this.router.navigate(['/donor/dons-historique']),
        error: () => this.router.navigate(['/donor/dons-historique']),
      });
    } else if (errorCode && errorCode !== '200') {
      sessionStorage.removeItem('bdy_pending_ref');
      if (reference) {
        this.http.post(
          `${environment.baseUrl}/payments/cancel`,
          { reference },
          { headers: this.authHeaders },
        ).subscribe();
      }
      this.paymentStep = 'failed';
      setTimeout(() => { this.paymentStep = 'idle'; }, 8000);
    }
  }

  // Cas Wave / provider externe : l'utilisateur revient sur la page sans params URL.
  // On vérifie en backend si la transaction en attente a finalement été payée.
  private checkPendingPayment(): void {
    const params    = this.route.snapshot.queryParamMap;
    const errorCode = params.get('errorCode');
    const reference = params.get('reference');

    // Déjà géré par handlePaymentReturn()
    if (errorCode || reference) return;

    const pendingRef = sessionStorage.getItem('bdy_pending_ref');
    if (!pendingRef) return;

    this.http.get<{ status: string; reference: string }>(
      `${environment.baseUrl}/payments/status/${encodeURIComponent(pendingRef)}`,
      { headers: this.authHeaders },
    ).subscribe({
      next: ({ status }) => {
        sessionStorage.removeItem('bdy_pending_ref');
        if (status === 'SUCCESS') {
          this.router.navigate(['/donor/dons-historique']);
        }
        // PENDING ou FAILED → on reste sur la page, rien à faire
      },
      error: () => sessionStorage.removeItem('bdy_pending_ref'),
    });
  }

  get paymentAmount(): number {
    if (!this.selectedDonation) return 0;
    const remaining = this.selectedDonation.objectif - this.selectedDonation.collected;
    return this.selectedContribution === '100' ? remaining : Math.round(remaining / 2);
  }

  confirmAndPay(): void {
    this.paymentError = null;

    if (!this.selectedDonation) return;

    const amount = this.paymentAmount;
    if (amount <= 0) {
      this.paymentError = 'Ce don est déjà entièrement financé.';
      return;
    }

    const campaignId = this.selectedDonation.id;
    const returnUrl  = `${window.location.origin}/donor/dons`;

    this.http.post<{ transactionId: string; paymentUrl: string }>(
      `${environment.baseUrl}/payments/initiate`,
      { campaignId, amount, returnUrl },
      { headers: this.authHeaders },
    ).subscribe({
      next: ({ transactionId, paymentUrl }) => {
        sessionStorage.setItem('bdy_pending_ref', transactionId);
        window.location.href = paymentUrl;
      },
      error: () => {
        this.paymentError = 'Erreur lors de la préparation du paiement. Réessayez.';
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  openDonationDetail(donationId: string): void {
    this.paymentStep = 'idle';
    this.paymentError = null;
    this.showPrescription = false;
    this.selectedContribution = '100';
    this.showDonorsList = true;

    this.http.get<any>(`${environment.baseUrl}/campaigns/${donationId}`, { headers: this.authHeaders }).subscribe({
      next: (c) => {
        this.selectedDonation = this.mapCampaign(c);
        this.showDonationModal = true;
      },
      error: () => {
        this.selectedDonation = this.donations.find(d => d.id === donationId) || null;
        if (this.selectedDonation) this.showDonationModal = true;
      },
    });
  }

  closeDonationDetail(): void {
    this.paymentStep = 'idle';
    this.showDonationModal = false;
    setTimeout(() => { this.selectedDonation = null; }, 300);
  }

  selectContributionOption(option: '100' | '50'): void {
    this.selectedContribution = option;
  }

  toggleDonorsList(): void {
    this.showDonorsList = !this.showDonorsList;
  }

}

// Fallback static data (used if API unreachable)
const STATIC_DONATIONS: DonationItem[] = [
  {
    id: '1',
    type: 'Ordonnance',
    urgency: 'Urgent',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#E74C3C]',
    patientName: 'Mamadou Sow',
    patientAge: 65,
    indication: 'Traitement hypertension',
    doctorName: 'Dr. Awa Cisse',
    doctorSpecialty: 'Généraliste',
    description: 'Ordonnance pour hypertension nécessitant traitement continu.',
    objectif: 300000,
    collected: 0,
    percentage: 0,
    progressColor: 'bg-[#2AB396]',
    docType: 'photo',
    docUrl: 'assets/images/img-ordinance.png',
    choicesOption: '100',
    donors: []
  },
  {
    id: '2',
    type: 'Analyse médicale',
    urgency: 'Moyen',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#F29900]',
    patientName: 'Seydou Diop',
    patientAge: 35,
    indication: 'Analyse sanguine',
    doctorName: 'Dr. Mamadou Sarr',
    doctorSpecialty: 'Généraliste',
    description: 'Le patient nécessite un bilan sanguin complet pour confirmer le diagnostic.',
    objectif: 50000,
    collected: 16500,
    percentage: 33,
    progressColor: 'bg-[#2AB396]',
    docType: 'pdf',
    docName: 'bilan_sanguin.pdf',
    choicesOption: '100_50',
    donors: [
      { name: 'Aminata Fall', date: '10 février 2026', amount: '+4 000 FCFA' },
      { name: 'Anonyme',     date: '11 février 2026', amount: '+3 000 FCFA' }
    ]
  },
  {
    id: '3',
    type: 'Imagerie médicale',
    urgency: 'Urgent',
    urgencyColor: 'text-white',
    urgencyBg: 'bg-[#E74C3C]',
    patientName: 'Awa Cisse',
    patientAge: 43,
    indication: 'Radiographie pulmonaire',
    doctorName: 'Dr. Mamadou Sarr',
    doctorSpecialty: 'Cardiologue',
    description: 'Imagerie médicale pour diagnostic chez une patiente présentant des douleurs thoraciques.',
    objectif: 800000,
    collected: 200000,
    percentage: 25,
    progressColor: 'bg-[#2AB396]',
    docType: 'pdf',
    docName: 'prescription_Radio.pdf',
    choicesOption: '100_50',
    donors: [
      { name: 'Moussa Ndiaye', date: '06 février 2026', amount: '+200 000 FCFA' }
    ]
  },
];
