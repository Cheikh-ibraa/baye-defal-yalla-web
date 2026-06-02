import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ImagerieService } from '../../../services/imagerie/imagerie.service';
import { Imagerie, ImagerieCreate, UrgencyLevel } from '../../../modele/imagerie.model';
import { AuthService, User } from '../../../services/auth.service';

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

  constructor(
    private imagerieService: ImagerieService,
    private authService: AuthService   // 👈 AJOUTE ÇA
  ) { }

  currentUser: User | null = null;


  // =================== INIT ===================
  ngOnInit(): void {
    this.loadTypes();
    this.loadRegions();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log("👤 User depuis AuthService :", user);
      if (user?.id) {
        this.loadAllImageries();
      }
    });
  }




  // ================== API CALLS ===============
  loadTypes(): void {
    this.imagerieService.getImagingTypes().subscribe({
      next: res => this.imagingTypes = res,
      error: err => console.error('Erreur types:', err)
    });
  }

  loadRegions(): void {
    this.imagerieService.getImagingRegions().subscribe({
      next: res => this.imagingRegions = res,
      error: err => console.error('Erreur régions:', err)
    });
  }

  loadAllImageries(): void {
    if (!this.currentUser?.id) return;

    this.imagerieService.getImageries(0, 1000, undefined, undefined, undefined, this.currentUser.id).subscribe({
      next: res => {
        this.allImageries = res.content;
        this.applyFilters();
      },
      error: err => console.error('Erreur imageries:', err)
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

    this.imagerieService.createImagerie(payload).subscribe({
      next: () => {
        this.closeAddImagerie();
        this.showAddImagerieSuccess = true;
        this.loadAllImageries();
      },
      error: err => console.error('Erreur création:', err)
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

    this.imagerieService.acceptImagerie(payload).subscribe({
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
