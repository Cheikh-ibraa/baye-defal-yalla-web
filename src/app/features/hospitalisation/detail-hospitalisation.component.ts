import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-detail-hospitalisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-hospitalisation.component.html',
  styleUrls: []
})
export class DetailHospitalisationComponent implements OnInit {
  hospitalisationId = '';
  detail: any = null;

  private mockDetails: { [key: string]: any } = {
    '44920': {
      headerName: 'Dossier Hospitalisation',
      displayId: 'HOSP-2023-020',
      fullname: 'Jean Dupont',
      statusLabel: 'Urgent',
      hospitalId: '44920',
      age: 72,
      bloodGroup: 'O+',
      stayInfo: [
        { icon: 'calendar', label: 'Date d\'admission', value: '12 Oct 2023' },
        { icon: 'service', label: 'Service', value: 'Cardiologie' },
        { icon: 'room', label: 'Chambre', value: 'B-204' },
        { icon: 'doctor', label: 'Médecin traitant', value: 'Dr. Awa Diop' }
      ],
      lastObservation: {
        badge: 'Aujourd\'hui, 09:15',
        text: 'Patient stable. La douleur thoracique a diminué suite à l\'intervention. Fréquence cardiaque régulière. Poursuite du protocole médicamenteux en cours.'
      },
      evolution: {
        status: 'En amélioration',
        text: 'Processus de rétablissement post-opératoire conforme aux attentes cliniques.',
        recoveryPercent: 75
      },
      financial: {
        totalAmount: '450 000 FCFA',
        fundingStatus: 'Totalement pris en charge'
      },
      timeline: [
        { status: 'completed', title: 'Admission', subtitle: '12 Octobre, 08:30 • Urgences', note: '"Admis pour suspicion de syndrome coronaire aigu. Stabilisé par l\'équipe mobile."' },
        { status: 'completed', title: 'Examens terminés', subtitle: '12 Octobre, 11:45 • Plateau Technique', tags: ['ECG', 'Biologie', 'Scanner'] },
        { status: 'active', title: 'Traitement en cours', subtitle: 'Depuis le 13 Octobre, 09:00', note: 'Perfusion continue et surveillance tensionnelle permanente (H24).' },
        { status: 'pending', title: 'Sortie prévue', subtitle: 'Date estimée: 16 Octobre 2023' }
      ]
    },
    '44921': {
      headerName: 'Dossier Hospitalisation',
      displayId: 'HOSP-2023-021',
      fullname: 'Marie Lefebvre',
      statusLabel: 'En cours',
      hospitalId: '44921',
      age: 34,
      bloodGroup: 'A-',
      stayInfo: [
        { icon: 'calendar', label: 'Date d\'admission', value: '10 Oct 2023' },
        { icon: 'service', label: 'Service', value: 'Maternité' },
        { icon: 'room', label: 'Chambre', value: 'A-112' },
        { icon: 'doctor', label: 'Médecin traitant', value: 'Dr. Mamadou Sarr' }
      ],
      lastObservation: {
        badge: 'Stable',
        text: 'Suivi post-accouchement immédiat. Mère et nouveau-né se portent bien.'
      },
      evolution: {
        status: 'Rétablissement normal',
        text: 'Suivi post-natal standard. Sortie envisagée à J+3 après validation pédiatrique.',
        recoveryPercent: 100
      },
      financial: {
        totalAmount: '200 000 FCFA',
        fundingStatus: 'Partiellement pris en charge'
      },
      timeline: [
        { status: 'completed', title: 'Admission', subtitle: '10 Octobre, 02:00 • Maternité', note: '"Admise pour travail actif et suivi d\'accouchement."' },
        { status: 'completed', title: 'Examens terminés', subtitle: '10 Octobre, 06:15 • Plateau Technique', tags: ['Suivi biologique', 'Obstétrique'] },
        { status: 'active', title: 'Traitement en cours', subtitle: 'Depuis le 10 Octobre, 08:00', note: 'Repos en chambre individuelle et surveillance post-partum standard.' },
        { status: 'pending', title: 'Sortie prévue', subtitle: 'Date estimée: 13 Octobre 2023' }
      ]
    },
    '44899': {
      headerName: 'Dossier Hospitalisation',
      displayId: 'HOSP-2023-099',
      fullname: 'Marc Vasseur',
      statusLabel: 'Sorti',
      hospitalId: '44899',
      age: 45,
      bloodGroup: 'B+',
      stayInfo: [
        { icon: 'calendar', label: 'Date d\'admission', value: '05 Oct 2023' },
        { icon: 'service', label: 'Service', value: 'Orthopédie' },
        { icon: 'room', label: 'Chambre', value: 'Sorti' },
        { icon: 'doctor', label: 'Médecin traitant', value: 'Dr. Demba Thioune' }
      ],
      lastObservation: {
        badge: 'Rétabli',
        text: 'Réduction de fracture du fémur réussie. Séance de kinésithérapie de sortie validée.'
      },
      evolution: {
        status: 'Rétablissement complet',
        text: 'Consolidation osseuse satisfaisante. Kinésithérapie ambulatoire prescrite.',
        recoveryPercent: 85
      },
      financial: {
        totalAmount: '850 000 FCFA',
        fundingStatus: 'Totalement pris en charge'
      },
      timeline: [
        { status: 'completed', title: 'Admission', subtitle: '05 Octobre, 14:00 • Orthopédie', note: '"Admis suite à un accident de la voie publique pour fracture fémorale."' },
        { status: 'completed', title: 'Examens terminés', subtitle: '06 Octobre, 10:00 • Plateau Technique', tags: ['Radiographie', 'Bilan pré-opératoire'] },
        { status: 'completed', title: 'Traitement en cours', subtitle: 'Depuis le 06 Octobre, 12:00', note: 'Ostéosynthèse réalisée avec succès, suivi kinésithérapeutique en cours.' },
        { status: 'completed', title: 'Sortie prévue', subtitle: 'Date de sortie effective: 15 Octobre 2023' }
      ]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.hospitalisationId = id || '';
      this.loadDetail(this.hospitalisationId);
    });
  }

  loadDetail(id: string): void {
    let cleanId = id;
    if (id.includes('-')) {
      cleanId = id.split('-')[0];
    }
    this.detail = this.mockDetails[cleanId] || this.mockDetails['44920'];
  }

  back(): void {
    this.router.navigate(['/hospitalisations']);
  }

  stepIconClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-[#1E6B34] text-white';
      case 'active': return 'bg-[#00339E] text-white';
      default: return 'bg-[#CBD5E1] text-[#94A3B8]';
    }
  }

  stepTitleClass(status: string): string {
    switch (status) {
      case 'completed': return 'text-[#0F172A] font-bold';
      case 'active': return 'text-[#00339E] font-bold';
      default: return 'text-[#94A3B8] font-bold';
    }
  }
}
