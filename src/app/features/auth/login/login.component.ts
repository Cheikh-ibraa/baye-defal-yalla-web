import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/auth.types';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  private returnUrl: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour si elle existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
  }

  /**
   * Creates the reactive form for login
   */
  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  /**
   * Toggles password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Redirige vers le dashboard approprié selon le profil de l'utilisateur
   * Ou vers l'URL demandée (returnUrl) si elle existe
   */
  private getDashboardRoute(profil: string): string {
    const cleanProfil = profil ? profil.toUpperCase() : '';
    switch (cleanProfil) {
      case 'ADMIN': return '/admin/dashboard';
      case 'DOCTOR':
      case 'MEDECIN': return '/doctor/dashboard';
      case 'PHARMACIST':
      case 'PHARMACIE': return '/pharmacist/dashboard';
      case 'LABORATORY':
      case 'LAB':
      case 'LABORATOIRE': return '/laboratory/dashboard';
      case 'IMAGING_CENTER':
      case 'IMAGERIE': return '/imaging/dashboard';
      case 'ORGANISATION':
      case 'ORGANIZATION': return '/organization/dashboard';
      case 'ASSOCIATION': return '/association/dashboard';
      case 'HOSPITAL':
      case 'HOPITAL': return '/hospital/dashboard';
      case 'FOURNISSEUR':
      case 'SUPPLIER': return '/fournisseur/dashboard';
      case 'DONOR':
      case 'DONATEUR': return '/donor/dashboard';
      case 'PATIENT': return '/patient/dashboard';
      default: return '/portail';
    }
  }

  private redirectAfterLogin(user?: User): void {
    // Si une URL de retour existe, l'utiliser
    if (this.returnUrl && this.returnUrl !== '/login' && this.returnUrl !== '/portail') {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    const activeUser = user || JSON.parse(localStorage.getItem('user_data') || '{}');
    const route = this.getDashboardRoute(activeUser.profil);
    this.router.navigate([route]);
  }

  // Alias pour compatibilité (utilisé dans d'autres méthodes)
  private redirectToDefaultDashboard(): void {
    this.redirectAfterLogin();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password, rememberMe } = this.loginForm.value;

      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      }

      let profile = 'PHARMACIST';
      const emailLower = email.toLowerCase();
      if (emailLower.includes('admin')) profile = 'ADMIN';
      else if (emailLower.includes('medecin') || emailLower.includes('doctor')) profile = 'DOCTOR';
      else if (emailLower.includes('lab')) profile = 'LABORATORY';
      else if (emailLower.includes('imag')) profile = 'IMAGING_CENTER';
      else if (emailLower.includes('orga')) profile = 'ORGANISATION';
      else if (emailLower.includes('hosp')) profile = 'HOSPITAL';
      else if (emailLower.includes('fourn')) profile = 'FOURNISSEUR';
      else if (emailLower.includes('don')) profile = 'DONOR';
      else if (emailLower.includes('patient')) profile = 'PATIENT';

      const mockUser: User = {
        id: 1,
        nom: 'Ndiaye',
        prenom: 'Awa',
        email: email.toLowerCase(),
        telephone: '+221770000000',
        profil: profile,
        pharmacyId: 1,
        adress: 'Dakar',
        lat: null,
        lon: null
      };

      localStorage.setItem('user_data', JSON.stringify(mockUser));
      localStorage.setItem('access_token', 'static-auth-token');

      setTimeout(() => {
        this.isLoading = false;
        this.showSuccessMessage('Connexion réussie !');
        this.redirectAfterLogin(mockUser);
      }, 400);
    } else {
      this.markFormGroupTouched(this.loginForm);
      console.warn('⚠️ Formulaire invalide');
    }
  }

  /**
   * Handles Google OAuth login
   */
  loginWithGoogle(): void {
    this.isLoading = true;
    this.errorMessage = 'Fonctionnalité Google OAuth en cours de développement';

    setTimeout(() => {
      this.isLoading = false;
      this.showErrorMessage('Fonctionnalité Google OAuth non encore disponible');
    }, 1500);
  }

  /**
   * Handles Apple ID login
   */
  loginWithApple(): void {
    this.isLoading = true;
    this.errorMessage = 'Fonctionnalité Apple Sign-In en cours de développement';

    setTimeout(() => {
      this.isLoading = false;
      this.showErrorMessage('Fonctionnalité Apple Sign-In non encore disponible');
    }, 1500);
  }

  /**
   * Marks all form controls as touched to trigger validation display
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Shows success message
   */
  private showSuccessMessage(message: string): void {
    // TODO: Implémenter un service de notification/toast
  }

  /**
   * Shows error message
   */
  private showErrorMessage(message: string): void {
    console.error('❌ ERROR:', message);
    // TODO: Implémenter un service de notification/toast
  }

  /**
   * Clears error message
   */
  clearErrorMessage(): void {
    this.errorMessage = '';
  }

  /**
   * Getter for easy access to form controls in template
   */
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Get error message for a specific field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }

    if (field?.hasError('email')) {
      return 'Veuillez saisir un email valide';
    }

    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }

    return '';
  }

  /**
   * Reset form and clear errors
   */
  resetForm(): void {
    this.loginForm.reset();
    this.errorMessage = '';
    this.showPassword = false;
  }
}