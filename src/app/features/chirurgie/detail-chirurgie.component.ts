import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type StepStatus = 'completed' | 'active' | 'upcoming';

interface TimelineStep {
  label: string;
  status: StepStatus;
  icon: 'check' | 'clock' | 'case' | 'monitor' | 'flag';
  subtitle?: string;
}

interface ChirurgieDetail {
  id: string;
  fullname: string;
  statusLabel: string;
  statusClass: string;
  typeIntervention: string;
  dateAdmission: string;
  blocOperatoire: string;
  chirurgienPrincipal: string;
  anesthesiste: string;
  allergies: string[];
  antecedents: string[];
  diagnostic: string;
  descriptionClinique: string;
  technicalDetails: string[];
  dureEstimee: string;
  totalAmount: string;
  fundingStatus: string;
  resteACharge: string;
  timeline: TimelineStep[];
}

@Component({
  selector: 'app-detail-chirurgie',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-chirurgie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailChirurgieComponent implements OnInit {
  id: string | null = null;
  detail: ChirurgieDetail | undefined;
  stayInfo: { icon: string; label: string; value: string; isBlue?: boolean }[] = [];
  isStartModalOpen: boolean = false;

  private readonly data: ChirurgieDetail[] = [
    {
      id: 'PX-8821',
      fullname: 'Elena Rodriguez',
      statusLabel: 'Urgent',
      statusClass: 'bg-[#FEE2E2] text-[#DC2626]',
      typeIntervention: 'Appendicectomie',
      dateAdmission: "Aujourd'hui, 24 oct., 09:15",
      blocOperatoire: 'Salle 02 (Aile Nord)',
      chirurgienPrincipal: 'Dr. Marcus Thorne',
      anesthesiste: 'Dr. Smith Meyer',
      allergies: ['Pénicilline', 'Latex'],
      antecedents: ['Hypertension', 'Diabète Type 2'],
      diagnostic: 'Appendicite aiguë avec risque de perforation imminent. Douleur en fosse iliaque droite.',
      descriptionClinique: 'Appendicectomie par laparoscopie. Patient à jeun depuis 6h. Antibioprophylaxie administrée.',
      technicalDetails: [
        'Abord par laparoscopie',
        'Antibioprophylaxie préopératoire',
        'Durée estimée:'
      ],
      dureEstimee: '60 minutes',
      totalAmount: '800 000',
      fundingStatus: 'Prise en charge mutuelle validée à 100%',
      resteACharge: '0 FCFA',
      timeline: [
        { label: 'Planification', status: 'completed', icon: 'check', subtitle: "Aujourd'hui, 08:00" },
        { label: 'Préparation', status: 'active', icon: 'clock', subtitle: 'En cours' },
        { label: 'Intervention', status: 'upcoming', icon: 'case' },
        { label: 'Post-opératoire', status: 'upcoming', icon: 'monitor' },
        { label: 'Terminé', status: 'upcoming', icon: 'flag' }
      ]
    },
    {
      id: 'PX-9014',
      fullname: 'Julian Schmidt',
      statusLabel: 'En préparation',
      statusClass: 'bg-[#DBEAFE] text-[#2563EB]',
      typeIntervention: 'Arthroscopie du genou',
      dateAdmission: '24 Oct. 2023, 08:00',
      blocOperatoire: 'Salle 04 (Ailes Est)',
      chirurgienPrincipal: 'Dr. Sarah Jenkins',
      anesthesiste: 'Dr. Smith Meyer',
      allergies: ['Aspirine'],
      antecedents: ['Entorse chronique genou droit'],
      diagnostic: 'Lésion méniscale interne droite avec épanchement articulaire confirmé à l\'IRM.',
      descriptionClinique: 'Arthroscopie diagnostique et thérapeutique du genou droit sous anesthésie générale.',
      technicalDetails: [
        'Abord arthroscopique standard',
        'Méniscectomie partielle prévue',
        'Durée estimée:'
      ],
      dureEstimee: '90 minutes',
      totalAmount: '1 200 000',
      fundingStatus: 'Prise en charge mutuelle validée à 85%',
      resteACharge: '180 000 FCFA',
      timeline: [
        { label: 'Planification', status: 'completed', icon: 'check', subtitle: '23 Oct, 14:00' },
        { label: 'Préparation', status: 'active', icon: 'clock', subtitle: 'En cours' },
        { label: 'Intervention', status: 'upcoming', icon: 'case' },
        { label: 'Post-opératoire', status: 'upcoming', icon: 'monitor' },
        { label: 'Terminé', status: 'upcoming', icon: 'flag' }
      ]
    },
    {
      id: 'PX-7742',
      fullname: 'Clara Beaumont',
      statusLabel: 'Planifié',
      statusClass: 'bg-[#F1F5F9] text-[#475569]',
      typeIntervention: 'Cholecystectomie',
      dateAdmission: 'Demain, 25 oct., 11:30',
      blocOperatoire: 'Salle 01 (Aile Sud)',
      chirurgienPrincipal: 'Dr. Henri Lavoie',
      anesthesiste: 'Dr. Anne Morel',
      allergies: ['Iode'],
      antecedents: ['Lithiase biliaire', 'Cholécystite'],
      diagnostic: 'Cholécystite chronique lithiasique avec calculs multiples. Indication chirurgicale retenue.',
      descriptionClinique: 'Cholecystectomie laparoscopique élective. Bilan pré-opératoire complet validé.',
      technicalDetails: [
        'Abord laparoscopique 4 trocarts',
        'Cholangiographie peropératoire',
        'Durée estimée:'
      ],
      dureEstimee: '75 minutes',
      totalAmount: '950 000',
      fundingStatus: 'Prise en charge mutuelle validée à 90%',
      resteACharge: '95 000 FCFA',
      timeline: [
        { label: 'Planification', status: 'completed', icon: 'check', subtitle: '22 Oct, 10:00' },
        { label: 'Préparation', status: 'upcoming', icon: 'clock' },
        { label: 'Intervention', status: 'upcoming', icon: 'case' },
        { label: 'Post-opératoire', status: 'upcoming', icon: 'monitor' },
        { label: 'Terminé', status: 'upcoming', icon: 'flag' }
      ]
    },
    {
      id: 'PX-6612',
      fullname: 'Albert Fischer',
      statusLabel: 'Terminé',
      statusClass: 'bg-[#DCFCE7] text-[#16A34A]',
      typeIntervention: 'Cure de hernie',
      dateAdmission: 'Hier, 23 oct., 14:00',
      blocOperatoire: 'Salle 03 (Aile Nord)',
      chirurgienPrincipal: 'Dr. Marcus Thorne',
      anesthesiste: 'Dr. Anne Morel',
      allergies: ['Aucune connue'],
      antecedents: ['Hernie inguinale bilatérale'],
      diagnostic: 'Hernie inguinale droite irréductible. Intervention en urgence différée.',
      descriptionClinique: 'Cure de hernie inguinale droite par technique de Lichtenstein sous anesthésie locorégionale.',
      technicalDetails: [
        'Abord inguinal direct',
        'Pose de prothèse synthétique',
        'Durée estimée:'
      ],
      dureEstimee: '50 minutes',
      totalAmount: '600 000',
      fundingStatus: 'Prise en charge totale validée',
      resteACharge: '0 FCFA',
      timeline: [
        { label: 'Planification', status: 'completed', icon: 'check', subtitle: '22 Oct, 09:00' },
        { label: 'Préparation', status: 'completed', icon: 'check', subtitle: '23 Oct, 12:00' },
        { label: 'Intervention', status: 'completed', icon: 'check', subtitle: '23 Oct, 14:00' },
        { label: 'Post-opératoire', status: 'completed', icon: 'check', subtitle: '23 Oct, 16:30' },
        { label: 'Terminé', status: 'active', icon: 'flag', subtitle: 'Sorti' }
      ]
    },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.detail = this.data.find(d => d.id === this.id);
    if (this.detail) {
      this.stayInfo = [
        { icon: 'calendar', label: "Date d'admission", value: this.detail.dateAdmission },
        { icon: 'room', label: 'Bloc Opératoire', value: this.detail.blocOperatoire },
        { icon: 'doctor', label: 'Chirurgien principal', value: this.detail.chirurgienPrincipal, isBlue: true },
        { icon: 'doctor', label: 'Anesthésiste', value: this.detail.anesthesiste }
      ];
    }
  }

  back(): void {
    this.router.navigate(['/chirurgie']);
  }

  stepIconBg(status: StepStatus): string {
    switch (status) {
      case 'completed': return 'bg-[#2563EB] text-white';
      case 'active':    return 'bg-[#2563EB] text-white ring-4 ring-[#BFDBFE]';
      case 'upcoming':  return 'bg-[#E2E8F0] text-[#94A3B8]';
    }
  }

  stepLabelClass(status: StepStatus): string {
    switch (status) {
      case 'completed': return 'font-semibold text-[#2563EB]';
      case 'active':    return 'font-semibold text-[#2563EB]';
      case 'upcoming':  return 'text-[#94A3B8]';
    }
  }

  stepLineClass(status: StepStatus): string {
    return status === 'completed' ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]';
  }

  openStartModal(): void {
    this.isStartModalOpen = true;
  }

  closeStartModal(): void {
    this.isStartModalOpen = false;
  }

  confirmStart(): void {
    if (this.detail) {
      const updatedTimeline = this.detail.timeline.map(step => {
        if (step.label === 'Préparation') {
          return { ...step, status: 'completed' as StepStatus, subtitle: 'Terminé' };
        }
        if (step.label === 'Intervention') {
          return { ...step, status: 'active' as StepStatus, subtitle: 'En cours' };
        }
        return step;
      });

      this.detail = {
        ...this.detail,
        statusLabel: 'En cours',
        statusClass: 'bg-[#FEF3C7] text-[#D97706]',
        timeline: updatedTimeline
      };
    }
    this.closeStartModal();
  }
}
