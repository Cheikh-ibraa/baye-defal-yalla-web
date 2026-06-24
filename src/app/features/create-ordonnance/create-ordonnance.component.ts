import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, takeUntil } from 'rxjs/operators';
import { QRCodeComponent } from 'angularx-qrcode';
import { environment } from '../../../environments/environment';

interface StoredPatient {
  id: string;
  nom: string;
  initiales?: string;
  telephone?: string;
  age?: number;
  sexe?: string;
}

interface Medication {
  id: string;
  name: string;
  genericName: string;
  unitPrice: number;
  category: string;
  form: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QRCodeComponent],
  selector: 'app-create-ordonnance',
  templateUrl: './create-ordonnance.component.html',
  styleUrls: ['./create-ordonnance.component.css'],
})
export class CreateOrdonnanceComponent implements OnInit, OnDestroy {
  form: FormGroup;

  patientId: string | null = null;
  patientDisplayName = '';
  patientReference = '';
  patientAge: number | null = null;

  loading = false;
  errorMessage = '';

  // Modals
  showConfirmModal = false;
  showSuccessModal = false;
  showQrModal = false;

  // After creation
  createdReference = '';
  createdId = '';
  qrCodeData = '';

  // Autocomplete state per medication row
  suggestions: Medication[][] = [];
  showSuggestions: boolean[] = [];
  searchSubjects: Subject<{ i: number; q: string }>[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
  ) {
    this.form = this.fb.group({
      diagnostic: ['', Validators.required],
      needsHelp: [false],
      medicaments: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadPatient();
    this.ajouterMedicament();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubjects.forEach(s => s.complete());
  }

  private loadPatient(): void {
    const raw = localStorage.getItem('selectedPatient');
    const keycloakId = localStorage.getItem('selectedPatientId');
    if (!raw) return;

    try {
      const p: StoredPatient = JSON.parse(raw);
      this.patientId          = keycloakId || p.id || null;
      this.patientDisplayName = p.nom || '';
      this.patientReference   = p.id  || '';
      this.patientAge         = p.age ?? null;
    } catch {
      // ignore malformed
    }
  }

  private get authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private getDoctorInfo(): { id: string; name: string; specialty: string } {
    try {
      const token = localStorage.getItem('access_token') ?? '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      const firstName = payload.given_name || payload.firstName || '';
      const lastName  = payload.family_name || payload.lastName  || '';
      return {
        id:        payload.sub ?? '',
        name:      `Dr. ${firstName} ${lastName}`.trim(),
        specialty: payload.specialty ?? '',
      };
    } catch {
      return { id: '', name: '', specialty: '' };
    }
  }

  // ── Medications FormArray ──────────────────────────────────────────────────

  get medicaments(): FormArray {
    return this.form.get('medicaments') as FormArray;
  }

  private newMedicament(): FormGroup {
    return this.fb.group({
      medicationName: ['', Validators.required],
      dosage:         ['', Validators.required],
      quantity:       [1,  [Validators.required, Validators.min(1)]],
      duration:       ['', Validators.required],
      unitPrice:      [0,  [Validators.required, Validators.min(0)]],
    });
  }

  ajouterMedicament(): void {
    this.medicaments.push(this.newMedicament());
    this.suggestions.push([]);
    this.showSuggestions.push(false);

    const subject = new Subject<{ i: number; q: string }>();
    this.searchSubjects.push(subject);

    subject.pipe(
      debounceTime(250),
      distinctUntilChanged((a, b) => a.q === b.q),
      switchMap(({ i: idx, q }) =>
        this.http.get<Medication[]>(
          `${environment.baseUrl}/medications/search?q=${encodeURIComponent(q)}`,
          { headers: this.authHeaders },
        ).pipe(
          map(res => ({ idx, res })),
        ),
      ),
      takeUntil(this.destroy$),
    ).subscribe(({ idx, res }) => {
      this.suggestions[idx] = res;
      this.showSuggestions[idx] = res.length > 0;
    });
  }

  supprimerMedicament(i: number): void {
    if (this.medicaments.length > 1) {
      this.medicaments.removeAt(i);
      this.suggestions.splice(i, 1);
      this.showSuggestions.splice(i, 1);
      const subj = this.searchSubjects.splice(i, 1)[0];
      subj.complete();
    }
  }

  onMedicamentInput(i: number, event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    if (q.length >= 2) {
      this.searchSubjects[i].next({ i, q });
    } else {
      this.suggestions[i] = [];
      this.showSuggestions[i] = false;
    }
  }

  selectMedication(i: number, med: Medication): void {
    const row = this.medicaments.at(i);
    row.patchValue({
      medicationName: med.name,
      unitPrice: Number(med.unitPrice),
    });
    this.suggestions[i] = [];
    this.showSuggestions[i] = false;
  }

  hideSuggestions(i: number): void {
    setTimeout(() => { this.showSuggestions[i] = false; }, 200);
  }

  get totalAmount(): number {
    return this.medicaments.controls.reduce((sum, c) => {
      const qty   = Number(c.get('quantity')?.value)  || 0;
      const price = Number(c.get('unitPrice')?.value) || 0;
      return sum + qty * price;
    }, 0);
  }

  hasError(name: string): boolean {
    const c = this.form.get(name);
    return !!(c?.invalid && c.touched);
  }

  hasErrorMed(i: number, name: string): boolean {
    const c = this.medicaments.at(i).get(name);
    return !!(c?.invalid && c.touched);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  validerEtGenerer(): void {
    if (!this.patientId) {
      this.errorMessage = 'Aucun patient sélectionné. Revenez à la liste des patients.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.errorMessage = '';
    this.showConfirmModal = true;
  }

  confirmerGeneration(): void {
    this.showConfirmModal = false;
    this.loading = true;

    const val   = this.form.value;
    const doc   = this.getDoctorInfo();
    const items = val.medicaments.map((m: any) => ({
      medicationName: m.medicationName,
      dosage:         m.dosage,
      quantity:       Number(m.quantity),
      duration:       m.duration,
      unitPrice:      Number(m.unitPrice) || 0,
    }));

    const body = {
      patientId:          this.patientId,
      diagnosis:          val.diagnostic,
      items,
      totalEstimatedCost: this.totalAmount,
      consultationFee:    0,
      patientName:        this.patientDisplayName,
      patientAge:         this.patientAge ?? undefined,
      doctorName:         doc.name,
      doctorSpecialty:    doc.specialty,
    };

    this.http
      .post<any>(`${environment.baseUrl}/medical/prescriptions`, body, { headers: this.authHeaders })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.createdReference = res.reference ?? `ORD-${res.id?.slice(-4).toUpperCase()}` ?? 'ORD-????';
          this.createdId        = res.id ?? '';
          this.qrCodeData       = `${environment.baseUrl}/medical/prescriptions/${this.createdId}`;
          this.showSuccessModal = true;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.message ?? 'Erreur lors de la création de l\'ordonnance.';
        },
      });
  }

  ouvrirQrCode(): void {
    this.showSuccessModal = false;
    this.showQrModal = true;
  }

  fermerEtRediriger(): void {
    this.showSuccessModal = false;
    this.showQrModal = false;
    this.router.navigate(['/doctor/patients'], { queryParams: { tab: 'ordonnances' } });
  }

  partagerWhatsApp(): void {
    const text = encodeURIComponent(
      `Ordonnance ${this.createdReference} pour ${this.patientDisplayName}\n${this.qrCodeData}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  partagerGmail(): void {
    const subject = encodeURIComponent(`Ordonnance ${this.createdReference}`);
    const body    = encodeURIComponent(
      `Ordonnance ${this.createdReference} pour ${this.patientDisplayName}\n\nConsultez les détails : ${this.qrCodeData}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }

  enregistrerBrouillon(): void {
    const draft = {
      ...this.form.getRawValue(),
      patientId:   this.patientId,
      patientName: this.patientDisplayName,
      savedAt:     new Date().toISOString(),
    };
    localStorage.setItem('ordonnance_brouillon', JSON.stringify(draft));
  }

  annuler(): void {
    this.router.navigate(['/patients']);
  }
}
