import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

type RoleKey   = 'medecin' | 'pharmacien' | 'patient' | 'donateur';
type DonorType = 'individual' | 'organization' | '';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  currentStep = 1;
  selectedRole: RoleKey | '' = '';
  donorType:    DonorType    = '';
  isRegistering = false;
  registrationSuccess = false;
  registrationError = '';

  showPassword = false;
  showConfirmPassword = false;

  availableRoles = [
    {
      key: 'pharmacien' as RoleKey,
      label: 'Pharmacien',
      description: 'Gérez votre pharmacie et les réceptions de médicaments'
    },
    {
      key: 'medecin' as RoleKey,
      label: 'Médecin',
      description: 'Prescrivez et suivez les traitements de vos patients'
    },
    {
      key: 'donateur' as RoleKey,
      label: 'Donateur',
      description: 'Gestion des besoins, des dons et mise en relation en temps réel.'
    },
    {
      key: 'patient' as RoleKey,
      label: 'Patient',
      description: 'Accédez aux soins et suivez vos prescriptions médicales.'
    }
  ];

  specialties = [
    'Médecine générale',
    'Pédiatrie',
    'Gynécologie-Obstétrique',
    'Chirurgie générale',
    'Cardiologie',
    'Neurologie',
    'Dermatologie',
    'Ophtalmologie',
    'ORL',
    'Orthopédie',
    'Psychiatrie',
    'Radiologie',
    'Anesthésiologie',
    'Urgences',
    'Médecine interne'
  ];

  doctorForm     = { fullName: '', phone: '', email: '', speciality: '', password: '', confirmPassword: '' };
  pharmacistForm = { fullName: '', phone: '', email: '', pharmacyId: '', password: '', confirmPassword: '' };
  patientForm    = { fullName: '', phone: '', email: '', password: '', confirmPassword: '' };
  donorForm      = { fullName: '', phone: '', email: '', password: '', confirmPassword: '' };
  orgForm        = { organizationName: '', responsable: '', phone: '', email: '', password: '', confirmPassword: '' };

  pharmacies: any[] = [];
  pharmaciesLoading = false;
  pharmacySearch = '';
  showPharmacyDropdown = false;

  identityDoc: File | null = null;
  orderCertificate: File | null = null;
  operatingAuth: File | null = null;

  private readonly PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?\/\\|~`]).{8,}$/;

  constructor(private http: HttpClient, private router: Router) {}

  get selectedPharmacy(): any {
    return this.pharmacies.find(p => p.id === this.pharmacistForm.pharmacyId) ?? null;
  }

  get pharmacySuggestions(): any[] {
    const q = this.pharmacySearch.trim().toLowerCase();
    if (!q) return this.pharmacies.slice(0, 8);
    return this.pharmacies.filter(p =>
      p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)
    ).slice(0, 8);
  }

  loadPharmacies(): void {
    this.pharmaciesLoading = true;
    this.http.get<any[]>(`${environment.baseUrl}/pharmacy/public/pharmacies`).subscribe({
      next: (data) => { this.pharmacies = data || []; this.pharmaciesLoading = false; },
      error: () => { this.pharmacies = []; this.pharmaciesLoading = false; },
    });
  }

  onPharmacySearchFocus(): void {
    this.showPharmacyDropdown = true;
  }

  onPharmacySearchInput(): void {
    this.pharmacistForm.pharmacyId = '';
    this.showPharmacyDropdown = true;
  }

  pickPharmacy(p: any): void {
    this.pharmacistForm.pharmacyId = p.id;
    this.pharmacySearch = p.name;
    this.showPharmacyDropdown = false;
    this.clearError();
  }

  clearPharmacySelection(): void {
    this.pharmacistForm.pharmacyId = '';
    this.pharmacySearch = '';
    this.showPharmacyDropdown = false;
  }

  get hasDocumentStep(): boolean {
    return this.selectedRole === 'medecin' || this.selectedRole === 'pharmacien';
  }

  get totalSteps(): number {
    return this.hasDocumentStep ? 3 : 2;
  }

  get roleLabel(): string {
    return this.availableRoles.find(r => r.key === this.selectedRole)?.label ?? '';
  }

  selectRole(role: RoleKey): void {
    this.selectedRole = role;
    this.donorType    = '';
    this.clearError();
  }

  selectDonorType(t: 'individual' | 'organization'): void {
    this.donorType = t;
    this.clearError();
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.selectedRole) {
      this.currentStep = 2;
      this.clearError();
    } else if (this.currentStep === 2 && this.canProceedStep2()) {
      if (this.hasDocumentStep) {
        if (this.selectedRole === 'pharmacien' && this.pharmacies.length === 0) {
          this.loadPharmacies();
        }
        this.currentStep = 3;
        this.clearError();
      } else {
        this.completeRegistration();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.clearError();
    }
  }

  canProceedStep2(): boolean {
    switch (this.selectedRole) {
      case 'medecin':
        return !!(this.doctorForm.fullName && this.doctorForm.phone.length === 9 &&
                  this.doctorForm.speciality && this.isPasswordValid(this.doctorForm.password) &&
                  this.doctorForm.password === this.doctorForm.confirmPassword);
      case 'pharmacien':
        return !!(this.pharmacistForm.fullName && this.pharmacistForm.phone.length === 9 &&
                  this.isPasswordValid(this.pharmacistForm.password) &&
                  this.pharmacistForm.password === this.pharmacistForm.confirmPassword);
      case 'patient':
        return !!(this.patientForm.fullName && this.patientForm.phone.length === 9 &&
                  this.isPasswordValid(this.patientForm.password) &&
                  this.patientForm.password === this.patientForm.confirmPassword);
      case 'donateur':
        if (!this.donorType) return false;
        if (this.donorType === 'individual') {
          return !!(this.donorForm.fullName && this.donorForm.phone.length === 9 &&
                    this.isPasswordValid(this.donorForm.password) &&
                    this.donorForm.password === this.donorForm.confirmPassword);
        }
        return !!(this.orgForm.organizationName && this.orgForm.responsable &&
                  this.orgForm.phone.length === 9 &&
                  this.isPasswordValid(this.orgForm.password) &&
                  this.orgForm.password === this.orgForm.confirmPassword);
      default:
        return false;
    }
  }

  isPasswordValid(password: string): boolean {
    return this.PASSWORD_REGEX.test(password);
  }

  getPassword(): string {
    switch (this.selectedRole) {
      case 'medecin': return this.doctorForm.password;
      case 'pharmacien': return this.pharmacistForm.password;
      case 'patient': return this.patientForm.password;
      case 'donateur': return this.donorType === 'organization' ? this.orgForm.password : this.donorForm.password;
      default: return '';
    }
  }

  getConfirmPassword(): string {
    switch (this.selectedRole) {
      case 'medecin': return this.doctorForm.confirmPassword;
      case 'pharmacien': return this.pharmacistForm.confirmPassword;
      case 'patient': return this.patientForm.confirmPassword;
      case 'donateur': return this.donorType === 'organization' ? this.orgForm.confirmPassword : this.donorForm.confirmPassword;
      default: return '';
    }
  }

  passwordsMatch(): boolean {
    return this.getPassword() === this.getConfirmPassword() && this.getPassword().length > 0;
  }

  onFileSelect(event: Event, field: 'identityDoc' | 'orderCertificate' | 'operatingAuth'): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this[field] = input.files[0];
    }
  }

  removeFile(field: 'identityDoc' | 'orderCertificate' | 'operatingAuth'): void {
    this[field] = null;
  }

  formatFileSize(file: File): string {
    if (file.size < 1024 * 1024) return `${(file.size / 1024).toFixed(0)} Ko`;
    return `${(file.size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  formatPhone(form: { phone: string }): void {
    form.phone = form.phone.replace(/\D/g, '').substring(0, 9);
  }

  isValidEmail(email: string): boolean {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  completeRegistration(): void {
    this.isRegistering = true;
    this.registrationError = '';

    let request$;

    if (this.selectedRole === 'medecin') {
      const fd = new FormData();
      fd.append('fullName', this.doctorForm.fullName);
      fd.append('phone', this.doctorForm.phone);
      if (this.doctorForm.email) fd.append('email', this.doctorForm.email);
      fd.append('speciality', this.doctorForm.speciality);
      fd.append('password', this.doctorForm.password);
      fd.append('confirmPassword', this.doctorForm.confirmPassword);
      if (this.identityDoc) fd.append('identityDocument', this.identityDoc);
      if (this.orderCertificate) fd.append('orderCertificate', this.orderCertificate);
      request$ = this.http.post(`${environment.baseUrl}/auth/register/doctor`, fd);

    } else if (this.selectedRole === 'pharmacien') {
      const fd = new FormData();
      fd.append('fullName', this.pharmacistForm.fullName);
      fd.append('phone', this.pharmacistForm.phone);
      if (this.pharmacistForm.email) fd.append('email', this.pharmacistForm.email);
      fd.append('pharmacyId', this.pharmacistForm.pharmacyId);
      fd.append('password', this.pharmacistForm.password);
      fd.append('confirmPassword', this.pharmacistForm.confirmPassword);
      if (this.identityDoc) fd.append('identityDocument', this.identityDoc);
      if (this.operatingAuth) fd.append('exerciseAuthorization', this.operatingAuth);
      request$ = this.http.post(`${environment.baseUrl}/auth/register/pharmacist`, fd);

    } else if (this.selectedRole === 'patient') {
      request$ = this.http.post(`${environment.baseUrl}/auth/register/patient`, {
        fullName: this.patientForm.fullName,
        phone: this.patientForm.phone,
        email: this.patientForm.email || undefined,
        password: this.patientForm.password,
        confirmPassword: this.patientForm.confirmPassword
      });

    } else if (this.selectedRole === 'donateur') {
      if (this.donorType === 'individual') {
        request$ = this.http.post(`${environment.baseUrl}/auth/register/donor`, {
          fullName:        this.donorForm.fullName,
          phone:           this.donorForm.phone,
          email:           this.donorForm.email || undefined,
          password:        this.donorForm.password,
          confirmPassword: this.donorForm.confirmPassword,
          type:            'individual',
        });
      } else {
        request$ = this.http.post(`${environment.baseUrl}/auth/register/donor`, {
          fullName:         this.orgForm.responsable,
          phone:            this.orgForm.phone,
          email:            this.orgForm.email || undefined,
          password:         this.orgForm.password,
          confirmPassword:  this.orgForm.confirmPassword,
          type:             'organization',
          organizationName: this.orgForm.organizationName,
        });
      }
    }

    if (!request$) {
      this.isRegistering = false;
      return;
    }

    request$.subscribe({
      next: () => {
        this.isRegistering = false;
        this.registrationSuccess = true;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        this.isRegistering = false;
        const msg = err?.error?.message;
        if (Array.isArray(msg)) {
          this.registrationError = msg.join(', ');
        } else {
          this.registrationError = msg ?? 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }

  clearError(): void {
    this.registrationError = '';
  }
}
