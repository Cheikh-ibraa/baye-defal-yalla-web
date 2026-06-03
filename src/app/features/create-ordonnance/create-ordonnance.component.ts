import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, delay } from 'rxjs/operators';
// Inlined ordonnance types
interface Medication {
  id?: number;
  name: string;
  quantity: number;
  dosage: string;
  price: number;
}

interface SaveOrdonnanceRequest {
  doctorId: number;
  patientId: number;
  medications: string;
  needsHelp: boolean;
  pharmacyId: number;
  address: string;
  latitude: number;
  longitude: number;
  prescriptionFile?: File;
}

interface PatientByReference {
  id: number;
  reference: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adress: string;
  lat: number;
  lon: number;
  profil: string;
  pharmacyId: number;
}
// AuthFacade removed — using local mock stores for static UI

// Local PharmacySearchResult type (inlined from pharmacie.service)
interface PharmacySearchResult {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: string;
  distance?: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-create-ordonnance',
  templateUrl: './create-ordonnance.component.html',
  styleUrls: ['./create-ordonnance.component.css']
})
export class CreateOrdonnanceComponent implements OnInit, OnDestroy {
  ordonnanceForm: FormGroup;
  currentDoctorId: number = 0;
  pharmacyId: number = 0;

  // Patient
  patientId: number | null = null;
  patientData: PatientByReference | null = null;
  searchingPatient: boolean = false;
  patientNotFound: boolean = false;

  // Pharmacie autocomplete
  pharmacySearch: string = '';
  pharmacyResults: PharmacySearchResult[] = [];
  selectedPharmacy: PharmacySearchResult | null = null;
  showPharmacySuggestions: boolean = false;
  pharmacySearching: boolean = false;
  private pharmacySearch$ = new Subject<string>();

  // États
  loading: boolean = false;
  error: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Onglets de prescription
  activePrescriptionTab: 'manual' | 'upload' = 'manual';

  // Image d'ordonnance uploadée
  prescriptionImageFile: File | null = null;
  prescriptionImagePreview: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.ordonnanceForm = this.fb.group({
      // Référence patient (pour recherche)
      patientReference: ['', Validators.required],

      // Informations patient (affichage uniquement - non éditables)
      patientPrenom: [{ value: '', disabled: true }],
      patientNom: [{ value: '', disabled: true }],
      patientTelephone: [{ value: '', disabled: true }],
      patientEmail: [{ value: '', disabled: true }],

      // Adresse de livraison (saisie manuelle)
      address: [''],

      // Coordonnées GPS (pré-remplies depuis les données patient - non modifiables)
      latitude: [{ value: 0, disabled: true }],
      longitude: [{ value: 0, disabled: true }],

      // Diagnostic
      diagnostic: ['', Validators.required],

      // Besoin d'aide
      needsHelp: [false],

      // Médicaments
      medicaments: this.fb.array([])
    });
  }

  ngOnInit(): void {
    console.log('🏥 CreateOrdonnanceComponent - Initialisation');

    // Récupérer l'ID du docteur connecté
    const currentUser = this.getMockCurrentUser();

    if (!currentUser) {
      console.error('❌ Aucun utilisateur connecté');
      this.error = true;
      this.errorMessage = 'Vous devez être connecté pour créer une ordonnance';
      return;
    }

    if (!currentUser.id) {
      console.error('❌ ID utilisateur manquant');
      this.error = true;
      this.errorMessage = 'Erreur lors de la récupération de vos informations';
      return;
    }

    this.currentDoctorId = currentUser.id;
    console.log('👨‍⚕️ ID Docteur:', this.currentDoctorId);

    // Charger les données patient depuis localStorage si disponibles
    this.loadPatientFromLocalStorage();

    // Ajouter un médicament par défaut
    this.ajouterMedicament();

    // Écouter les changements sur la référence patient
    this.setupPatientSearch();

    // Configurer l'autocomplétion des pharmacies
    this.setupPharmacySearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les données patient depuis localStorage (comme pour l'hospitalisation)
   */
  private loadPatientFromLocalStorage(): void {
    const storedPatient = localStorage.getItem('selectedPatient');
    if (storedPatient) {
      try {
        const patient = JSON.parse(storedPatient);
        console.log('👤 Patient chargé depuis localStorage:', patient);

        // Utiliser l'API by-phone pour obtenir les données complètes avec référence
        const telephone = patient.telephone || patient.phone;
        if (telephone) {
          const cleanPhone = telephone.replace(/[\s\-\(\)]/g, '');
          this.localGetUserByPhone(cleanPhone).subscribe({
            next: (user: any) => {
              this.patientData = {
                id: user.id,
                reference: user.reference || '',
                prenom: user.prenom,
                nom: user.nom,
                telephone: user.telephone,
                email: user.email || '',
                adress: user.adress || '',
                lat: user.lat || 0,
                lon: user.lon || 0,
                profil: user.profil || 'PATIENT',
                pharmacyId: user.pharmacyId || 0
              };

              this.patientId = user.id;

              // Préremplir le formulaire
              this.ordonnanceForm.patchValue({
                patientReference: user.reference || '',
                patientPrenom: user.prenom,
                patientNom: user.nom,
                patientTelephone: user.telephone,
                patientEmail: user.email || '',
                address: user.adress || '',
                latitude: user.lat || 0,
                longitude: user.lon || 0
              });

              this.successMessage = `Patient prérempli: ${user.prenom} ${user.nom}`;
              setTimeout(() => this.successMessage = '', 3000);
            },
            error: (error) => {
              console.error('❌ Erreur lors de la récupération du patient par téléphone:', error);
              // Fallback sur les données localStorage
              this.loadPatientFromLocalStorageFallback(patient);
            }
          });
        } else {
          // Pas de téléphone, utiliser les données localStorage
          this.loadPatientFromLocalStorageFallback(patient);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du patient depuis localStorage:', error);
      }
    }
  }

  /**
   * Charge les données patient depuis localStorage en fallback (sans appel API)
   */
  private loadPatientFromLocalStorageFallback(patient: any): void {
    this.patientData = {
      id: patient.id,
      reference: patient.reference || '',
      prenom: patient.prenom,
      nom: patient.nom,
      telephone: patient.telephone,
      email: patient.email || '',
      adress: patient.adresse || '',
      lat: patient.latitude || 0,
      lon: patient.longitude || 0,
      profil: patient.profil || 'PATIENT',
      pharmacyId: patient.pharmacyId || 0
    };

    this.patientId = patient.id;

    // Préremplir le formulaire
    this.ordonnanceForm.patchValue({
      patientReference: patient.reference || '',
      patientPrenom: patient.prenom,
      patientNom: patient.nom,
      patientTelephone: patient.telephone,
      patientEmail: patient.email || '',
      address: patient.adresse || '',
      latitude: patient.latitude || 0,
      longitude: patient.longitude || 0
    });

    this.successMessage = `Patient prérempli: ${patient.prenom} ${patient.nom}`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  private localSearchPharmacies(term: string): any {
    const mockPharmacies: PharmacySearchResult[] = [
      { id: 1, name: 'Pharmacie Centrale', address: 'Dakar Plateau' },
      { id: 2, name: 'Pharmacie de la Medina', address: 'Dakar Medina' },
      { id: 3, name: 'Pharmacie Point E', address: 'Dakar Point E' }
    ];
    const filtered = mockPharmacies.filter(p => p.name.toLowerCase().includes(term.toLowerCase()));
    return of(filtered).pipe(delay(200));
  }

  // Local mock for current user (doctor)
  private getMockCurrentUser() {
    return {
      id: 42,
      prenom: 'Dr. Amina',
      nom: 'Sow',
      profil: 'DOCTOR',
      lat: 14.7,
      lon: -17.45,
      pharmacyId: 1
    };
  }

  // Local replacement for authFacade.getUserByPhone
  private localGetUserByPhone(phone: string) {
    const mock = {
      id: 2,
      reference: 'REF-123',
      prenom: 'Patient',
      nom: 'Test',
      telephone: phone,
      email: 'patient.test@example.com',
      adress: 'Somewhere',
      lat: 14.7,
      lon: -17.45,
      profil: 'PATIENT',
      pharmacyId: 0
    };
    return of(mock).pipe(delay(150));
  }

  /**
   * Configure l'autocomplétion de recherche de pharmacie
   */
  private setupPharmacySearch(): void {
    this.pharmacySearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      if (term.trim().length < 2) {
        this.pharmacyResults = [];
        this.showPharmacySuggestions = false;
        return;
      }
      this.pharmacySearching = true;
      this.localSearchPharmacies(term).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (results: any) => {
          this.pharmacySearching = false;
          // L'API peut retourner un tableau direct ou un objet pageable
          this.pharmacyResults = Array.isArray(results)
            ? results
            : (results?.content ?? []);
          this.showPharmacySuggestions = this.pharmacyResults.length > 0;
        },
        error: () => {
          this.pharmacySearching = false;
          this.pharmacyResults = [];
        }
      });
    });
  }

  onPharmacySearchInput(term: string): void {
    if (!this.selectedPharmacy || this.selectedPharmacy.name !== term) {
      this.selectedPharmacy = null;
      this.pharmacyId = 0;
    }
    this.pharmacySearch$.next(term);
  }

  selectPharmacy(pharmacy: PharmacySearchResult): void {
    this.selectedPharmacy = pharmacy;
    this.pharmacyId = pharmacy.id;
    this.pharmacySearch = pharmacy.name;
    this.pharmacyResults = [];
    this.showPharmacySuggestions = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.pharmacy-autocomplete')) {
      this.showPharmacySuggestions = false;
    }
  }

  /**
   * Configure la recherche automatique du patient par référence
   */
  private setupPatientSearch(): void {
    this.ordonnanceForm.get('patientReference')?.valueChanges.pipe(
      debounceTime(500), // Attendre 500ms après la dernière saisie
      distinctUntilChanged(), // Ignorer si la valeur n'a pas changé
      takeUntil(this.destroy$)
    ).subscribe(reference => {
      if (reference && reference.trim().length > 0) {
        this.rechercherPatient(reference.trim());
      } else {
        this.resetPatientData();
      }
    });
  }

  /**
   * Recherche un patient par sa référence
   */
  private localGetPatientByReference(reference: string): any {
    const mockPatient: PatientByReference = {
      id: 1,
      reference: reference,
      prenom: 'Moussa',
      nom: 'Diop',
      telephone: '771234567',
      email: 'moussa.diop@example.com',
      adress: 'Médina, Dakar',
      lat: 14.68,
      lon: -17.44,
      profil: 'PATIENT',
      pharmacyId: 0
    };
    if (reference === 'UNKNOWN') {
      return throwError(() => 'Patient not found').pipe(delay(200));
    }
    return of(mockPatient).pipe(delay(200));
  }

  private localSaveOrdonnance(request: SaveOrdonnanceRequest): any {
    return of({ reference: 'ORD-2026-XYZ', success: true }).pipe(delay(300));
  }

  private rechercherPatient(reference: string): void {
    console.log('🔍 Recherche du patient avec la référence:', reference);

    this.searchingPatient = true;
    this.patientNotFound = false;
    this.errorMessage = '';

    this.localGetPatientByReference(reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patient: any) => {
          console.log('✅ Patient trouvé:', patient);
          this.searchingPatient = false;
          this.patientNotFound = false;
          this.patientData = patient;
          this.patientId = patient.id;

          // Remplir les champs du formulaire
          this.ordonnanceForm.patchValue({
            patientPrenom: patient.prenom,
            patientNom: patient.nom,
            patientTelephone: patient.telephone,
            patientEmail: patient.email,
            address: patient.adress,
            latitude: patient.lat,
            longitude: patient.lon
          });

          this.successMessage = `Patient trouvé: ${patient.prenom} ${patient.nom}`;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error: any) => {
          console.error('❌ Patient non trouvé:', error);
          this.searchingPatient = false;
          this.patientNotFound = true;
          this.resetPatientData();
          this.errorMessage = 'Patient non trouvé avec cette référence';
        }
      });
  }

  /**
   * Réinitialise les données du patient
   */
  private resetPatientData(): void {
    this.patientData = null;
    this.patientId = null;
    this.ordonnanceForm.patchValue({
      patientPrenom: '',
      patientNom: '',
      patientTelephone: '',
      patientEmail: '',
      address: '',
      latitude: 0,
      longitude: 0
    });
  }

  get medicaments(): FormArray {
    return this.ordonnanceForm.get('medicaments') as FormArray;
  }

  creerMedicament(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      dosage: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ajouterMedicament(): void {
    this.medicaments.push(this.creerMedicament());
    console.log('➕ Médicament ajouté. Total:', this.medicaments.length);
  }

  supprimerMedicament(index: number): void {
    if (this.medicaments.length > 1) {
      this.medicaments.removeAt(index);
      console.log('🗑️ Médicament supprimé. Total:', this.medicaments.length);
    }
  }

  validerEtGenerer(): void {
    console.log('🔍 Validation du formulaire...');

    // Vérifier si un patient a été trouvé
    if (!this.patientId || !this.patientData) {
      this.errorMessage = 'Veuillez saisir une référence patient valide';
      this.ordonnanceForm.get('patientReference')?.markAsTouched();
      return;
    }

    if (this.ordonnanceForm.invalid) {
      console.log('❌ Formulaire invalide');
      this.marquerTousCommeModifies();
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.loading = true;
    this.error = false;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.ordonnanceForm.getRawValue(); // getRawValue pour inclure les champs disabled

    // Préparer les médicaments au format attendu par l'API
    const medications: Medication[] = formValue.medicaments.map((med: any) => ({
      name: med.name,
      quantity: parseInt(med.quantity),
      dosage: med.dosage,
      price: parseFloat(med.price) || 0
    }));

    // Convertir les médicaments en JSON string
    const medicationsJson = JSON.stringify(medications);

    // Construire la requête selon l'interface SaveOrdonnanceRequest
    const request: SaveOrdonnanceRequest = {
      doctorId: this.currentDoctorId,
      patientId: this.patientId, // ID récupéré depuis getPatientByReference
      medications: medicationsJson,
      needsHelp: formValue.needsHelp || false,
      pharmacyId: this.pharmacyId,
      address: formValue.address,
      latitude: parseFloat(formValue.latitude) || 0,
      longitude: parseFloat(formValue.longitude) || 0
    };

    console.log('📤 Envoi de l\'ordonnance:', {
      ...request,
      medications: medications // Afficher les médicaments parsés pour debug
    });

    // Appel au service pour sauvegarder l'ordonnance
    this.localSaveOrdonnance(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Ordonnance créée avec succès:', response);
          this.loading = false;
          this.successMessage = `Ordonnance créée avec succès! Référence: ${response.reference}`;

          // Supprimer le brouillon s'il existe
          localStorage.removeItem('ordonnance_brouillon');

          // Rediriger vers la liste des ordonnances après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/ordonnances']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création:', error);
          this.loading = false;
          this.error = true;
          this.errorMessage = error || 'Erreur lors de la création de l\'ordonnance';
        }
      });
  }

  enregistrerBrouillon(): void {
    console.log('💾 Enregistrement du brouillon...');

    const formValue = this.ordonnanceForm.getRawValue();

    // Pour l'instant, on sauvegarde dans le localStorage
    const brouillon = {
      ...formValue,
      patientId: this.patientId,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('ordonnance_brouillon', JSON.stringify(brouillon));
    this.successMessage = 'Brouillon enregistré avec succès!';

    console.log('✅ Brouillon enregistré');

    // Effacer le message après 3 secondes
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  annuler(): void {
    console.log('🚫 Annulation de la création');
    this.router.navigate(['/patients']);
  }

  private marquerTousCommeModifies(): void {
    Object.keys(this.ordonnanceForm.controls).forEach(key => {
      const control = this.ordonnanceForm.get(key);
      control?.markAsTouched();
    });

    this.medicaments.controls.forEach(medicament => {
      Object.keys((medicament as FormGroup).controls).forEach(key => {
        medicament.get(key)?.markAsTouched();
      });
    });
  }

  // Helper pour afficher les erreurs
  hasError(controlName: string): boolean {
    const control = this.ordonnanceForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  hasErrorMed(index: number, controlName: string): boolean {
    const control = this.medicaments.at(index).get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  // Calcul du montant total
  get totalAmount(): number {
    return this.medicaments.controls.reduce((total, med) => {
      const quantity = parseFloat(med.get('quantity')?.value) || 0;
      const price = parseFloat(med.get('price')?.value) || 0;
      return total + (quantity * price);
    }, 0);
  }

  /**
   * Change l'onglet actif de prescription
   */
  switchPrescriptionTab(tab: 'manual' | 'upload'): void {
    this.activePrescriptionTab = tab;
  }

  /**
   * Gère l'upload de l'image d'ordonnance
   */
  onPrescriptionImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Format de fichier non autorisé. Utilisez JPG, PNG ou PDF.';
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Le fichier est trop volumineux. Maximum 5MB.';
        return;
      }

      this.prescriptionImageFile = file;

      // Créer une preview si c'est une image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.prescriptionImagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.prescriptionImagePreview = null;
      }

      console.log('📎 Image d\'ordonnance sélectionnée:', file.name);
    }
  }

  /**
   * Supprime l'image d'ordonnance
   */
  removePrescriptionImage(): void {
    this.prescriptionImageFile = null;
    this.prescriptionImagePreview = null;
  }
}