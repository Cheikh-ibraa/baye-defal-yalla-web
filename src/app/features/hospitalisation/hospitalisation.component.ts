import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface PatientHospital {
  fullname: string;
  patientId: string;
  age: number;
  status: string;
  admission: string;
  chambre: string;
  service: string;
  duree: string;
  progress: number;
}

@Component({
  selector: 'app-hospitalisation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalisation.component.html',
  styleUrls: []
})
export class HospitalisationComponent {
  searchQuery = '';
  activeFilter = 'all';

  // Modal form states
  showModal = false;
  patientSearchQuery = 'Jean-Marc';
  admissionDate = '22/05/2026';
  admissionService = 'Chirurgie';
  chambreLit = '';
  medecinResponsable = 'Dr. Sarah Lemoine';
  motifAdmission = '';
  urgencyLevel = 'Urgent';
  montantEstime = '200 000';
  statutPaiement = 'Non payé';

  filters = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'En cours' },
    { id: 'urgent', label: 'Urgents' },
    { id: 'discharged', label: 'Sortis' }
  ];

  patients: PatientHospital[] = [
    {
      fullname: 'Jean Dupont',
      patientId: '44920',
      age: 72,
      status: 'URGENT',
      admission: '12 Oct 2023',
      chambre: 'B-204',
      service: 'Cardiologie',
      duree: '3 Jours',
      progress: 65
    },
    {
      fullname: 'Marie Lefebvre',
      patientId: '44921',
      age: 34,
      status: 'EN COURS',
      admission: '10 Oct 2023',
      chambre: 'A-112',
      service: 'Maternité',
      duree: '5 Jours',
      progress: 100
    },
    {
      fullname: 'Marc Vasseur',
      patientId: '44899',
      age: 45,
      status: 'SORTI',
      admission: '05 Oct 2023',
      chambre: 'Sorti',
      service: 'Orthopédie',
      duree: '10 Jours',
      progress: 85
    },
    {
      fullname: 'Marie Lefebvre',
      patientId: '44921-2',
      age: 34,
      status: 'EN COURS',
      admission: '10 Oct 2023',
      chambre: 'A-112',
      service: 'Maternité',
      duree: '5 Jours',
      progress: 100
    },
    {
      fullname: 'Marc Vasseur',
      patientId: '44899-2',
      age: 45,
      status: 'SORTI',
      admission: '05 Oct 2023',
      chambre: 'Sorti',
      service: 'Orthopédie',
      duree: '10 Jours',
      progress: 85
    },
    {
      fullname: 'Jean Dupont',
      patientId: '44920-2',
      age: 72,
      status: 'URGENT',
      admission: '12 Oct 2023',
      chambre: 'B-204',
      service: 'Cardiologie',
      duree: '3 Jours',
      progress: 65
    }
  ];

  constructor(private router: Router) {}

  setFilter(filterId: string): void {
    this.activeFilter = filterId;
  }

  isFilterActive(filterId: string): boolean {
    return this.activeFilter === filterId;
  }

  get filteredPatients(): PatientHospital[] {
    return this.patients.filter(p => {
      const matchesSearch = p.fullname.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            p.service.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesFilter = this.activeFilter === 'all' ||
                            (this.activeFilter === 'active' && p.status === 'EN COURS') ||
                            (this.activeFilter === 'urgent' && p.status === 'URGENT') ||
                            (this.activeFilter === 'discharged' && p.status === 'SORTI');
      
      return matchesSearch && matchesFilter;
    });
  }

  statusBadgeClass(status: string): string {
    if (status === 'URGENT') {
      return 'bg-[#BA1A1A1A] text-[#BA1A1A]'; // Light pink bg, dark red text
    }
    if (status === 'EN COURS') {
      return 'bg-[#F39C121A] text-[#E8920A]'; // Light orange bg, dark orange text
    }
    if (status === 'SORTI') {
      return 'bg-[#00B8941A] text-[#00B894]'; // Light teal/green bg, dark teal text
    }
    return 'bg-[#F1F5F9] text-[#64748B]';
  }

  isDischarged(patient: PatientHospital): boolean {
    return patient.status === 'SORTI';
  }

  getCleanId(patientId: string): string {
    return patientId.split('-')[0];
  }

  openDossier(patient: PatientHospital, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/hospitalisations', patient.patientId]);
  }
  openModal(): void {
    this.patientSearchQuery = 'Jean-Marc';
    this.admissionDate = '22/05/2026';
    this.admissionService = 'Chirurgie';
    this.chambreLit = '';
    this.medecinResponsable = 'Dr. Sarah Lemoine';
    this.motifAdmission = '';
    this.urgencyLevel = 'Urgent';
    this.montantEstime = '200 000';
    this.statutPaiement = 'Non payé';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submitHospitalisation(): void {
    const isJeanMarc = this.patientSearchQuery.toLowerCase().includes('jean-marc');
    this.patients.unshift({
      fullname: isJeanMarc ? 'Jean-Marc Bernard' : (this.patientSearchQuery || 'Nouveau Patient'),
      patientId: isJeanMarc ? '88421' : Math.floor(10000 + Math.random() * 90000).toString(),
      age: isJeanMarc ? 54 : 35,
      status: this.urgencyLevel.toUpperCase(),
      admission: this.admissionDate,
      chambre: this.chambreLit || '402-A',
      service: this.admissionService,
      duree: '1 Jour',
      progress: 0
    });
    this.closeModal();
  }
}
