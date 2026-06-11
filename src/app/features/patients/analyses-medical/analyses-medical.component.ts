import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

const CATEGORIES = [
  'Hématologie', 'Biochimie', 'Hormonologie', 'Sérologie',
  'Microbiologie', 'Urines', 'Coagulation', 'Autres examens'
];

@Component({
  selector: 'app-analyses-medical',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analyses-medical.component.html',
  styleUrl: './analyses-medical.component.css'
})
export class AnalysesMedicalComponent implements OnInit {
  private router = inject(Router);
  private http   = inject(HttpClient);
  private api    = environment.baseUrl;

  // ── sections collapse ──────────────────────────────────────────────────────
  patientInfoExpanded  = true;
  examensExpanded      = true;
  indicationExpanded   = true;
  parametresExpanded   = true;

  // ── patient (read-only) ────────────────────────────────────────────────────
  patientId        = '';
  patientReference = '';
  patientName      = '';
  patientInsurance = '';

  // ── form ───────────────────────────────────────────────────────────────────
  categories      = CATEGORIES;
  selectedCats    = new Set<string>();
  clinicalIndication = '';
  fasting         = true;
  urgency: 'NORMAL' | 'PRIORITY' | 'URGENT' = 'NORMAL';

  indicationsPredefinies = ['Suspicion diabète', 'Suivi traitement HTA', 'Bilan préopératoire'];

  isSaving = false;

  get selectedCatsList(): string[] { return [...this.selectedCats]; }

  ngOnInit(): void {
    this.loadPatientFromStorage();
  }

  private loadPatientFromStorage(): void {
    const stored = localStorage.getItem('selectedPatient');
    this.patientId = localStorage.getItem('selectedPatientId') ?? '';

    if (stored) {
      const p = JSON.parse(stored);
      this.patientName      = p.nom || '';
      this.patientReference = p.id  || '';
    }

    // Récupérer l'assurance depuis le profil patient
    if (this.patientId) {
      this.http.get<any>(`${this.api}/users/${this.patientId}`).subscribe({
        next: (user) => {
          this.patientInsurance = user?.patientProfile?.insurance ?? '';
        }
      });
    }
  }

  toggleCategory(cat: string): void {
    if (this.selectedCats.has(cat)) {
      this.selectedCats.delete(cat);
    } else {
      this.selectedCats.add(cat);
    }
  }

  addIndicationTag(tag: string): void {
    this.clinicalIndication = this.clinicalIndication
      ? `${this.clinicalIndication}, ${tag}`
      : tag;
  }

  toggleSection(s: string): void {
    if (s === 'patient')    this.patientInfoExpanded  = !this.patientInfoExpanded;
    if (s === 'examens')    this.examensExpanded      = !this.examensExpanded;
    if (s === 'indication') this.indicationExpanded   = !this.indicationExpanded;
    if (s === 'parametres') this.parametresExpanded   = !this.parametresExpanded;
  }

  onSubmit(): void {
    if (!this.patientId) {
      Swal.fire({ title: 'Patient non sélectionné', text: 'Retournez à la liste des patients et sélectionnez un patient.', icon: 'error', confirmButtonColor: '#104382', width: '400px' });
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
          text: 'La demande d\'analyses a été créée. Le laboratoire le plus proche va prendre en charge.',
          icon: 'success',
          confirmButtonColor: '#104382',
          confirmButtonText: 'OK',
          width: '420px'
        }).then(() => this.router.navigate(['/doctor/patients']));
      },
      error: (err) => {
        this.isSaving = false;
        Swal.fire({ title: 'Erreur', text: err?.error?.message ?? 'Erreur lors de la création de la demande.', icon: 'error', confirmButtonColor: '#104382', width: '400px' });
      }
    });
  }

  goBack(): void { this.router.navigate(['/doctor/patients']); }
}
