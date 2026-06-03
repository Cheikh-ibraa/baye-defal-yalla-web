import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-pdf-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="viewer-host">

      <!-- ===== ÉCRAN MOT DE PASSE ===== -->
      <div *ngIf="!pdfReady" class="password-screen">

        <div class="password-card">

          <!-- Icône PDF -->
          <div class="icon-wrap">
            <svg width="40" height="40" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.75 14.5833H30.2083L18.75 3.125V14.5833ZM4.16667 0H20.8333L33.3333 12.5V37.5C33.3333
                38.6051 32.8943 39.6649 32.1129 40.4463C31.3315 41.2277 30.2717 41.6667 29.1667 41.6667H4.16667C3.0616
                41.6667 2.00179 41.2277 1.22039 40.4463C0.438987 39.6649 0 38.6051 0 37.5V4.16667C0 3.0616 0.438987
                2.00179 1.22039 1.22039C2.00179 0.438987 3.0616 0 4.16667 0Z" fill="#EF5350"/>
            </svg>
          </div>

          <h2>Document PDF protégé</h2>
          <p>Ce document est protégé par mot de passe.<br>Veuillez le saisir pour y accéder.</p>

          <!-- Erreur -->
          <div *ngIf="error" class="error-msg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ error }}
          </div>

          <!-- Champ mot de passe -->
          <div class="field">
            <label>Mot de passe</label>
            <div class="input-wrap">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                (keyup.enter)="openPdf()"
                placeholder="Entrez le mot de passe…"
                autocomplete="current-password"
              />
              <button type="button" (click)="showPassword = !showPassword" class="eye-btn" title="Afficher / masquer">
                <!-- œil barré -->
                <svg *ngIf="!showPassword" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                       a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242
                       4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953
                       9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0
                       01-4.132 5.411m0 0L21 21"/>
                </svg>
                <!-- œil ouvert -->
                <svg *ngIf="showPassword" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542
                       7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <button (click)="openPdf()" [disabled]="!password" class="submit-btn">
            Ouvrir le document
          </button>

        </div>
      </div>

      <!-- ===== IFRAME PDF ===== -->
      <iframe
        *ngIf="pdfReady && safeUrl"
        [src]="safeUrl"
        class="pdf-frame"
        frameborder="0"
      ></iframe>

      <!-- Pas d'URL -->
      <div *ngIf="!pdfUrl" class="no-url">
        <p>Aucune URL de document fournie.</p>
      </div>

    </div>
  `,
    styles: [`
    :host { display: block; width: 100vw; height: 100vh; overflow: hidden; margin: 0; padding: 0; }

    .viewer-host {
      width: 100%;
      height: 100%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* === PASSWORD SCREEN === */
    .password-screen {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .password-card {
      background: white;
      border-radius: 1.25rem;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.10);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      text-align: center;
    }

    .icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 0.25rem;
    }

    .password-card h2 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .password-card p {
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    /* Error */
    .error-msg {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
      color: #ef4444;
      font-size: 0.82rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 0.6rem 0.875rem;
    }

    /* Field */
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      text-align: left;
    }

    .field label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #374151;
    }

    .input-wrap {
      position: relative;
    }

    .input-wrap input {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      padding: 0.65rem 2.75rem 0.65rem 0.875rem;
      font-size: 0.88rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .input-wrap input:focus {
      border-color: #00B894;
      box-shadow: 0 0 0 3px rgba(0,184,148,0.12);
    }

    .eye-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      line-height: 1;
    }

    .eye-btn:hover { color: #374151; }

    .icon { width: 1.1rem; height: 1.1rem; }

    /* Submit */
    .submit-btn {
      background: #00B894;
      color: white;
      border: none;
      border-radius: 0.75rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      width: 100%;
    }

    .submit-btn:hover:not(:disabled) { background: #009e7a; }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* === PDF FRAME === */
    .pdf-frame {
      width: 100%;
      height: 100%;
      border: none;
    }

    /* === NO URL === */
    .no-url {
      color: #6b7280;
      font-size: 0.9rem;
    }
  `]
})
export class PdfViewerComponent implements OnInit {
    pdfUrl: string | null = null;
    password = '';
    showPassword = false;
    error: string | null = null;
    pdfReady = false;
    safeUrl: SafeResourceUrl | null = null;

    constructor(
        private route: ActivatedRoute,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.pdfUrl = this.route.snapshot.queryParamMap.get('url');
    }

    openPdf(): void {
        if (!this.password || !this.pdfUrl) return;

        // Le navigateur gère la vérification du mot de passe nativement.
        // On charge le PDF dans l'iframe ; si le PDF est protégé, le lecteur PDF
        // intégré du navigateur demandera le mot de passe saisi.
        this.error = null;
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);
        this.pdfReady = true;
    }
}
