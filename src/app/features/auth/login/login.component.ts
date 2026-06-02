import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { AuthService, AuthResult } from '../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Stats avec animation
  pharmaciesCount: number = 0;
  deliveriesCount: number = 0;
  doctorsCount: number = 0;

  private readonly PHARMACIES_TARGET = 100;
  private readonly DELIVERIES_TARGET = 500;
  private readonly DOCTORS_TARGET = 50;

  private destroy$ = new Subject<void>();
  private returnUrl: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour si elle existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Vérifier si l'utilisateur est déjà connecté
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.redirectAfterLogin();
    }

    // Démarrer l'animation des compteurs
    this.animateCounters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Anime les compteurs de statistiques
   */
  private animateCounters(): void {
    const duration = 3000; // Durée de l'animation en ms (augmentée à 3s)
    const steps = 80; // Nombre d'étapes augmenté pour plus de fluidité
    const stepDuration = duration / steps;

    let currentStep = 0;

    interval(stepDuration)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => currentStep <= steps)
      )
      .subscribe(() => {
        const progress = this.easeOutQuad(currentStep / steps);

        this.pharmaciesCount = Math.floor(progress * this.PHARMACIES_TARGET);
        this.deliveriesCount = Math.floor(progress * this.DELIVERIES_TARGET);
        this.doctorsCount = Math.floor(progress * this.DOCTORS_TARGET);

        currentStep++;
      });
  }

  /**
   * Fonction d'easing pour une animation plus naturelle
   */
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  /**
   * Creates the reactive form for login
   */
  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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

    // Sinon, rediriger vers le dashboard par défaut
    const user = this.authService.getCurrentUser();

    if (!user) {
      return;
    }

    if (user.profil === 'DOCTOR') {
      this.router.navigate(['/dashboard-med']);
    } else if (user.profil === 'ADMIN') {
      this.router.navigate(['/dashboard-admin']);
    } else if (user.profil === 'LABORATORY') {
      this.router.navigate(['/dashboard-lab']);
    } else if (user.profil === 'IMAGING_CENTER') {
      this.router.navigate(['/dashboard-imagerie']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Alias pour compatibilité (utilisé dans d'autres méthodes)
  private redirectToDefaultDashboard(): void {
    this.redirectAfterLogin();
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password, rememberMe } = this.loginForm.value;

      this.authService.authenticate(email, password)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result: AuthResult) => {
            this.isLoading = false;

            if (result.isSuccess) {
              if (rememberMe) {
                localStorage.setItem('remember_me', 'true');
              }

              this.showSuccessMessage('Connexion réussie !');

              const user = this.authService.getCurrentUser();

              if (!user) {
                console.error('❌ Pas d\'utilisateur après authentification');
                this.errorMessage = 'Erreur lors de la récupération des informations utilisateur';
                return;
              }

              setTimeout(() => {
                this.redirectToDefaultDashboard();
              }, 1000);
            } else {
              this.errorMessage = result.errorMessage || 'Erreur de connexion';
              this.showErrorMessage(this.errorMessage);
            }
          },
          error: (error: any) => {
            console.error('❌ Erreur complète:', error);
            this.isLoading = false;

            if (error instanceof HttpErrorResponse) {
              switch (error.status) {
                case 403:
                  this.errorMessage = 'Accès refusé. Vérifiez vos identifiants ou contactez l\'administrateur.';
                  break;
                case 401:
                  this.errorMessage = 'Identifiants incorrects. Veuillez vérifier votre nom d\'utilisateur et mot de passe.';
                  break;
                case 0:
                  this.errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
                  break;
                case 404:
                  this.errorMessage = 'Service d\'authentification non trouvé.';
                  break;
                case 500:
                  this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
                  break;
                default:
                  this.errorMessage = error.error?.message || `Erreur ${error.status}: ${error.message}`;
              }
            } else if (error.errorMessage) {
              this.errorMessage = error.errorMessage;
            } else {
              this.errorMessage = 'Une erreur inattendue est survenue';
            }

            this.showErrorMessage(this.errorMessage);
          }
        });
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