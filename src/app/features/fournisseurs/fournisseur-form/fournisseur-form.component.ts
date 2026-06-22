import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-fournisseur-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseur-form.component.html',
})
export class FournisseurFormComponent {
  private readonly api = environment.baseUrl;

  form = {
    nom: '',
    responsable: '',
    email: '',
    telephone: '',
    adresse: '',
    typeProduits: '',
    isActive: true,
  };

  saving = false;
  saveError = '';

  constructor(private http: HttpClient, private router: Router) {}

  annuler(): void { this.router.navigate(['/admin/fournisseurs']); }

  enregistrer(): void {
    if (!this.form.nom.trim()) { this.saveError = 'Le nom du fournisseur est requis.'; return; }
    if (!this.form.email.trim()) { this.saveError = "L'email est requis."; return; }

    this.saving = true;
    this.saveError = '';

    const payload = {
      companyName:   this.form.nom,
      contactPerson: this.form.responsable,
      email:         this.form.email,
      phone:         this.form.telephone,
      address:       this.form.adresse,
      productType:   this.form.typeProduits,
      isActive:      this.form.isActive,
    };

    this.http.post(`${this.api}/auth/admin/register-supplier`, payload)
      .pipe(finalize(() => { this.saving = false; }))
      .subscribe({
        next:  () => this.router.navigate(['/admin/fournisseurs']),
        error: err => {
          const msg = err?.error?.message;
          this.saveError = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la création.');
        },
      });
  }
}
