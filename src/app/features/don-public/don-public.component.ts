import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FactureProgression } from '../../core/services/hospital-facturation.service';

@Component({
  selector: 'app-don-public',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './don-public.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonPublicComponent implements OnInit, OnDestroy {
  private readonly http   = inject(HttpClient);
  private readonly route  = inject(ActivatedRoute);
  private readonly cdr    = inject(ChangeDetectorRef);

  loading      = true;
  progression?: FactureProgression;
  notFound     = false;
  private pollSub?: Subscription;

  get id(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  ngOnInit(): void {
    this.http.get<FactureProgression>(`${environment.baseUrl}/hospital/factures/${this.id}/progression`)
      .pipe(catchError(() => of(null)))
      .subscribe(p => {
        if (!p) this.notFound = true;
        else {
          this.progression = p;
          if (p.statut !== 'CLOTUREE') this.startPolling();
        }
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void { this.pollSub?.unsubscribe(); }

  private startPolling(): void {
    this.pollSub = interval(10000).pipe(
      switchMap(() => this.http.get<FactureProgression>(
        `${environment.baseUrl}/hospital/factures/${this.id}/progression`
      ).pipe(catchError(() => of(null))))
    ).subscribe(p => {
      if (p) { this.progression = p; this.cdr.markForCheck(); }
    });
  }

  fmt(n: number): string { return Number(n).toLocaleString('fr-FR'); }
}
