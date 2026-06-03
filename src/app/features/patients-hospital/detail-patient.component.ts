import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface PatientDetail {
  patientId: string;
  fullname: string;
  age: number;
  genderLabel: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  photoUrl?: string;
  currentService: string;
}

interface PatientStat {
  label: string;
  value: string;
  icon: 'requests' | 'completed' | 'funding' | 'service';
  toneClass: string;
  trend?: string;
}

interface AssociatedRequest {
  type: string;
  status: 'APPROUVÉ' | 'EN ATTENTE' | 'TERMINÉ' | 'REFUSÉ';
  montant: string;
  service: string;
}

type CareStepStatus = 'completed' | 'active' | 'upcoming';

interface CarePathwayStep {
  title: string;
  subtitle: string;
  description: string;
  status: CareStepStatus;
  icon: 'check' | 'bed' | 'scalpel' | 'flag';
  actionLabel?: string;
}

@Component({
  selector: 'app-detail-patient',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-patient.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailPatientComponent implements OnInit {
  patientId: string | null = null;
  patient: PatientDetail | undefined;

  stats: PatientStat[] = [];

  demandes: AssociatedRequest[] = [];

  parcours: CarePathwayStep[] = [];

  private readonly patients: PatientDetail[] = [
    {
      patientId: 'PAT-1144',
      fullname: 'Ismael Diop',
      age: 45,
      genderLabel: 'Homme',
      bloodGroup: 'O Positive (O+)',
      phone: '+221 77 000 00 00',
      email: 'ismael.diop@email.com',
      address: 'Casamance, Sénégal',
      currentService: 'Orthopédie'
    },
    {
      patientId: 'PAT-7741',
      fullname: 'Amadou M’Baye',
      age: 52,
      genderLabel: 'Homme',
      bloodGroup: 'A Positive (A+)',
      phone: '+221 77 123 45 67',
      email: 'amadou.mbaye@email.com',
      address: 'Thiès, Sénégal',
      currentService: 'Cardiologie'
    },
    {
      patientId: 'PAT-9012',
      fullname: 'Fatima Sow',
      age: 34,
      genderLabel: 'Femme',
      bloodGroup: 'B Positive (B+)',
      phone: '+221 76 555 12 34',
      email: 'fatima.sow@email.com',
      address: 'Saint-Louis, Sénégal',
      currentService: 'Oncologie'
    },
    {
      patientId: 'PAT-6610',
      fullname: 'Moussa Traoré',
      age: 8,
      genderLabel: 'Homme',
      bloodGroup: 'AB Positive (AB+)',
      phone: '+221 78 000 11 22',
      email: 'moussa.traore@email.com',
      address: 'Dakar, Sénégal',
      currentService: 'Pédiatrie'
    },
    {
      patientId: 'PAT-3301',
      fullname: 'Aïssatou Diallo',
      age: 29,
      genderLabel: 'Femme',
      bloodGroup: 'O Négatif (O-)',
      phone: '+221 70 456 78 90',
      email: 'aissatou.diallo@email.com',
      address: 'Ziguinchor, Sénégal',
      currentService: 'Gynécologie'
    },
    {
      patientId: 'PAT-5522',
      fullname: 'Ousmane Sarr',
      age: 61,
      genderLabel: 'Homme',
      bloodGroup: 'A Négatif (A-)',
      phone: '+221 77 321 00 99',
      email: 'ousmane.sarr@email.com',
      address: 'Louga, Sénégal',
      currentService: 'Neurologie'
    },
    {
      patientId: 'PAT-8890',
      fullname: 'Mariama Balde',
      age: 42,
      genderLabel: 'Femme',
      bloodGroup: 'B Négatif (B-)',
      phone: '+221 76 789 00 33',
      email: 'mariama.balde@email.com',
      address: 'Kaolack, Sénégal',
      currentService: 'Endocrinologie'
    },
    {
      patientId: 'PAT-2278',
      fullname: 'Cheikh Ndiaye',
      age: 55,
      genderLabel: 'Homme',
      bloodGroup: 'O Positive (O+)',
      phone: '+221 70 111 22 33',
      email: 'cheikh.ndiaye@email.com',
      address: 'Diourbel, Sénégal',
      currentService: 'Cardiologie'
    }
  ];

  private readonly statsByPatient: Record<string, PatientStat[]> = {
    'PAT-1144': [
      { label: 'Demandes totales', value: '08', icon: 'requests', toneClass: 'bg-[#EAF2FF] text-[#2563EB]', trend: '+12%' },
      { label: 'Soins terminés', value: '05', icon: 'completed', toneClass: 'bg-[#EAF8F1] text-[#2FA373]' },
      { label: 'Financement total', value: '4.5M FCFA', icon: 'funding', toneClass: 'bg-[#FEECEC] text-[#EF4444]' },
      { label: 'Service actuel', value: 'Cardiologie', icon: 'service', toneClass: 'bg-[#EAF2FF] text-[#2563EB]' }
    ],
    'PAT-7741': [
      { label: 'Demandes totales', value: '06', icon: 'requests', toneClass: 'bg-[#EAF2FF] text-[#2563EB]', trend: '+8%' },
      { label: 'Soins terminés', value: '04', icon: 'completed', toneClass: 'bg-[#EAF8F1] text-[#2FA373]' },
      { label: 'Financement total', value: '2.1M FCFA', icon: 'funding', toneClass: 'bg-[#FEECEC] text-[#EF4444]' },
      { label: 'Service actuel', value: 'Cardiologie', icon: 'service', toneClass: 'bg-[#EAF2FF] text-[#2563EB]' }
    ],
    'PAT-9012': [
      { label: 'Demandes totales', value: '04', icon: 'requests', toneClass: 'bg-[#EAF2FF] text-[#2563EB]', trend: '+5%' },
      { label: 'Soins terminés', value: '02', icon: 'completed', toneClass: 'bg-[#EAF8F1] text-[#2FA373]' },
      { label: 'Financement total', value: '1.8M FCFA', icon: 'funding', toneClass: 'bg-[#FEECEC] text-[#EF4444]' },
      { label: 'Service actuel', value: 'Oncologie', icon: 'service', toneClass: 'bg-[#EAF2FF] text-[#2563EB]' }
    ]
  };

  private readonly demandesByPatient: Record<string, AssociatedRequest[]> = {
    'PAT-1144': [
      { type: 'Chirurgie Cardiaque', status: 'APPROUVÉ', montant: '2,800,000 FCFA', service: 'Cardiologie' },
      { type: 'Analyses Laboratoire', status: 'EN ATTENTE', montant: '150,000 FCFA', service: 'Biologie' },
      { type: 'Consultation Spécialisée', status: 'TERMINÉ', montant: '45,000 FCFA', service: 'Cardiologie' }
    ],
    'PAT-7741': [
      { type: 'Consultation Cardiologie', status: 'TERMINÉ', montant: '75,000 FCFA', service: 'Cardiologie' },
      { type: 'Échographie', status: 'APPROUVÉ', montant: '120,000 FCFA', service: 'Cardiologie' }
    ],
    'PAT-9012': [
      { type: 'Chimiothérapie', status: 'EN ATTENTE', montant: '890,000 FCFA', service: 'Oncologie' },
      { type: 'Imagerie', status: 'APPROUVÉ', montant: '210,000 FCFA', service: 'Radiologie' }
    ]
  };

  private readonly parcoursByPatient: Record<string, CarePathwayStep[]> = {
    'PAT-1144': [
      {
        title: 'Création demande',
        subtitle: '12 Octobre 2023, 09:45',
        description: 'Ouverture du dossier médical pour suspicion de cardiopathie ischémique. Document d\'identité et justificatifs de résidence validés.',
        status: 'completed',
        icon: 'check'
      },
      {
        title: 'Financement',
        subtitle: '15 Octobre 2023, 14:20',
        description: 'Accord de prise en charge à 100% obtenu via le fond d\'aide gouvernemental. Budget alloué : 4.5M FCFA.',
        status: 'completed',
        icon: 'check'
      },
      {
        title: 'Examens',
        subtitle: '22 Octobre 2023, 08:00',
        description: 'Électrocardiogramme, Échographie cardiaque et Coronarographie réalisés au pôle technique.',
        status: 'completed',
        icon: 'check',
        actionLabel: 'Résultats'
      },
      {
        title: 'Hospitalisation',
        subtitle: 'EN COURS',
        description: 'Admis en Unité de Soins Intensifs (USI) - Chambre 402. Préparation pré-opératoire initiée par le Dr. Koulibaly.',
        status: 'active',
        icon: 'bed'
      },
      {
        title: 'Chirurgie',
        subtitle: 'Prévu le 05 Nov 2023',
        description: 'Pontage aorto-coronarien programmé sous réserve de stabilité des constantes vitales.',
        status: 'upcoming',
        icon: 'scalpel'
      },
      {
        title: 'Fin de traitement',
        subtitle: '',
        description: 'Étape conditionnée au succès de l\'intervention chirurgicale.',
        status: 'upcoming',
        icon: 'flag'
      }
    ],
    'PAT-7741': [
      {
        title: 'Création demande',
        subtitle: '03 Septembre 2023, 11:30',
        description: 'Dossier ouvert pour suivi post-infarctus. Bilan initial transmis au service de cardiologie.',
        status: 'completed',
        icon: 'check'
      },
      {
        title: 'Financement',
        subtitle: '08 Septembre 2023, 16:00',
        description: 'Prise en charge partielle validée. Budget alloué : 2.1M FCFA.',
        status: 'completed',
        icon: 'check'
      },
      {
        title: 'Consultation',
        subtitle: 'EN COURS',
        description: 'Suivi ambulatoire en cours avec le Dr. Ndiaye. Prochain rendez-vous programmé.',
        status: 'active',
        icon: 'bed'
      }
    ],
    'PAT-9012': [
      {
        title: 'Création demande',
        subtitle: '20 Janvier 2024, 08:15',
        description: 'Orientation oncologique suite aux résultats d\'imagerie. Dossier complet transmis.',
        status: 'completed',
        icon: 'check'
      },
      {
        title: 'Chimiothérapie',
        subtitle: 'Prévu le 12 Fév 2024',
        description: 'Première cure programmée après validation du protocole thérapeutique.',
        status: 'upcoming',
        icon: 'scalpel'
      }
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId) {
      this.patient = this.patients.find(p => p.patientId === this.patientId);

      // Fallback sur PAT-1144 pour les patients sans données spécifiques
      const fallbackStats = this.statsByPatient['PAT-1144'];
      const fallbackDemandes = this.demandesByPatient['PAT-1144'];
      const fallbackParcours = this.parcoursByPatient['PAT-1144'];

      this.stats = this.statsByPatient[this.patientId] ?? fallbackStats.map(s => ({
        ...s,
        value: s.icon === 'service' ? (this.patient?.currentService ?? s.value) : s.value
      }));
      this.demandes = this.demandesByPatient[this.patientId] ?? fallbackDemandes;
      this.parcours = this.parcoursByPatient[this.patientId] ?? fallbackParcours;
    }
  }

  back(): void {
    this.router.navigate(['/patients-hospital']);
  }

  statusClass(status: AssociatedRequest['status']): string {
    switch (status) {
      case 'APPROUVÉ':
        return 'bg-[#EAF8F1] text-[#2FA373]';
      case 'EN ATTENTE':
        return 'bg-[#EAF2FF] text-[#2563EB]';
      case 'TERMINÉ':
        return 'bg-[#F1F5F9] text-[#64748B]';
      case 'REFUSÉ':
        return 'bg-[#FEE2E2] text-[#DC2626]';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  stepIconClass(status: CareStepStatus): string {
    switch (status) {
      case 'completed':
        return 'bg-[#2FA373] text-white';
      case 'active':
        return 'bg-[#2563EB] text-white';
      case 'upcoming':
        return 'bg-[#F1F5F9] text-[#CBD5E1]';
      default:
        return 'bg-slate-100 text-slate-400';
    }
  }

  stepTitleClass(status: CareStepStatus): string {
    switch (status) {
      case 'completed':
        return 'text-[#0F172A]';
      case 'active':
        return 'text-[#2563EB]';
      case 'upcoming':
        return 'text-[#64748B]';
      default:
        return 'text-slate-600';
    }
  }

  stepSubtitleClass(status: CareStepStatus): string {
    switch (status) {
      case 'active':
        return 'text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]';
      case 'upcoming':
        return 'text-xs text-[#94A3B8]';
      default:
        return 'text-xs text-[#94A3B8]';
    }
  }

  stepBoxClass(status: CareStepStatus): string {
    switch (status) {
      case 'completed':
        return 'bg-[#F8FAFC] text-[#475569]';
      case 'active':
        return 'border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]';
      case 'upcoming':
        return 'border border-dashed border-[#CBD5E1] bg-white text-[#94A3B8]';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  }
}
