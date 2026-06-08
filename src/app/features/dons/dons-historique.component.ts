import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface PastDonation {
  id: string;
  date: Date;
  dateString: string;
  type: 'ORDONNANCE' | 'ANALYSE' | 'IMAGERIE';
  patientName: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  treatment: string;
}

@Component({
  selector: 'app-dons-historique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dons-historique.component.html'
})
export class DonsHistoriqueComponent implements OnInit {
  donations: PastDonation[] = [];
  filteredDonations: PastDonation[] = [];
  
  // Active period filter
  activeFilter: 'TOUS' | 'MOIS' | 'SEMAINE' = 'TOUS';
  
  // Banner stats (matches the visual layout)
  totalDonated: number = 15000000;
  viesImpactees: number = 3;

  ngOnInit(): void {
    const now = new Date();
    this.donations = [
      {
        id: 'DON-2025-001',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (within week & month)
        dateString: '15 juin 2025',
        type: 'ORDONNANCE',
        patientName: 'Seydou Diop',
        amount: 400000,
        paymentMethod: 'Wave',
        status: 'SUCCESS',
        treatment: 'Hypertension'
      },
      {
        id: 'DON-2025-002',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (within week & month)
        dateString: '10 juin 2025',
        type: 'ANALYSE',
        patientName: 'Mamadou Sow',
        amount: 300000,
        paymentMethod: 'Orange Money',
        status: 'PENDING',
        treatment: 'Paludisme'
      },
      {
        id: 'DON-2025-003',
        date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago (within month)
        dateString: '09 juin 2025',
        type: 'IMAGERIE',
        patientName: 'Maimouna Fall',
        amount: 800000,
        paymentMethod: 'Wave',
        status: 'SUCCESS',
        treatment: 'Infection'
      },
      {
        id: 'DON-2025-004',
        date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago (within month)
        dateString: '10 juin 2025',
        type: 'ANALYSE',
        patientName: 'Mamadou Sow',
        amount: 300000,
        paymentMethod: 'Orange Money',
        status: 'PENDING',
        treatment: 'Paludisme'
      },
      {
        id: 'DON-2025-005',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (within week & month)
        dateString: '15 juin 2025',
        type: 'ORDONNANCE',
        patientName: 'Seydou Diop',
        amount: 400000,
        paymentMethod: 'Wave',
        status: 'SUCCESS',
        treatment: 'Hypertension'
      },
      {
        id: 'DON-2025-006',
        date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 days ago (within month)
        dateString: '09 juin 2025',
        type: 'IMAGERIE',
        patientName: 'Maimouna Fall',
        amount: 800000,
        paymentMethod: 'Wave',
        status: 'SUCCESS',
        treatment: 'Infection'
      }
    ];
    this.applyFilter('TOUS');
  }

  applyFilter(filterType: 'TOUS' | 'MOIS' | 'SEMAINE'): void {
    this.activeFilter = filterType;
    const now = new Date();
    
    if (filterType === 'TOUS') {
      this.filteredDonations = [...this.donations];
    } else if (filterType === 'MOIS') {
      // Last 30 days
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      this.filteredDonations = this.donations.filter(d => d.date >= oneMonthAgo);
    } else if (filterType === 'SEMAINE') {
      // Last 7 days
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.filteredDonations = this.donations.filter(d => d.date >= oneWeekAgo);
    }
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('fr-FR');
  }

  getFirstName(name: string): string {
    return name.split(' ')[0] || '';
  }

  getLastName(name: string): string {
    return name.split(' ').slice(1).join(' ') || '';
  }
}


