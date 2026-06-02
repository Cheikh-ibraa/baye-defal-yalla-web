import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './otp-popup.component.html',
  styleUrls: ['./otp-popup.component.css']
})
export class OtpPopupComponent implements OnInit, OnDestroy {
  @Input() email: string = '';
  @Input() isVisible: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';

  @Output() verifyOTP = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @Output() resendOTP = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  otpForm: FormGroup;
  countdown: number = 0;
  private countdownInterval: any;

  // États des popups
  showSuccessPopup: boolean = false;
  showErrorPopup: boolean = false;

  constructor(private formBuilder: FormBuilder) {
    this.otpForm = this.createOTPForm();
  }

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private createOTPForm(): FormGroup {
    return this.formBuilder.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  private startCountdown(): void {
    this.countdown = 60; // 60 secondes
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  onSubmit(): void {
    if (this.otpForm.valid) {
      const otpCode = this.otpForm.value.otpCode;

      // Simulation de vérification OTP
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        if (otpCode === '123456') {
          this.showSuccessPopup = true;
        } else {
          this.showErrorPopup = true;
        }
      }, 1000);
    } else {
      this.otpForm.get('otpCode')?.markAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onResendOTP(): void {
    if (this.countdown <= 0) {
      this.resendOTP.emit();
      this.startCountdown();
    }
  }

  onInputChange(event: any): void {
    const value = event.target.value.replace(/\D/g, ''); // Only allow digits
    this.otpForm.patchValue({ otpCode: value });
  }

  // Gestion des popups
  onSuccessConfirm(): void {
    this.showSuccessPopup = false;
    this.success.emit();
  }

  onErrorConfirm(): void {
    this.showErrorPopup = false;
    // Reset le formulaire pour permettre une nouvelle tentative
    this.otpForm.reset();
  }

  get f() {
    return this.otpForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.otpForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.otpForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Le code OTP est requis';
    }

    if (field?.hasError('minlength') || field?.hasError('maxlength')) {
      return 'Le code OTP doit contenir exactement 6 chiffres';
    }

    return '';
  }
}