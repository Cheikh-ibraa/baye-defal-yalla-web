// standalone-pacs-viewer.component.ts
import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interface pour typer la réponse
interface PacsResponse {
  studies: string[];
  series: {
    [key: string]: string[];
  };
}

@Component({
  selector: 'app-standalone-pacs-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pacs-viewer-container">
      <!-- État de chargement -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner-large"></div>
        <p>Chargement des images...</p>
      </div>

      <!-- Message d'erreur -->
      <div *ngIf="errorMessage" class="error-message">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- Viewer OHIF Intégré -->
      <div *ngIf="!isLoading && viewerUrl" class="viewer-wrapper">
        <iframe 
          [src]="safeViewerUrl" 
          class="ohif-viewer"
          allow="fullscreen"
          allowfullscreen
          frameborder="0">
        </iframe>
      </div>

      <!-- Message si pas d'images -->
      <div *ngIf="!isLoading && !viewerUrl && !errorMessage" class="no-images">
        <div class="no-images-content">
          <span class="no-images-icon">🖼️</span>
          <h3>Aucune image disponible</h3>
          <p>Aucune série trouvée pour l'accession number: "{{ accessionNumber }}"</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pacs-viewer-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
    }

    .header {
      background: #2c3e50;
      color: white;
      padding: 1rem 2rem;
      border-bottom: 2px solid #3498db;
    }

    .header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: normal;
    }

    .loading-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      background: #1a1a1a;
    }

    .spinner-large {
      width: 50px;
      height: 50px;
      border: 5px solid #34495e;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background: #c0392b;
      color: white;
      padding: 1rem;
      margin: 1rem;
      border-radius: 5px;
      text-align: center;
    }

    .viewer-wrapper {
      flex: 1;
      width: 100%;
      background: #000;
      position: relative;
    }

    .ohif-viewer {
      width: 100%;
      height: 100%;
      border: none;
      background: #000;
    }

    .no-images {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      color: white;
    }

    .no-images-content {
      text-align: center;
      padding: 2rem;
    }

    .no-images-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-images h3 {
      color: #ecf0f1;
      margin-bottom: 0.5rem;
    }

    .no-images p {
      color: #95a5a6;
    }
  `]
})
export class StandalonePacsViewerComponent implements OnInit, OnChanges {
  // Input pour recevoir l'accessionNumber
  @Input() accessionNumber: string = '';
  // Input pour forcer un refresh (le parent incrémente après upload)
  @Input() refreshTrigger: number = 0;
  // Input pour cacher le header (en mode plein écran)
  @Input() hideHeader: boolean = false;

  // Propriétés
  viewerUrl: string | null = null;
  safeViewerUrl: SafeResourceUrl | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    if (this.accessionNumber) {
      this.loadViewerUrl();
    } else {
      this.errorMessage = 'Accession Number non fourni';
      this.isLoading = false;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Recharger si accessionNumber change ou si refreshTrigger est incrémenté
    if (changes['accessionNumber'] && !changes['accessionNumber'].firstChange) {
      if (this.accessionNumber) {
        this.loadViewerUrl();
      }
    }
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      if (this.accessionNumber) {
        this.loadViewerUrl();
      }
    }
  }

  // Charger l'URL du viewer
  private loadViewerUrl() {
    this.isLoading = true;
    this.errorMessage = null;

    // Simulate a backend call: if accessionNumber contains 'noimg' we simulate no images (404-like),
    // otherwise return a data URL that renders a simple placeholder HTML for the viewer iframe.
    const accession = (this.accessionNumber || '').trim();
    const hasImages = accession.length > 0 && !accession.toLowerCase().includes('noimg');

    if (!accession) {
      // No accession provided -> immediate error state
      of(null).pipe(delay(200)).subscribe(() => {
        this.viewerUrl = null;
        this.errorMessage = 'Accession Number non fourni';
        this.isLoading = false;
      });
      return;
    }

    if (!hasImages) {
      // Simulate 404 / no images
      of(null).pipe(delay(300)).subscribe(() => {
        this.viewerUrl = null;
        this.safeViewerUrl = null;
        this.errorMessage = null; // show empty state, not an error
        this.isLoading = false;
      });
      return;
    }

    // Simulate successful response with a data URL viewer page
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>OHIF Mock</title></head><body style="margin:0;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h2>OHIF Viewer Mock</h2><p style="opacity:.8">Accession: ${accession}</p><div style="margin-top:1rem;color:#bbb;font-size:0.9rem;">This is a static mock viewer used for UI-only mode.</div></div></body></html>`;
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

    of({ studies: ['s1'], series: { 's1': [dataUrl] } } as PacsResponse).pipe(delay(300)).subscribe({
      next: (data) => {
        const firstStudyId = data.studies[0];
        const seriesUrls = data.series[firstStudyId];

        if (seriesUrls && seriesUrls.length > 0) {
          this.viewerUrl = seriesUrls[0];
          this.safeViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.viewerUrl);
        } else {
          this.errorMessage = 'Aucune série disponible pour cette étude';
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des images';
        this.isLoading = false;
      }
    });
  }

  // Recharger avec un nouvel accession number
  loadNewAccession(accessionNumber: string) {
    this.accessionNumber = accessionNumber;
    this.loadViewerUrl();
  }
}