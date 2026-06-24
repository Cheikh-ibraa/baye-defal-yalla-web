import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface PastDonationDetail {
  id: string;
  dateString: string;
  timeString: string;
  type: string;
  typeTag: string;
  patientName: string;
  patientAge: number;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  treatment: string;
  location: string;
  reference: string;
  patientPhoto?: string;
  impactCoveredPercentage: number;
  thankYouMessageType?: 'text' | 'voice';
  thankYouText?: string;
  thankYouAudioUrl?: string;
  hasThankYou: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  ORDONNANCE: 'Ordonnance',
  ANALYSE:    'Analyse',
  IMAGERIE:   'Imagerie',
  HOSPITALISATION: 'Hospitalisation',
};

@Component({
  selector: 'app-dons-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dons-detail.component.html'
})
export class DonsDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  donationId: string | null = null;
  donation: PastDonationDetail | null = null;
  isLoading = true;
  error: string | null = null;

  isPlayingAudio = false;
  private audio: HTMLAudioElement | null = null;

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  ngOnInit(): void {
    this.donationId = this.route.snapshot.paramMap.get('id');
    if (this.donationId) {
      this.loadDetail(this.donationId);
    }
  }

  private loadDetail(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<any>(`${environment.baseUrl}/contributions/${id}`, { headers: this.authHeaders }).subscribe({
      next: (res) => {
        this.donation = this.mapContribution(res);
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les détails de ce don.';
        this.isLoading = false;
      },
    });
  }

  private mapContribution(c: any): PastDonationDetail {
    const date     = new Date(c.createdAt);
    const campaign = c.campaign ?? {};
    const target   = Number(campaign.targetAmount ?? 0);
    const collected = Number(campaign.collectedAmount ?? 0);
    const pct      = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;

    const statusMap: Record<string, 'SUCCESS' | 'PENDING' | 'FAILED'> = {
      VALIDATED: 'SUCCESS',
      PENDING:   'PENDING',
      REJECTED:  'FAILED',
    };

    const thankYou = c.thankYouMessage;

    return {
      id:          c.id,
      dateString:  date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      timeString:  date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type:        TYPE_LABEL[campaign.type] ?? (campaign.type ?? '—'),
      typeTag:     campaign.type ?? '—',
      patientName: campaign.patientName ?? 'Patient',
      patientAge:  campaign.patientAge  ?? 0,
      amount:      Number(c.amount ?? 0),
      status:      statusMap[c.status] ?? 'PENDING',
      treatment:   campaign.treatment   ?? campaign.description ?? '—',
      location:    'Dakar, Sénégal',
      reference:   c.receiptNumber      ?? c.id,
      patientPhoto: undefined,
      impactCoveredPercentage: pct,
      hasThankYou:      !!thankYou,
      thankYouMessageType: thankYou?.messageType,
      thankYouText:        thankYou?.message,
      thankYouAudioUrl:    thankYou?.audioUrl,
    };
  }

  formatAmount(amount: number): string {
    return (amount ?? 0).toLocaleString('fr-FR');
  }

  goBack(): void {
    this.router.navigate(['/donor/dons-historique']);
  }

  toggleAudio(): void {
    if (!this.donation?.thankYouAudioUrl) return;

    if (!this.audio) {
      this.audio = new Audio(this.donation.thankYouAudioUrl);
      this.audio.onended = () => { this.isPlayingAudio = false; };
    }

    if (this.isPlayingAudio) {
      this.audio.pause();
      this.isPlayingAudio = false;
    } else {
      this.audio.play();
      this.isPlayingAudio = true;
    }
  }
}
