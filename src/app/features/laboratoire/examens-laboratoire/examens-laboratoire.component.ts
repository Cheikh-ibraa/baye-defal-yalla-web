import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Inlined Laboratoire model
interface Laboratoire {
  id: number;
  patientName: string;
  doctorName: string;
  laboratoryName: string;
  type: string;
  clinicalIndication: string;
  youngPatient: boolean;
  urgencyLevel: 'NORMAL' | 'PRIORITAIRE' | 'URGENT';
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  appointmentDate: string;
  appointmentTime: string;
  pictures: string[];
  report: string;
  reportFile: string;
  pdfPassword?: string;
}
import { User } from '../../../core/auth.types';

@Component({
  selector: 'app-examens-laboratoire',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './examens-laboratoire.component.html',
  styleUrl: './examens-laboratoire.component.css'
})
export class ExamensLaboratoireComponent implements OnInit {
currentUser: User | null = null;

  // =================== DATA ===================
  allExamens: Laboratoire[] = [];
  filteredExamens: Laboratoire[] = [];
  examens: Laboratoire[] = [];

  // ============= DROPDOWN DATA ================
  analysisTypes: any[] = [];

  urgencyLevels = [
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Urgent', value: 'URGENT' }
  ];

  statuses = [
    { label: 'Tous les statuts', value: null },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Accepté', value: 'ACCEPTED' },
    { label: 'Terminé', value: 'COMPLETED' },
    { label: 'Annulé', value: 'CANCELLED' }
  ];

  priorities = [
    { label: 'Toutes les priorités', value: null },
    { label: 'Urgent', value: 'URGENT' },
    { label: 'Normal', value: 'NORMAL' }
  ];

  // ================ FILTERS ===================
  searchTerm = '';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;
  statusLabel = 'Tous les statuts';
  priorityLabel = 'Toutes les priorités';
  showStatusMenu = false;
  showPriorityMenu = false;

  // =============== PAGINATION =================
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  get startItem(): number {
    return this.totalElements === 0 ? 0 : this.page * this.size + 1;
  }

  get endItem(): number {
    const end = (this.page + 1) * this.size;
    return end > this.totalElements ? this.totalElements : end;
  }
onPageSizeChange(): void {
  this.page = 0;
  this.applyPagination();
}

  // ================= MODALS ===================
  showAddLaboratoireModal = false;
  showAddLaboratoireSuccess = false;

  // =============== FORM DATA ==================
  laboratoireForm = this.getEmptyForm();

  constructor() {}

  // Local mock current user (replaces AuthFacade)
  private getMockCurrentUser(): User {
    return { id: 1, nom: 'Demo', prenom: 'Labo' } as User;
  }

  // =================== INIT ===================
  ngOnInit(): void {
  this.loadTypes();
  this.loadAllExamens();

  const user = this.getMockCurrentUser();
  this.currentUser = user;
  console.log('👤 Labo User (mock) :', user);
}


  // ================== API CALLS ===============
  loadTypes(): void {
    // Mocked types
    this.analysisTypes = ['Hématologie', 'Biochimie', 'Microbiologie'];
  }


  loadAllExamens(): void {
    this.localGetLaboratoires(0, 1000).subscribe({
      next: res => {
        this.allExamens = res.content;
        this.applyFilters();
      },
      error: (err: any) => console.error('Erreur examens labo (mock):', err)
    });
  }

  createLaboratoire(): void {
  if (!this.currentUser || !this.currentUser.id) {
    console.error("Utilisateur laboratoire non trouvé");
    return;
  }

  const payload = {
    ...this.laboratoireForm,
    laboratoryId: this.currentUser.id   // 🔥 ID du labo connecté
  };

  console.log("📤 PAYLOAD LABO ENVOYÉ :", payload);

    // Mock creation: add to local list
    const newItem: Laboratoire = { id: Date.now(), ...payload, patientName: 'Nouveau', doctorName: 'Dr Mock', laboratoryName: 'Lab Mock', type: 'Hématologie', clinicalIndication: '', youngPatient: false, urgencyLevel: 'NORMAL', status: 'PENDING', createdAt: new Date().toISOString(), appointmentDate: '', appointmentTime: '', pictures: [], report: '', reportFile: '' } as any;
    this.allExamens.unshift(newItem);
    this.closeAddLaboratoire();
    this.showAddLaboratoireSuccess = true;
    this.loadAllExamens();
}

  // Local mock for laboratoires
  private localGetLaboratoires(page = 0, size = 1000) {
    const content = (this.allExamens && this.allExamens.length > 0) ? this.allExamens : [];
    const response = { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length, first: true, last: true, empty: content.length === 0 };
    return of(response).pipe(delay(200));
  }


  // ================ FILTERS ===================
  applyFilters(): void {
    this.filteredExamens = this.allExamens.filter(ex => {
      const matchSearch =
        !this.searchTerm ||
        ex.patientName?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchStatus =
        !this.selectedStatus || ex.status === this.selectedStatus;

      const matchPriority =
        !this.selectedPriority || ex.urgencyLevel === this.selectedPriority;

      return matchSearch && matchStatus && matchPriority;
    });

    this.page = 0;
    this.applyPagination();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  filterByStatus(option: any): void {
    this.selectedStatus = option.value;
    this.statusLabel = option.label;
    this.showStatusMenu = false;
    this.applyFilters();
  }

  filterByPriority(option: any): void {
    this.selectedPriority = option.value;
    this.priorityLabel = option.label;
    this.showPriorityMenu = false;
    this.applyFilters();
  }

  // =============== PAGINATION =================
  applyPagination(): void {
  this.totalElements = this.filteredExamens.length;
  this.totalPages = Math.ceil(this.totalElements / this.size);

  if (this.page >= this.totalPages) {
    this.page = 0;
  }

  const start = this.page * this.size;
  const end = start + this.size;

  this.examens = this.filteredExamens.slice(start, end);

  console.log('📄 PAGINATION', {
    page: this.page,
    size: this.size,
    totalPages: this.totalPages,
    affichés: this.examens.length
  });
}


  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.applyPagination();
    }
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.applyPagination();
    }
  }

  // =============== MODAL ACTIONS ==============
  openAddLaboratoire(): void {
    this.laboratoireForm = this.getEmptyForm();
    this.showAddLaboratoireModal = true;
  }

  closeAddLaboratoire(): void {
    this.showAddLaboratoireModal = false;
    this.laboratoireForm = this.getEmptyForm();
  }

  closeAddLaboratoireSuccess(): void {
    this.showAddLaboratoireSuccess = false;
  }

  // ================= HELPERS ==================
  getInitials(name: string): string {
    return name?.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || '';
  }

  getInitialsColor(initials: string): string {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[initials.charCodeAt(0) % colors.length];
  }

  private getEmptyForm(): any {
    return {
      patientId: null,
      doctorId: null,
      laboratoryId: null,
      typeId: null,
      clinicalIndication: '',
      youngPatient: false,
      urgencyLevel: 'NORMAL'
    };
  }

  // =========================
  // MODALES VALIDATION
  // =========================
  showValidationDemandeModal = false;
  showValidationDemandeSuccess = false;

  selectedLaboratoireId: number | null = null;

  validationDemandeForm = {
    date: '',
    heure: '',
    note: ''
  };

  patient: any = { name: '' };

  openValidationDemande(examen: Laboratoire): void {
    this.selectedLaboratoireId = examen.id;
    this.patient.name = examen.patientName || 'le patient';

    this.validationDemandeForm = {
      date: '',
      heure: '',
      note: ''
    };

    this.showValidationDemandeModal = true;
  }

  closeValidationDemande(): void {
    this.showValidationDemandeModal = false;
    this.selectedLaboratoireId = null;
  }

  private formatDateToJJMMAAAA(date: string): string {
    const [y, m, d] = date.split('-');
    return `${d}-${m}-${y}`;
  }

  confirmerValidationDemande(): void {
    if (!this.selectedLaboratoireId) return;

    if (!this.validationDemandeForm.date || !this.validationDemandeForm.heure) {
      alert('Veuillez renseigner la date et l’heure');
      return;
    }

    const payload = {
      requestId: this.selectedLaboratoireId,
      date: this.formatDateToJJMMAAAA(this.validationDemandeForm.date),
      time: this.validationDemandeForm.heure
    };

    this.localAcceptLaboratoire(payload).subscribe({
      next: () => {
        this.showValidationDemandeModal = false;
        this.showValidationDemandeSuccess = true;
        // Update local list
        const idx = this.allExamens.findIndex(e => e.id === this.selectedLaboratoireId);
        if (idx >= 0) this.allExamens[idx].status = 'ACCEPTED';
        this.loadAllExamens();

        setTimeout(() => {
          this.showValidationDemandeSuccess = false;
        }, 2000);
      },
      error: (err: any) => console.error('Erreur validation labo (mock)', err)
    });
  }

  closeValidationDemandeSuccess(): void {
    this.showValidationDemandeSuccess = false;
  }

  private localAcceptLaboratoire(payload: { requestId: number; date: string; time: string }) {
    // Simulate accept
    return of({ message: 'Accepted' }).pipe(delay(150));
  }
}
