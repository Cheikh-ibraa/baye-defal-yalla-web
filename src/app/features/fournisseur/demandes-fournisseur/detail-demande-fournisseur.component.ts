import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface DevisItem {
  designation: string;
  model:        string;
  quantity:     number;
  unitPrice:    number;
}

@Component({
  selector: 'app-detail-demande-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-demande-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailDemandeFournisseurComponent implements OnInit {

  isLoading = true;
  error = '';
  request: any = null;
  myQuote: any = null;
  actualBudget: number = 0;

  // Formulaire devis
  isEmettreDevisMode = false;
  isSending = false;
  devisError = '';
  devisSuccess = false;

  devisItems: DevisItem[] = [];
  devisDelaiJours: number | null = null;
  devisGarantie = '24 mois';
  devisNotes = '';
  devisShipping = 0;
  devisIsDraft = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load(id);
  }

  private get id(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  private get headers() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  private getSupplierName(): string {
    try {
      const token = localStorage.getItem('access_token') ?? '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name ?? payload.preferred_username ?? 'Fournisseur';
    } catch { return 'Fournisseur'; }
  }

  load(id: string): void {
    this.isLoading = true;
    this.error = '';

    this.http.get<any>(`${environment.baseUrl}/supplier/requests/${id}`, {
      headers: this.headers,
    }).subscribe({
      next: (res) => {
        this.request = res;
        this.myQuote = res.myQuote ?? null;
        
        // Calculer le budget réel basé sur les devis reçus
        if (res.quotes && res.quotes.length > 0) {
          const prices = res.quotes.map((q: any) => q.totalPrice).filter((p: number) => p > 0);
          this.actualBudget = prices.length > 0 ? Math.min(...prices) : res.estimatedBudget;
        } else {
          this.actualBudget = res.estimatedBudget;
        }
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger cette demande.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Devis ─────────────────────────────────────────────────────────────────────

  openDevisMode(): void {
    this.devisError = '';
    this.devisSuccess = false;
    this.devisItems = (this.request?.items ?? []).map((item: any) => ({
      designation: item.articleName ?? '',
      model:       item.reference   ?? '',
      quantity:    item.quantity    ?? 1,
      unitPrice:   0,
    }));
    if (this.devisItems.length === 0) {
      this.devisItems.push({ designation: '', model: '', quantity: 1, unitPrice: 0 });
    }
    this.devisDelaiJours = null;
    this.devisGarantie   = '24 mois';
    this.devisNotes      = '';
    this.devisShipping   = 0;
    this.isEmettreDevisMode = true;
    this.cdr.markForCheck();
  }

  closeDevisMode(): void {
    this.isEmettreDevisMode = false;
    this.cdr.markForCheck();
  }

  addDevisItem(): void {
    this.devisItems.push({ designation: '', model: '', quantity: 1, unitPrice: 0 });
    this.cdr.markForCheck();
  }

  removeDevisItem(index: number): void {
    this.devisItems.splice(index, 1);
    this.cdr.markForCheck();
  }

  get subtotalHT(): number {
    return this.devisItems.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
  }

  get medicalDiscount(): number {
    return Math.round(this.subtotalHT * 0.05);
  }

  get tvaAmount(): number {
    return Math.round(this.subtotalHT * 0.18);
  }

  get totalTTC(): number {
    return this.subtotalHT - this.medicalDiscount + this.tvaAmount + (this.devisShipping || 0);
  }

  sendDevis(isDraft: boolean): void {
    this.devisError = '';
    if (this.devisItems.some(i => !i.designation.trim() || i.unitPrice <= 0)) {
      this.devisError = 'Veuillez renseigner la désignation et le prix unitaire pour chaque produit.';
      this.cdr.markForCheck();
      return;
    }

    this.isSending = true;
    const body: any = {
      supplierName: this.getSupplierName(),
      items:        this.devisItems.map(i => ({
        designation: i.designation,
        model:       i.model,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
      })),
      guarantee:    this.devisGarantie || undefined,
      shippingCost: this.devisShipping || 0,
      isDraft,
    };
    if (this.devisNotes)      body.additionalNotes = this.devisNotes;
    if (this.devisDelaiJours) body.deliveryDays    = this.devisDelaiJours;

    this.http.post<any>(
      `${environment.baseUrl}/supplier/requests/${this.id}/quotes`,
      body,
      { headers: this.headers },
    ).subscribe({
      next: (quote) => {
        this.myQuote         = quote;
        this.isSending       = false;
        this.devisSuccess    = true;
        this.isEmettreDevisMode = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isSending = false;
        const msg = err?.error?.message;
        this.devisError = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de l\'envoi du devis.');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers d'affichage ───────────────────────────────────────────────────────

  urgenceBadgeClass(level: string): string {
    return level === 'URGENT'
      ? 'bg-[#FCE8E6] text-[#C5221F]'
      : 'bg-[#F1F3F5] text-[#4E5166]';
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'VALIDÉ':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'EN_ATTENTE': return 'bg-[#DBEAFE] text-[#104382]';
      case 'URGENT':     return 'bg-[#FCE8E6] text-[#C5221F]';
      default:           return 'bg-[#F1F3F5] text-[#4E5166]';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { EN_ATTENTE: 'En attente', VALIDÉ: 'Validé', URGENT: 'Urgent' };
    return map[status] ?? status;
  }

  formatDate(d: string): string {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR');
  }

  back(): void {
    if (this.isEmettreDevisMode) {
      this.closeDevisMode();
    } else {
      this.router.navigate(['/fournisseur/demandes']);
    }
  }

  getLocationDisplayName(address: any): string {
    return address?.commune || address?.region || 'Lieu de livraison';
  }

  getGoogleMapsUrl(address: any): string {
    const commune = address?.commune || '';
    const departement = address?.departement || '';
    const region = address?.region || 'Dakar';
    
    const query = `${commune} ${departement} ${region} Sénégal`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
}