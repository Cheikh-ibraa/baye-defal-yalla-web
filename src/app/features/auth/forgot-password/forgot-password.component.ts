import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  @Output() backToLoginEvent = new EventEmitter<void>();

  resetForm: FormGroup;
  selectedMethod: 'email' | 'phone' = 'email';
  isLoading: boolean = false;

  currentStep: 'reset' | 'verify' = 'reset';
  codeDigits = ['', '', '', '', '', ''];
  countdown = 60;
  canResend = false;
  isVerifying = false;
  isResending = false;
  verificationError = '';

  constructor(private formBuilder: FormBuilder,
    private router: Router
  ) {


    this.resetForm = this.createResetForm();

  }

  ngOnInit(): void {
    // Initialize with email method selected
    this.selectMethod('email');
  }
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  /**
   * Creates the reactive form for password reset
   */
  private createResetForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+33|0)[1-9](\d{8})$/)]]
    });
  }

  /**
   * Selects the reset method (email or phone)
   */
  selectMethod(method: 'email' | 'phone'): void {
    this.selectedMethod = method;

    // Clear previous validations
    this.resetForm.get('email')?.clearValidators();
    this.resetForm.get('phone')?.clearValidators();

    // Set validators based on selected method
    if (method === 'email') {
      this.resetForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.resetForm.get('phone')?.clearValidators();
    } else {
      this.resetForm.get('phone')?.setValidators([
        Validators.required,
        Validators.pattern(/^(\+33|0)[1-9](\d{8})$/)
      ]);
      this.resetForm.get('email')?.clearValidators();
    }

    // Update form validation
    this.resetForm.get('email')?.updateValueAndValidity();
    this.resetForm.get('phone')?.updateValueAndValidity();
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.isFormValid()) {
      this.isLoading = true;

      const resetData = {
        method: this.selectedMethod,
        value: this.selectedMethod === 'email'
          ? this.resetForm.get('email')?.value
          : this.resetForm.get('phone')?.value
      };

      console.log('Password reset request:', resetData);

      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        this.sendVerificationCode(resetData);
      }, 2000);
    } else {
      // Mark form as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  /**
   * Checks if the current form is valid based on selected method
   */
  private isFormValid(): boolean {
    if (this.selectedMethod === 'email') {
      const emailControl = this.resetForm.get('email');
      return emailControl?.valid || false;
    } else {
      const phoneControl = this.resetForm.get('phone');
      return phoneControl?.valid || false;
    }
  }

  /**
   * Simulates sending verification code
   */
  private sendVerificationCode(data: any): void {
    // Here you would integrate with your backend API
    const method = data.method === 'email' ? 'email' : 'SMS';
    const destination = data.value;

    console.log(`Verification code sent via ${method} to ${destination}`);

    // Show success message
    this.showSuccessMessage(
      `Code de vérification envoyé ${data.method === 'email' ? 'par email' : 'par SMS'} !`
    );

    // In a real app, you might navigate to a verification code input page
    // or show a modal for code verification
  }

  /**
   * Navigates back to login
   */
  backToLogin(): void {
    this.backToLoginEvent.emit();
  }

  /**
   * Marks all relevant form controls as touched
   */
  private markFormGroupTouched(): void {
    if (this.selectedMethod === 'email') {
      this.resetForm.get('email')?.markAsTouched();
    } else {
      this.resetForm.get('phone')?.markAsTouched();
    }
  }

  /**
   * Shows success message
   */
  private showSuccessMessage(message: string): void {
    console.log('SUCCESS:', message);
    // Implement your notification service here
    // Example: this.notificationService.showSuccess(message);
  }

  /**
   * Shows error message
   */
  private showErrorMessage(message: string): void {
    console.log('ERROR:', message);
    // Implement your notification service here
    // Example: this.notificationService.showError(message);
  }

  /**
   * Custom email validator
   */
  private emailValidator(control: any) {
    const email = control.value;
    if (!email) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : { invalidEmail: true };
  }

  /**
   * Custom phone validator for French numbers
   */
  private phoneValidator(control: any) {
    const phone = control.value;
    if (!phone) return null;

    // French phone number pattern
    const phoneRegex = /^(?:(?:\+33|0)[1-9])(?:[0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s+/g, '')) ? null : { invalidPhone: true };
  }

  /**
   * Getter for easy access to form controls
   */
  get f() {
    return this.resetForm.controls;
  }

  /**
   * Check if specific field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Get error message for a specific field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.resetForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }

    if (field?.hasError('email')) {
      return 'Veuillez saisir une adresse email valide';
    }

    if (field?.hasError('pattern') && fieldName === 'phone') {
      return 'Veuillez saisir un numéro de téléphone français valide';
    }

    return '';
  }

  /**
   * Format phone number input
   */
  formatPhoneNumber(event: any): void {
    let value = event.target.value.replace(/\s+/g, '');

    // Auto-format French phone numbers
    if (value.startsWith('0') || value.startsWith('+33')) {
      // Add spaces for readability
      if (value.length > 2) {
        value = value.substring(0, 2) + ' ' + value.substring(2);
      }
      if (value.length > 5) {
        value = value.substring(0, 5) + ' ' + value.substring(5);
      }
      if (value.length > 8) {
        value = value.substring(0, 8) + ' ' + value.substring(8);
      }
      if (value.length > 11) {
        value = value.substring(0, 11) + ' ' + value.substring(11);
      }
      if (value.length > 14) {
        value = value.substring(0, 14) + ' ' + value.substring(14);
      }
    }

    this.resetForm.patchValue({ phone: value });
  }

}