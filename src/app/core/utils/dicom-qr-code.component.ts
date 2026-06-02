import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
    selector: 'app-dicom-qr-code',
    standalone: true,
    imports: [CommonModule, QRCodeComponent],
    template: `
    <!-- QR Code miniature -->
    <div class="inline-flex flex-col items-center gap-1 cursor-pointer group"
         (click)="openModal()">
      <div class="relative w-[80px] h-[80px] bg-white rounded-lg border border-gray-200 
                  p-1 opacity-80 group-hover:opacity-100 group-hover:scale-105 
                  group-hover:shadow-md transition-all duration-200 ease-out">
        <qrcode
          [qrdata]="viewerUrl"
          [width]="42"
          [errorCorrectionLevel]="'H'"
          [margin]="0"
          cssClass="qr-mini">
        </qrcode>
      </div>
      <span class="text-[10px] text-gray-400 group-hover:text-[#2C7BE5] transition-colors">
        Scanner
      </span>
    </div>

    <!-- Modal QR Code -->
    <div *ngIf="showModal" 
         class="fixed inset-0 z-[200] flex items-center justify-center p-4"
         (click)="closeModal()">
      
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/35 backdrop-blur-sm"></div>
      
      <!-- Modal content -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] p-6 
                  animate-modal-in"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Scanner un QR Code</h3>
          <button (click)="closeModal()"
                  class="w-8 h-8 flex items-center justify-center 
                         rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- QR Code container with dark background -->
        <div class="relative mx-auto w-[220px] h-[220px] bg-[#3D3D3D] rounded-xl p-6 
                    flex items-center justify-center overflow-hidden">
          
          <!-- QR Code white background -->
          <div class="relative bg-white rounded-md p-2">
            <qrcode
              [qrdata]="viewerUrl"
              [width]="140"
              [errorCorrectionLevel]="'H'"
              [margin]="0"
              cssClass="qr-large">
            </qrcode>
          </div>
          
          <!-- Scanner line animation -->
          <div class="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden">
            <div class="scanner-line"></div>
          </div>
          
          <!-- Corner accents (blue) -->
          <div class="absolute top-3 left-3 w-6 h-6 border-t-[3px] border-l-[3px] border-[#2C7BE5]"></div>
          <div class="absolute top-3 right-3 w-6 h-6 border-t-[3px] border-r-[3px] border-[#2C7BE5]"></div>
          <div class="absolute bottom-3 left-3 w-6 h-6 border-b-[3px] border-l-[3px] border-[#2C7BE5]"></div>
          <div class="absolute bottom-3 right-3 w-6 h-6 border-b-[3px] border-r-[3px] border-[#2C7BE5]"></div>
        </div>
        
        <!-- Instructions -->
        <p class="text-center text-sm text-gray-500 mt-6 leading-relaxed px-4">
          Placez le QR Code de la prescription devant la caméra pour accéder automatiquement au dossier.
        </p>
        
        <!-- Fermer button -->
        <div class="mt-6 flex justify-center">
          <button (click)="closeModal()"
                  class="px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 
                         rounded-lg text-sm font-medium transition-colors">
            Fermer
          </button>
        </div>
        
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: inline-block;
    }
    
    /* Modal animation */
    .animate-modal-in {
      animation: modalIn 180ms ease-out;
    }
    
    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    /* Scanner line animation */
    .scanner-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(44, 123, 229, 0.3) 20%,
        rgba(44, 123, 229, 0.8) 50%,
        rgba(44, 123, 229, 0.3) 80%,
        transparent 100%
      );
      box-shadow: 
        0 0 10px rgba(44, 123, 229, 0.6),
        0 0 20px rgba(44, 123, 229, 0.4),
        0 0 30px rgba(44, 123, 229, 0.2);
      animation: scan 2s linear infinite;
    }
    
    @keyframes scan {
      0% {
        top: 0%;
      }
      100% {
        top: 100%;
      }
    }
    
    /* QR code styling */
    :host ::ng-deep .qr-mini img,
    :host ::ng-deep .qr-mini canvas {
      width: 100% !important;
      height: 100% !important;
    }
    
    :host ::ng-deep .qr-large img,
    :host ::ng-deep .qr-large canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class DicomQrCodeComponent {
    /** URL complète du viewer DICOM encodée dans le QR code */
    @Input() viewerUrl: string = '';

    showModal = false;

    openModal(): void {
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.showModal) {
            this.closeModal();
        }
    }
}
