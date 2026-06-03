import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface DemandCard {
  title: string;
  value: string;
  icon: 'clipboard' | 'pending' | 'approved' | 'revenue';
  accentClass: string;
  valueClass: string;
}

interface RequestRow {
  patient: string;
  initials: string;
  identifier: string;
  detailId: string;
  requestType: 'Ordonnance' | 'Chirurgie' | 'Examen Labo' | 'Consultation';
  service: string;
  amount: string;
  date: string;
  status: 'En attente' | 'Validé' | 'Payé' | 'Terminé';
  statusClass: string;
  statusDotClass: string;
  rowIcon: 'document' | 'surgery' | 'lab' | 'consultation';
}

@Component({
  selector: 'app-demandes-medicales',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './demandes-medicales.component.html',
  styleUrls: ['./demandes-medicales.component.css']
})
export class DemandesMedicalesComponent {
  readonly periodLabel = 'Ce-mois';

  readonly cards: DemandCard[] = [
    {
      title: 'Total Demandes',
      value: '1,284',
      icon: 'clipboard',
      accentClass: 'bg-[#EEF4FF] text-[#124A92]',
      valueClass: 'text-[#111827]'
    },
    {
      title: 'En Attente',
      value: '42',
      icon: 'pending',
      accentClass: 'bg-[#FFF4EC] text-[#F97316]',
      valueClass: 'text-[#111827]'
    },
    {
      title: 'Validées',
      value: '856',
      icon: 'approved',
      accentClass: 'bg-[#EEF9F0] text-[#2E7D32]',
      valueClass: 'text-[#111827]'
    },
    {
      title: 'Revenu du mois',
      value: '4,200,000 FCFA',
      icon: 'revenue',
      accentClass: 'bg-[#0B3BA7] text-white',
      valueClass: 'text-[#111827]'
    }
  ];

  readonly requestRows: RequestRow[] = [
    {
      patient: 'Moussa Aliou',
      initials: 'MA',
      identifier: 'ID: #45892',
      detailId: '45892',
      requestType: 'Ordonnance',
      service: 'Cardiologie',
      amount: '15,000',
      date: '22 Oct, 2023',
      status: 'En attente',
      statusClass: 'bg-[#FFF1E1] text-[#F97316]',
      statusDotClass: 'bg-[#F97316]',
      rowIcon: 'document'
    },
    {
      patient: 'Fatoumata Binta',
      initials: 'FB',
      identifier: 'ID: #45893',
      detailId: '45893',
      requestType: 'Chirurgie',
      service: 'Bloc Opératoire',
      amount: '850,000',
      date: '21 Oct, 2023',
      status: 'Validé',
      statusClass: 'bg-[#EAF2FF] text-[#2563EB]',
      statusDotClass: 'bg-[#2563EB]',
      rowIcon: 'surgery'
    },
    {
      patient: 'Cheikh Diallo',
      initials: 'CD',
      identifier: 'ID: #45894',
      detailId: '45894',
      requestType: 'Examen Labo',
      service: 'Laboratoire',
      amount: '25,000',
      date: '20 Oct, 2023',
      status: 'Payé',
      statusClass: 'bg-[#E6F7EE] text-[#22A06B]',
      statusDotClass: 'bg-[#22A06B]',
      rowIcon: 'lab'
    },
    {
      patient: 'Aminata Mbaye',
      initials: 'AM',
      identifier: 'ID: #45895',
      detailId: '45895',
      requestType: 'Consultation',
      service: 'Pédiatrie',
      amount: '10,000',
      date: '19 Oct, 2023',
      status: 'Validé',
      statusClass: 'bg-[#EAF2FF] text-[#2563EB]',
      statusDotClass: 'bg-[#2563EB]',
      rowIcon: 'consultation'
    },
    {
      patient: 'Moussa Aliou',
      initials: 'MA',
      identifier: 'ID: #45892',
      detailId: '45892',
      requestType: 'Ordonnance',
      service: 'Cardiologie',
      amount: '20,000',
      date: '19 Oct, 2023',
      status: 'Terminé',
      statusClass: 'bg-[#EFF2F6] text-[#6B7280]',
      statusDotClass: 'bg-[#6B7280]',
      rowIcon: 'document'
    }
  ];

  readonly tableColumns = [
    'Patient',
    'Type de demande',
    'Services',
    'Montant ( FCFA )',
    'Date',
    'Statut',
    'Actions'
  ];

  readonly paginationLabel = '1 - 1 sur 4';

  getRequestTypeLabel(row: RequestRow): string {
    return row.requestType;
  }
}
