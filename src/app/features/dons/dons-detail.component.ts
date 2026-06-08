import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

export interface PastDonationDetail {
  id: string;
  dateString: string;
  timeString: string;
  type: string;
  typeTag: string;
  patientName: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  treatment: string;
  location: string;
  reference: string;
  patientPhoto?: string;
  impactCoveredPercentage: number;
}

const DETAIL_DONATIONS: PastDonationDetail[] = [
  {
    id: 'DON-2025-001',
    dateString: '15 juin 2025',
    timeString: '14:30',
    type: 'Ordonnance',
    typeTag: 'ORDONNANCE',
    patientName: 'Seydou Diop',
    amount: 400000,
    paymentMethod: 'Wave',
    status: 'SUCCESS',
    treatment: 'Hypertension',
    location: 'Dakar, Sénégal',
    reference: 'DON-2025-06-15-8921',
    patientPhoto: 'assets/images/patient.png',
    impactCoveredPercentage: 100
  },
  {
    id: 'DON-2025-002',
    dateString: '10 juin 2025',
    timeString: '11:15',
    type: 'Analyse',
    typeTag: 'ANALYSE',
    patientName: 'Mamadou Sow',
    amount: 300000,
    paymentMethod: 'Orange Money',
    status: 'PENDING',
    treatment: 'Paludisme',
    location: 'Thies, Sénégal',
    reference: 'DON-2025-06-10-1845',
    patientPhoto: 'assets/images/patient.png',
    impactCoveredPercentage: 80
  },
  {
    id: 'DON-2025-003',
    dateString: '09 juin 2025',
    timeString: '09:40',
    type: 'Imagerie',
    typeTag: 'IMAGERIE',
    patientName: 'Maimouna Fall',
    amount: 800000,
    paymentMethod: 'Wave',
    status: 'SUCCESS',
    treatment: 'Infection',
    location: 'Saint-Louis, Sénégal',
    reference: 'DON-2025-06-09-4322',
    patientPhoto: 'assets/images/medecin.png',
    impactCoveredPercentage: 100
  },
  {
    id: 'DON-2025-004',
    dateString: '10 juin 2025',
    timeString: '15:20',
    type: 'Analyse',
    typeTag: 'ANALYSE',
    patientName: 'Mamadou Sow',
    amount: 300000,
    paymentMethod: 'Orange Money',
    status: 'PENDING',
    treatment: 'Paludisme',
    location: 'Thies, Sénégal',
    reference: 'DON-2025-06-10-9281',
    patientPhoto: 'assets/images/patient.png',
    impactCoveredPercentage: 75
  },
  {
    id: 'DON-2025-005',
    dateString: '15 juin 2025',
    timeString: '17:05',
    type: 'Ordonnance',
    typeTag: 'ORDONNANCE',
    patientName: 'Seydou Diop',
    amount: 400000,
    paymentMethod: 'Wave',
    status: 'SUCCESS',
    treatment: 'Hypertension',
    location: 'Dakar, Sénégal',
    reference: 'DON-2025-06-15-7734',
    patientPhoto: 'assets/images/patient.png',
    impactCoveredPercentage: 100
  },
  {
    id: 'DON-2025-006',
    dateString: '09 juin 2025',
    timeString: '13:10',
    type: 'Imagerie',
    typeTag: 'IMAGERIE',
    patientName: 'Maimouna Fall',
    amount: 800000,
    paymentMethod: 'Wave',
    status: 'SUCCESS',
    treatment: 'Infection',
    location: 'Saint-Louis, Sénégal',
    reference: 'DON-2025-06-09-5112',
    patientPhoto: 'assets/images/medecin.png',
    impactCoveredPercentage: 100
  }
];

@Component({
  selector: 'app-dons-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dons-detail.component.html'
})
export class DonsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  donationId: string | null = null;
  donation: PastDonationDetail | null = null;

  ngOnInit(): void {
    this.donationId = this.route.snapshot.paramMap.get('id');
    if (this.donationId) {
      this.donation = DETAIL_DONATIONS.find(d => d.id === this.donationId) || null;
    }
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('fr-FR');
  }

  goBack(): void {
    this.router.navigate(['/dons-historique']);
  }
}
