import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-detail-devis-fournisseur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-devis-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailDevisFournisseurComponent implements OnInit {
  isLoading = true;
  error = '';
  devisDetail: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load(id);
  }

  private get headers() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  load(id: string): void {
    this.http.get<any>(`${environment.baseUrl}/supplier/quotes/${id}`, {
      headers: this.headers,
    }).subscribe({
      next: (quote) => {
        this.devisDetail = this.mapQuote(quote);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger ce devis.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapQuote(q: any): any {
    const subtotal = (q.items ?? []).reduce(
      (s: number, i: any) => s + (i.quantity || 0) * (i.unitPrice || 0), 0
    );
    const discount = Math.round(subtotal * 0.05);
    const tva      = Math.round(subtotal * 0.18);
    const total    = subtotal - discount + tva + (q.shippingCost || 0);

    return {
      id:               q.id,
      reference:        q.reference,
      hopitalName:      q.institutionName ?? q.request?.institutionName ?? '–',
      departement:      q.request?.departmentName ?? '–',
      categorie:        q.request?.title ?? q.request?.needType ?? 'Équipement médical',
      status:           this.getStatusLabel(q.status ?? (q.isDraft ? 'DRAFT' : 'PENDING')),
      statusRaw:        q.status ?? (q.isDraft ? 'DRAFT' : 'PENDING'),
      valableJusquAu:   this.addDays(q.createdAt, q.deliveryDays ?? 30),
      conditionsPaiement: 'Net 30 Jours',
      gestionnaire:     q.supplierName ?? '–',
      devise:           'FCFA',
      products:         (q.items ?? []).map((i: any) => ({
        name:      i.designation ?? i.articleName ?? '–',
        unit:      i.model ?? '–',
        qty:       i.quantity,
        unitPrice: (i.unitPrice ?? 0).toLocaleString('fr-FR'),
        total:     ((i.quantity || 0) * (i.unitPrice || 0)).toLocaleString('fr-FR'),
      })),
      sousTotal:    subtotal.toLocaleString('fr-FR'),
      remise:       { label: 'Remise Médicale (5%)', amount: '- ' + discount.toLocaleString('fr-FR') },
      tva:          tva.toLocaleString('fr-FR'),
      montantTotal: total.toLocaleString('fr-FR'),
      notesInternes: q.additionalNotes ?? '',
      timeline: this.buildTimeline(q),
    };
  }

  private buildTimeline(q: any): any[] {
    const tl: any[] = [
      { title: 'Devis créé', time: this.formatDate(q.createdAt), description: `Par ${q.supplierName ?? '–'}`, iconType: 'check' },
    ];
    if (!q.isDraft) {
      tl.push({ title: "Envoyé à l'hôpital", time: this.formatDate(q.updatedAt ?? q.createdAt), description: '', iconType: 'plane' });
    }
    if (q.status === 'ACCEPTED') {
      tl.push({ title: 'Retenu', time: 'Commande en cours', description: '', iconType: 'success' });
    } else if (q.status === 'REJECTED') {
      tl.push({ title: 'Non retenu', time: this.formatDate(q.updatedAt), description: '', iconType: 'check' });
    }
    return tl;
  }

  private addDays(dateStr: string, days: number): string {
    if (!dateStr) return '–';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private formatDate(d: string): string {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Retenu':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'En attente': return 'bg-[#DBEAFE] text-[#104382]';
      case 'Non retenu': return 'bg-[#FCE8E6] text-[#C5221F]';
      case 'Brouillon':  return 'bg-[#F1F3F5] text-[#4E5166]';
      default:           return 'bg-slate-100 text-slate-600';
    }
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'ACCEPTED': return 'Retenu';
      case 'PENDING':  return 'En attente';
      case 'REJECTED': return 'Non retenu';
      case 'DRAFT':    return 'Brouillon';
      default:         return status;
    }
  }

  back(): void {
    this.router.navigate(['/fournisseur/devis']);
  }
}
