import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type StepStatus = 'done' | 'active' | 'upcoming';
type StepIcon = 'check' | 'user' | 'doc';

interface HistoriqueStep {
  label: string;
  date: string;
  status: StepStatus;
  icon: StepIcon;
}

interface Acte {
  nom: string;
  description: string;
  prix: string;
}

interface RecapFinancier {
  total: string;
  financement: string;
  assurance?: string;
  assuranceLabel?: string;
  resteAPayer: string;
}

interface FluxPaiement {
  source: string;
  date: string;
  montant: string;
  iconBg: string;
  iconColor: string;
  iconType: 'don' | 'assurance' | 'paiement';
}

interface DetailPaiement {
  id: string;
  nom: string;
  age: number;
  localisation: string;
  dateAdmission: string;
  dateEmission: string;
  typeService: string;
  service: string;
  praticien: string;
  historique: HistoriqueStep[];
  actes: Acte[];
  recap: RecapFinancier;
  fluxPaiement?: FluxPaiement[];
}

const SHARED_FLUX: FluxPaiement[] = [
  {
    source: 'Donateur\nAnonyme',
    date: '14 Oct. 2023',
    montant: '250 000 FCFA',
    iconBg: 'bg-[#EEF1FD]',
    iconColor: 'text-[#0651B6]',
    iconType: 'don'
  },
  {
    source: 'Assurance\nAXA',
    date: '14 Oct. 2023',
    montant: '100 000 FCFA',
    iconBg: 'bg-[#002D8B]',
    iconColor: 'text-white',
    iconType: 'assurance'
  }
];

@Component({
  selector: 'app-detail-paiement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-paiement.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailPaiementComponent implements OnInit {
  id: string | null = null;
  detail: DetailPaiement | undefined;

  private readonly data: DetailPaiement[] = [
    {
      id: 'PX-8821',
      nom: 'Jean-Pierre Lambert',
      age: 72,
      localisation: 'Unité Chirurgicale - Bloc 04',
      dateAdmission: '12 Oct. 2023',
      dateEmission: '14 octobre 2025',
      typeService: 'Chirurgie',
      service: 'Chirurgie Cardiaque',
      praticien: 'Dr. Elena Rodriguez',
      historique: [
        { label: 'Paiement reçu',        date: '14 Oct. 2023 • 15:42', status: 'done',    icon: 'check' },
        { label: 'Facture approuvée',     date: '14 Oct. 2023 • 10:15', status: 'active',  icon: 'user'  },
        { label: 'Génération de la facture', date: '13 Oct. 2023 • 18:20', status: 'upcoming', icon: 'doc' }
      ],
      actes: [
        { nom: 'Intervention Chirurgicale', description: 'Pontage aorto-coronarien complexe (PAC)', prix: '300 000 FCFA' },
        { nom: 'Anesthésie',                description: 'Anesthésie générale et surveillance réanimatoire',  prix: '50 000 FCFA'  },
        { nom: 'Hospitalisation post-op',   description: 'Soins intensifs 48h post-intervention',              prix: '900 000 FCFA' }
      ],
      recap: {
        total:          '1 250 000 FCFA',
        financement:    '0 FCFA',
        assurance:      '0 FCFA',
        assuranceLabel: 'Assurance',
        resteAPayer:    '0 FCFA'
      },
      fluxPaiement: SHARED_FLUX
    },
    {
      id: 'PX-4429',
      nom: 'Marie-Claire Diop',
      age: 34,
      localisation: 'Unité Maternité - Bloc B',
      dateAdmission: '14 Oct. 2023',
      dateEmission: '14 octobre 2025',
      typeService: 'Hospitalisation',
      service: 'Maternité',
      praticien: 'Dr. Fatou Ndiaye',
      historique: [
        { label: 'Paiement partiel reçu',  date: '14 Oct. 2023 • 15:42', status: 'done',    icon: 'check' },
        { label: 'Facture approuvée',       date: '14 Oct. 2023 • 10:15', status: 'active',  icon: 'user'  },
        { label: 'Génération de la facture',date: '13 Oct. 2023 • 18:20', status: 'upcoming',icon: 'doc'   }
      ],
      actes: [
        { nom: 'Accouchement',       description: 'Accouchement par voie basse assisté',      prix: '200 000 FCFA' },
        { nom: 'Hospitalisation',    description: 'Séjour 3 jours en maternité',               prix: '150 000 FCFA' },
        { nom: 'Soins néonataux',    description: 'Surveillance et soins du nouveau-né',        prix: '100 000 FCFA' }
      ],
      recap: {
        total:          '450 000 FCFA',
        financement:    '250 000 FCFA',
        assurance:      '100 000 FCFA',
        assuranceLabel: 'Assurance AXA (10%)',
        resteAPayer:    '50 000 FCFA'
      },
      fluxPaiement: SHARED_FLUX
    },
    {
      id: 'PX-9102',
      nom: 'Abdoulaye Wade',
      age: 58,
      localisation: 'Service Imagerie - RDC',
      dateAdmission: '15 Oct. 2023',
      dateEmission: '15 octobre 2025',
      typeService: 'Examen',
      service: 'Scanner IRM',
      praticien: 'Dr. Omar Sall',
      historique: [
        { label: 'Demande envoyée',         date: '15 Oct. 2023 • 09:00', status: 'done',    icon: 'check' },
        { label: 'Examen réalisé',           date: '15 Oct. 2023 • 11:30', status: 'active',  icon: 'user'  },
        { label: 'Facture en attente',       date: '',                     status: 'upcoming',icon: 'doc'   }
      ],
      actes: [
        { nom: 'Scanner cérébral',  description: 'IRM cérébrale avec injection de gadolinium', prix: '55 000 FCFA' },
        { nom: 'Lecture radiologie',description: 'Interprétation et rapport médical',           prix: '30 000 FCFA' }
      ],
      recap: {
        total:       '85 000 FCFA',
        financement: '0 FCFA',
        resteAPayer: '85 000 FCFA'
      },
      fluxPaiement: SHARED_FLUX
    },
    {
      id: 'PX-3301',
      nom: 'Aïssatou Diallo',
      age: 29,
      localisation: 'Consultation Externe - Aile C',
      dateAdmission: '16 Oct. 2023',
      dateEmission: '16 octobre 2025',
      typeService: 'Consultation',
      service: 'Gynécologie',
      praticien: 'Dr. Mariama Balde',
      historique: [
        { label: 'Paiement reçu',   date: '16 Oct. 2023 • 14:00', status: 'done',   icon: 'check' },
        { label: 'Facture clôturée',date: '16 Oct. 2023 • 14:05', status: 'done',   icon: 'check' },
        { label: 'Archivé',         date: '16 Oct. 2023 • 15:00', status: 'active', icon: 'doc'   }
      ],
      actes: [
        { nom: 'Consultation spécialisée', description: 'Consultation gynécologique de suivi', prix: '25 000 FCFA' },
        { nom: 'Échographie',              description: 'Échographie obstétricale',             prix: '10 000 FCFA' }
      ],
      recap: {
        total:       '35 000 FCFA',
        financement: '35 000 FCFA',
        resteAPayer: '0 FCFA'
      },
      fluxPaiement: SHARED_FLUX
    },
    {
      id: 'PX-5522',
      nom: 'Ousmane Sarr',
      age: 61,
      localisation: 'Service Neurologie - Aile A',
      dateAdmission: '17 Oct. 2023',
      dateEmission: '17 octobre 2025',
      typeService: 'Hospitalisation',
      service: 'Neurologie',
      praticien: 'Dr. Cheikh Fall',
      historique: [
        { label: 'Admission enregistrée',  date: '17 Oct. 2023 • 08:00', status: 'done',    icon: 'check' },
        { label: 'Paiement partiel reçu',  date: '17 Oct. 2023 • 12:00', status: 'active',  icon: 'user'  },
        { label: 'Solde en attente',        date: '',                     status: 'upcoming', icon: 'doc'   }
      ],
      actes: [
        { nom: 'Hospitalisation J1-J5', description: 'Séjour 5 jours en neurologie',        prix: '200 000 FCFA' },
        { nom: 'IRM cérébrale',         description: 'Imagerie par résonance magnétique',   prix: '70 000 FCFA'  },
        { nom: 'Rééducation',           description: 'Séances de kinésithérapie (x5)',       prix: '50 000 FCFA'  }
      ],
      recap: {
        total:       '320 000 FCFA',
        financement: '160 000 FCFA',
        resteAPayer: '160 000 FCFA'
      },
      fluxPaiement: SHARED_FLUX
    },
    {
      id: 'PX-7741',
      nom: "Amadou M'Baye",
      age: 52,
      localisation: 'Bloc Orthopédie - Aile Est',
      dateAdmission: '18 Oct. 2023',
      dateEmission: '18 octobre 2025',
      typeService: 'Chirurgie',
      service: 'Orthopédie',
      praticien: 'Dr. Henri Lavoie',
      historique: [
        { label: 'Dossier ouvert',          date: '18 Oct. 2023 • 09:00', status: 'done',    icon: 'check' },
        { label: 'Intervention planifiée',  date: '18 Oct. 2023 • 14:00', status: 'active',  icon: 'user'  },
        { label: 'Facture non réglée',      date: '',                     status: 'upcoming', icon: 'doc'   }
      ],
      actes: [
        { nom: 'Arthroplastie genou',   description: 'Pose prothèse totale genou droit',   prix: '500 000 FCFA' },
        { nom: 'Anesthésie loco-régio.', description: 'Anesthésie rachidienne',            prix: '80 000 FCFA'  },
        { nom: 'Rééducation post-op',    description: 'Programme kiné 10 séances',        prix: '200 000 FCFA' }
      ],
      recap: {
        total:       '780 000 FCFA',
        financement: '0 FCFA',
        resteAPayer: '780 000 FCFA'
      },
      fluxPaiement: SHARED_FLUX
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.detail = this.data.find(d => d.id === this.id) ?? this.buildFallback();
  }

  back(): void {
    this.router.navigate(['/paiements-hospital']);
  }

  stepIconBg(status: StepStatus): string {
    switch (status) {
      case 'done':     return 'bg-[#059669] text-white';
      case 'active':   return 'bg-[#1E3A6E] text-white';
      case 'upcoming': return 'bg-[#E2E8F0] text-[#94A3B8]';
    }
  }

  private buildFallback(): DetailPaiement {
    const base = this.data[0];
    return {
      ...base,
      id: this.id ?? '—',
      nom: 'Patient',
      localisation: '—',
      dateAdmission: '—',
      praticien: '—',
      fluxPaiement: []
    };
  }
}
