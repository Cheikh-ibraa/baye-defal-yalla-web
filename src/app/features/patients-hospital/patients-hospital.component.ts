import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

interface HospitalPatientStat {
  label: string;
  value: string;
  icon: 'patients' | 'critical' | 'discharged' | 'calendar';
  toneClass: string;
}

interface PatientFilter {
  label: string;
  isActive?: boolean;
}

interface HospitalPatientCard {
  patientId: string;
  fullname: string;
  age: number;
  gender: 'H' | 'F';
  location: string;
  specialty: string;
  lastActivity: string;
  status: 'URGENT' | 'SUIVI' | 'EN TRAITEMENT' | 'TERMINÉ';
  statusClass: string;
}

@Component({
  selector: 'app-patients-hospital',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patients-hospital.component.html',
  styleUrls: ['./patients-hospital.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientsHospitalComponent {
  readonly periodLabel = 'Ce-mois';

  readonly stats: HospitalPatientStat[] = [
    {
      label: 'Total patients',
      value: '1,284',
      icon: 'patients',
      toneClass: 'bg-[#EAF2FF] text-[#2563EB]'
    },
    {
      label: 'Cas urgents',
      value: '12',
      icon: 'critical',
      toneClass: 'bg-[#FFF3E8] text-[#F97316]'
    },
    {
      label: 'Sorties du jour',
      value: '34',
      icon: 'discharged',
      toneClass: 'bg-[#EAF8F1] text-[#2FA373]'
    },
    {
      label: 'Rendez-vous',
      value: '48',
      icon: 'calendar',
      toneClass: 'bg-[#F3EDFF] text-[#7C3AED]'
    }
  ];

  readonly filters: PatientFilter[] = [
    { label: 'Tous', isActive: true },
    { label: 'En traitement' },
    { label: 'Urgents' },
    { label: 'Terminés' },
    { label: 'Suivi' }
  ];

  readonly patients: HospitalPatientCard[] = [
    {
      patientId: 'PAT-1144',
      fullname: 'Ismael Diop',
      age: 45,
      gender: 'H',
      location: 'Casamance, Sénégal',
      specialty: 'Orthopédie',
      lastActivity: 'Dernière activité: Radio effectuée ce matin',
      status: 'URGENT',
      statusClass: 'bg-[#FBE5DF] text-[#CB5A37]'
    },
    {
      patientId: 'PAT-7741',
      fullname: 'Amadou M’Baye',
      age: 52,
      gender: 'H',
      location: 'Thiès, Sénégal',
      specialty: 'Cardiologie',
      lastActivity: 'Dernière activité: Consultation post-opératoire OK',
      status: 'SUIVI',
      statusClass: 'bg-[#E5ECFF] text-[#2557D8]'
    },
    {
      patientId: 'PAT-9012',
      fullname: 'Fatima Sow',
      age: 34,
      gender: 'F',
      location: 'Saint-Louis, Sénégal',
      specialty: 'Oncologie',
      lastActivity: 'Dernière activité: Chimiothérapie S3 effectuée',
      status: 'EN TRAITEMENT',
      statusClass: 'bg-[#FDEFD9] text-[#BC7A1F]'
    },
    {
      patientId: 'PAT-6610',
      fullname: 'Moussa Traoré',
      age: 8,
      gender: 'H',
      location: 'Dakar, Sénégal',
      specialty: 'Pédiatrie',
      lastActivity: 'Dernière activité: Sortie de l’hôpital hier',
      status: 'TERMINÉ',
      statusClass: 'bg-[#E5F4E9] text-[#2A7F45]'
    },
    {
      patientId: 'PAT-3301',
      fullname: 'Aïssatou Diallo',
      age: 29,
      gender: 'F',
      location: 'Ziguinchor, Sénégal',
      specialty: 'Gynécologie',
      lastActivity: 'Dernière activité: Échographie programmée',
      status: 'EN TRAITEMENT',
      statusClass: 'bg-[#FDEFD9] text-[#BC7A1F]'
    },
    {
      patientId: 'PAT-5522',
      fullname: 'Ousmane Sarr',
      age: 61,
      gender: 'H',
      location: 'Louga, Sénégal',
      specialty: 'Neurologie',
      lastActivity: 'Dernière activité: IRM cérébrale effectuée',
      status: 'SUIVI',
      statusClass: 'bg-[#E5ECFF] text-[#2557D8]'
    },
    {
      patientId: 'PAT-8890',
      fullname: 'Mariama Balde',
      age: 42,
      gender: 'F',
      location: 'Kaolack, Sénégal',
      specialty: 'Endocrinologie',
      lastActivity: 'Dernière activité: Bilan sanguin reçu',
      status: 'SUIVI',
      statusClass: 'bg-[#E5ECFF] text-[#2557D8]'
    },
    {
      patientId: 'PAT-2278',
      fullname: 'Cheikh Ndiaye',
      age: 55,
      gender: 'H',
      location: 'Diourbel, Sénégal',
      specialty: 'Cardiologie',
      lastActivity: 'Dernière activité: Sortie prévue demain',
      status: 'TERMINÉ',
      statusClass: 'bg-[#E5F4E9] text-[#2A7F45]'
    }
  ];

  constructor(private router: Router) {}

  openPatient(patientId: string) {
    this.router.navigate(['/patients-hospital', patientId]);
  }
}
