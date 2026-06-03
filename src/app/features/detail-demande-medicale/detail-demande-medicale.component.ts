import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface MedicalDocument {
  name: string;
  size: string;
  type: 'pdf' | 'image';
}

interface RequestDetailModel {
  patientName: string;
  patientId: string;
  age: string;
  location: string;
  referentDoctor: string;
  serviceConcerned: string;
  serviceChief: string;
  floor: string;
  urgency: string;
  section: string;
  description: string;
  actType: string;
  priority: string;
  totalAmount: string;
  financedAmount: string;
  financedPercent: string;
  remainingAmount: string;
  financeNote: string;
  documents: MedicalDocument[];
  history: {
    title: string;
    meta: string;
    dateTime: string;
    tone: 'green' | 'blue' | 'gray';
  }[];
}

@Component({
  selector: 'app-detail-demande-medicale',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-demande-medicale.component.html',
  styleUrls: ['./detail-demande-medicale.component.css']
})
export class DetailDemandeMedicaleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly requestId = this.route.snapshot.paramMap.get('id') ?? '45893';

  readonly requestDetail: RequestDetailModel = this.getRequestDetail(this.requestId);

  goBack(): void {
    this.location.back();
  }

  private getRequestDetail(id: string): RequestDetailModel {
    const details: Record<string, RequestDetailModel> = {
      '45893': {
        patientName: 'Fatoumata Binta',
        patientId: 'PT-90122',
        age: '32 ans',
        location: 'Dakar, Sénégal',
        referentDoctor: 'Dr. Aliyah Diop',
        serviceConcerned: 'Bloc Opératoire - Unité B',
        serviceChief: 'Dr. Jean-Pierre Kouassi',
        floor: '3ème Étage, Aile Nord',
        urgency: '! Urgent',
        section: 'Urgence Médicale - Niveau 1',
        description:
          'Le patient présente une cholécystite aiguë nécessitant une intervention chirurgicale immédiate (cholécystectomie). Une hospitalisation de 3 jours est prévue pour le suivi post-opératoire. Aucune allergie connue aux anesthésiques rapportée.',
        actType: 'Chirurgie Digestive',
        priority: 'Haute Urgence',
        totalAmount: '850,000 CFA',
        financedAmount: '680,000 CFA',
        financedPercent: '80% Collecté',
        remainingAmount: 'Reste: 170,000 CFA',
        financeNote: 'Le financement est suffisant pour débuter l’intervention.',
        documents: [
          { name: 'Ordonnance.pdf', size: '1.2 MB', type: 'pdf' },
          { name: 'scan_result.jpg', size: '4.5 MB', type: 'image' }
        ],
        history: [
          {
            title: 'Demande Validée',
            meta: 'Par Dr. Admin - Il y a 2 heures',
            dateTime: '24/10/2024 - 14:30',
            tone: 'green'
          },
          {
            title: 'Paiement Partiel Reçu',
            meta: 'Opération #TRX-9920',
            dateTime: '24/10/2024 - 11:15',
            tone: 'blue'
          },
          {
            title: 'Demande Créée',
            meta: 'Dépôt du dossier initial',
            dateTime: '23/10/2024 - 09:45',
            tone: 'gray'
          }
        ]
      }
    };

    return details[id] ?? details['45893'];
  }
}
