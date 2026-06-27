import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  HospitalFacturationService, Facture, FactureProgression,
} from '../../../core/services/hospital-facturation.service';

@Component({
  selector: 'app-detail-facture',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-facture.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailFactureComponent implements OnInit, OnDestroy {
  private readonly svc    = inject(HospitalFacturationService);
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr    = inject(ChangeDetectorRef);

  loading      = true;
  facture?: Facture;
  progression?: FactureProgression;
  private pollSub?: Subscription;

  // Clôture
  showCloture = false;
  nbJoursReels = 1;
  cloturing    = false;
  cloturreError = '';

  get id(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  ngOnInit(): void { this.load(); }

  ngOnDestroy(): void { this.pollSub?.unsubscribe(); }

  private load(): void {
    this.svc.getFacture(this.id).pipe(catchError(() => of(null))).subscribe(f => {
      if (f) {
        this.facture = f;
        this.nbJoursReels = f.nbJoursEstimes;
        this.loadProgression();
        if (f.statut !== 'CLOTUREE' && f.statut !== 'BROUILLON') this.startPolling();
      }
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  private loadProgression(): void {
    this.svc.getProgression(this.id).pipe(catchError(() => of(null))).subscribe(p => {
      if (p) this.progression = p;
      this.cdr.markForCheck();
    });
  }

  private startPolling(): void {
    this.pollSub = interval(10000).pipe(
      switchMap(() => this.svc.getProgression(this.id).pipe(catchError(() => of(null))))
    ).subscribe(p => {
      if (p) { this.progression = p; this.cdr.markForCheck(); }
    });
  }

  cloturer(): void {
    if (this.nbJoursReels < 1) { this.cloturreError = 'Durée réelle ≥ 1 jour.'; this.cdr.markForCheck(); return; }
    this.cloturing = true;
    this.cloturreError = '';
    this.svc.cloturerFacture(this.id, this.nbJoursReels).subscribe({
      next: (f) => {
        this.facture    = f;
        this.cloturing  = false;
        this.showCloture = false;
        this.pollSub?.unsubscribe();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cloturing = false;
        this.cloturreError = err?.error?.message ?? 'Erreur lors de la clôture.';
        this.cdr.markForCheck();
      },
    });
  }

  copyLink(): void {
    if (this.progression?.lienDon) navigator.clipboard.writeText(this.progression.lienDon);
  }

  goBack(): void { this.router.navigate(['/hospital/factures']); }

  fmt(n: number): string { return Number(n).toLocaleString('fr-FR'); }
  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statutClass(s: string): string {
    const map: Record<string, string> = {
      OUVERTE:             'bg-[#EEF4FF] text-[#104382]',
      CAUTION_ATTEINTE:    'bg-[#FFF3E8] text-[#F97316]',
      PARTIELLEMENT_PAYEE: 'bg-[#FEF9C3] text-[#92400E]',
      SOLDEE:              'bg-[#E8F5E9] text-[#2E7D32]',
      CLOTUREE:            'bg-gray-100 text-gray-400',
    };
    return map[s] ?? 'bg-gray-100 text-gray-500';
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      BROUILLON: 'Brouillon', OUVERTE: 'Ouverte', CAUTION_ATTEINTE: 'Caution atteinte',
      PARTIELLEMENT_PAYEE: 'Partielle', SOLDEE: 'Soldée', CLOTUREE: 'Clôturée',
    };
    return map[s] ?? s;
  }
}
