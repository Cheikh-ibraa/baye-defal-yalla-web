import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, delay } from 'rxjs';
import { Imagerie, ImagerieCreate, UrgencyLevel } from '../../../modele/imagerie.model';
import { User } from '../../../core/auth.types';

@Component({
  selector: 'app-examens-imagerie',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './examens-imagerie.component.html',
  styleUrl: './examens-imagerie.component.css'
})
export class ExamensImagerieComponent implements OnInit {


  // =================== DATA ===================
  allImageries: Imagerie[] = [];
  filteredImageries: Imagerie[] = [];
  imageries: Imagerie[] = [];

  // ============= DROPDOWN DATA ================
  imagingTypes: any[] = [];
  imagingRegions: any[] = [];

  urgencyLevels = [
    { label: 'Normal', value: UrgencyLevel.NORMAL },
    { label: 'Prioritaire', value: UrgencyLevel.PRIORITAIRE },
    { label: 'Urgent', value: UrgencyLevel.URGENT }
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

  // ================= MODALS ===================
  showAddImagerieModal = false;
  showAddImagerieSuccess = false;

  // =============== FORM DATA ==================
  imagerieForm: ImagerieCreate = this.getEmptyForm();

  constructor() { }

  // Local mock current user (replaces AuthFacade)
  private getMockCurrentUser(): User {
    return { id: 1, nom: 'Demo', prenom: 'Lab' } as User;
  }

  // --- Local mocks / helpers for Imagerie ---
  private mockTypes = [
    { id: 1, label: 'Radiologie' },
    { id: 2, label: 'Echographie' }
  ];

  private mockRegions = [
    { id: 1, label: 'Thorax' },
    { id: 2, label: 'Abdomen' }
  ];

  private mockImageriesStore: Imagerie[] = [
    {
      id: 1,
      patientName: 'DIAW M',
      doctorName: 'Dr Mock',
      clinicalIndication: 'Douleur thoracique',
      status: 'PENDING',
      urgencyLevel: 'NORMAL',
      typeId: null as any,
      regionId: null as any,
      imagingCenterId: null as any,
      createdAt: new Date().toISOString(),
      pictures: [],
      accessionNumber: 'ACC-1'
    } as any
  ];

  private localGetImagingTypes() {
    return of(this.mockTypes).pipe(delay(80));
  }

  private localGetImagingRegions() {
    return of(this.mockRegions).pipe(delay(80));
  }

  private localGetImageries(page = 0, size = 10, search?: string, status?: string, priority?: string, imagingCenterId?: number) {
    let filtered = this.mockImageriesStore.slice();
    if (search) filtered = filtered.filter(i => i.patientName?.toLowerCase().includes(search.toLowerCase()));
    if (status) filtered = filtered.filter(i => i.status === status);
    if (priority) filtered = filtered.filter(i => i.urgencyLevel === priority);

    const start = page * size;
    const content = filtered.slice(start, start + size);
    const response = { content, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size) };
    return of(response).pipe(delay(120));
  }

  private localCreateImagerie(payload: ImagerieCreate) {
    const newId = (this.mockImageriesStore.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
    const newItem: any = { ...payload, id: newId, patientName: payload.patientId || 'Patient', doctorName: payload.doctorId || 'Médecin', status: 'PENDING', urgencyLevel: payload.urgencyLevel || 'NORMAL', createdAt: new Date().toISOString(), pictures: [], accessionNumber: `ACC-${newId}` };
    this.mockImageriesStore.unshift(newItem);
    return of('OK').pipe(delay(150));
  }

  private localAcceptImagerie(payload: { requestId: number; date: string; time: string; amount?: number; }) {
    const item = this.mockImageriesStore.find(i => i.id === payload.requestId);
    if (item) {
      item.status = 'ACCEPTED';
      item.appointmentDate = payload.date;
      item.appointmentTime = payload.time;
    }
    return of('OK').pipe(delay(120));
  }

  currentUser: User | null = null;


  // =================== INIT ===================
  ngOnInit(): void {
    this.loadTypes();
    this.loadRegions();

    const user = this.getMockCurrentUser();
    this.currentUser = user;
    console.log("👤 User (mock) :", user);
    if (user?.id) {
      this.loadAllImageries();
    }
  }




  // ================== API CALLS ===============
  loadTypes(): void {
    this.localGetImagingTypes().subscribe({
      next: res => this.imagingTypes = res,
      error: err => console.error('Erreur types:', err)
    });
  }

  loadRegions(): void {
    this.localGetImagingRegions().subscribe({
      next: res => this.imagingRegions = res,
      error: err => console.error('Erreur régions:', err)
    });
  }

  loadAllImageries(): void {
    if (!this.currentUser?.id) return;

    this.localGetImageries(0, 1000, undefined, undefined, undefined, this.currentUser.id).subscribe({
      next: res => {
        this.allImageries = res.content;
        this.applyFilters();
      },
      error: (err: any) => console.error('Erreur imageries:', err)
    });
  }

  createImagerie(): void {
    if (!this.currentUser || !this.currentUser.id) {
      console.error("Utilisateur non trouvé");
      return;
    }

    const payload: ImagerieCreate = {
      ...this.imagerieForm,
      imagingCenterId: this.currentUser.id   // ✅ BONNE SOURCE
    };

    console.log("PAYLOAD FINAL ENVOYÉ :", payload);

    this.localCreateImagerie(payload).subscribe({
      next: () => {
        this.closeAddImagerie();
        this.showAddImagerieSuccess = true;
        this.loadAllImageries();
      },
      error: (err: any) => console.error('Erreur création:', err)
    });
  }





  // ================ FILTERS ===================
  applyFilters(): void {
    this.filteredImageries = this.allImageries.filter(img => {
      const matchSearch = !this.searchTerm ||
        img.patientName?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.selectedStatus || img.status === this.selectedStatus;
      const matchPriority = !this.selectedPriority || img.urgencyLevel === this.selectedPriority;

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
    this.totalElements = this.filteredImageries.length;
    this.totalPages = Math.ceil(this.totalElements / this.size);

    const start = this.page * this.size;
    const end = start + this.size;
    this.imageries = this.filteredImageries.slice(start, end);
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
  openAddImagerie(): void {
    this.imagerieForm = this.getEmptyForm();
    this.showAddImagerieModal = true;
  }

  closeAddImagerie(): void {
    this.showAddImagerieModal = false;
    this.imagerieForm = this.getEmptyForm();
  }

  closeAddImagerieSuccess(): void {
    this.showAddImagerieSuccess = false;
  }

  // =============== TABLE ACTIONS ==============
  viewExamen(imagerie: Imagerie): void {
    console.log('Voir:', imagerie);
  }

  validerExamen(imagerie: Imagerie): void {
    console.log('Valider:', imagerie);
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
    const index = initials?.charCodeAt(0) % colors.length;
    return colors[index] || colors[0];
  }

  private getEmptyForm(): ImagerieCreate {
    return {
      patientId: null as any,
      doctorId: null as any,
      imagingCenterId: null as any,
      typeId: null as any,
      regionId: null as any,
      clinicalIndication: '',
      youngPatient: false,
      urgencyLevel: UrgencyLevel.NORMAL
    };
  }









  // =========================
  // MODALES VALIDATION
  // =========================
  showValidationDemandeModal = false;
  showValidationDemandeSuccess = false;

  // Demande sélectionnée
  selectedImagerieId: number | null = null;

  // Formulaire validation
  validationDemandeForm = {
    date: '',   // yyyy-mm-dd (input type date)
    heure: '',  // HH:mm
    montant: 0, // Montant en FCFA
    note: ''
  };

  // (optionnel) patient pour le message success
  patient: any = {
    name: ''
  };
  openValidationDemande(imagerie: any): void {
    this.selectedImagerieId = imagerie.id;

    // si tu veux afficher le nom du patient dans le success
    this.patient.name = imagerie.patientName || 'le patient';

    // reset formulaire
    this.validationDemandeForm = {
      date: '',
      heure: '',
      montant: 0,
      note: ''
    };

    this.showValidationDemandeModal = true;
  }

  closeValidationDemande(): void {
    this.showValidationDemandeModal = false;
    this.selectedImagerieId = null;
  }
  private formatDateToJJMMAAAA(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }
  confirmerValidationDemande(): void {
    if (!this.selectedImagerieId) {
      console.error('Aucune demande sélectionnée');
      return;
    }

    if (!this.validationDemandeForm.date || !this.validationDemandeForm.heure) {
      alert('Veuillez renseigner la date et l’heure');
      return;
    }

    const payload = {
      requestId: this.selectedImagerieId,
      date: this.formatDateToJJMMAAAA(this.validationDemandeForm.date),
      time: this.validationDemandeForm.heure,
      amount: this.validationDemandeForm.montant
    };

    this.localAcceptImagerie(payload).subscribe({
      next: (res) => {
        console.log(res); // "Demande acceptée et rendez-vous programmé"

        this.showValidationDemandeModal = false;
        this.showValidationDemandeSuccess = true;
        this.loadAllImageries();

        // 🔥 AUTO-FERMETURE DU SUCCESS
        setTimeout(() => {
          this.showValidationDemandeSuccess = false;
        }, 2000); // 2,5 secondes (ajuste si tu veux)
      },
      error: (err) => {
        console.error('Erreur validation demande', err);
      }
    });


  }
  closeValidationDemandeSuccess(): void {
    this.showValidationDemandeSuccess = false;
  }

}
