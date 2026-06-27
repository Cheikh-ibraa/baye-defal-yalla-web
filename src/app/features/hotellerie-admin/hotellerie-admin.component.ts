import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NiveauHotellerie } from '../../core/services/hospital-facturation.service';

@Component({
  selector: 'app-hotellerie-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotellerie-admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotellerieAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr  = inject(ChangeDetectorRef);
  private readonly api  = `${environment.baseUrl}/hotellerie/niveaux`;

  loading  = true;
  niveaux: NiveauHotellerie[] = [];

  // Modal édition / création
  showModal  = false;
  isNew      = false;
  saving     = false;
  modalError = '';
  form: Partial<NiveauHotellerie> = {};

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<NiveauHotellerie[]>(`${this.api}/all`)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.niveaux = data.sort((a, b) => a.ordre - b.ordre);
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  openCreate(): void {
    this.isNew = true;
    this.form  = { libelle: '', typeChambre: '', prixHotellerieJ: 0, prixSoinsJ: 0, ordre: this.niveaux.length + 1 };
    this.modalError = '';
    this.showModal  = true;
    this.cdr.markForCheck();
  }

  openEdit(n: NiveauHotellerie): void {
    this.isNew = false;
    this.form  = { ...n };
    this.modalError = '';
    this.showModal  = true;
    this.cdr.markForCheck();
  }

  closeModal(): void { this.showModal = false; this.cdr.markForCheck(); }

  save(): void {
    if (!this.form.libelle?.trim())    { this.modalError = 'Le libellé est requis.'; this.cdr.markForCheck(); return; }
    if (!this.form.typeChambre?.trim()){ this.modalError = 'Le type de chambre est requis.'; this.cdr.markForCheck(); return; }
    if (!this.form.prixHotellerieJ || this.form.prixHotellerieJ <= 0) { this.modalError = 'Prix hôtellerie/j invalide.'; this.cdr.markForCheck(); return; }
    if (!this.form.prixSoinsJ     || this.form.prixSoinsJ     <= 0) { this.modalError = 'Prix soins/j invalide.'; this.cdr.markForCheck(); return; }

    this.saving = true;
    this.modalError = '';
    const req$ = this.isNew
      ? this.http.post<NiveauHotellerie>(this.api, this.form)
      : this.http.put<NiveauHotellerie>(`${this.api}/${this.form.id}`, this.form);

    req$.subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); },
      error: (err) => {
        this.saving = false;
        this.modalError = err?.error?.message ?? 'Erreur lors de la sauvegarde.';
        this.cdr.markForCheck();
      },
    });
  }

  toggle(n: NiveauHotellerie): void {
    this.http.patch(`${this.api}/${n.id}/toggle`, {}).subscribe({ next: () => this.load() });
  }

  fmt(v: number): string { return Number(v).toLocaleString('fr-FR'); }
}
