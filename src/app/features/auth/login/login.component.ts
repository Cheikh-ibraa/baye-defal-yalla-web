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
  private redirectAfterLogin(): void {
    // Si une URL de retour existe, l'utiliser
    if (this.returnUrl && this.returnUrl !== '/login' && this.returnUrl !== '/portail') {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    this.router.navigate(['/medecins']);
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

      const mockUser: User = {
        id: 1,
        nom: 'Ndiaye',
        prenom: 'Awa',
        email: email.toLowerCase(),
        telephone: '+221770000000',
        profil: 'PHARMACIST',
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
        this.router.navigate(['/dashboard']);
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