import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { StandalonePacsViewerComponent } from '../../core/utils/standalone-pacs-viewer.component';

@Component({
    selector: 'app-mobile-dicom-viewer',
    standalone: true,
    imports: [CommonModule, StandalonePacsViewerComponent],
    template: `
    <div class="viewer-fullscreen">
      <!-- Loading -->
      <div *ngIf="!accessionNumber" class="state-container">
        <p class="text-white text-lg">Paramètre accessionNumber manquant.</p>
      </div>

      <!-- Viewer -->
      <app-standalone-pacs-viewer
        *ngIf="accessionNumber"
        [accessionNumber]="accessionNumber"
        [hideHeader]="true"
      ></app-standalone-pacs-viewer>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    .viewer-fullscreen {
      width: 100%;
      height: 100%;
      background: #000;
    }

    .state-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
    }
  `]
})
export class MobileDicomViewerComponent implements OnInit {
    accessionNumber: string = '';

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.accessionNumber = this.route.snapshot.paramMap.get('accessionNumber') ?? '';
    }
}
