import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Local interfaces for static scheduling state
interface AvailableDay {
  date: string; // Format: DD-MM-YYYY
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
}

interface TimeSlot {
  id: number;
  date: string; // Format: DD-MM-YYYY
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  booked: boolean;
}

interface WeekDay {
  label: string;
  date: Date;
  dateString: string; // Format: DD-MM-YYYY
  isAvailable: boolean;
  availability?: AvailableDay;
}

interface AppointmentType {
  id: number;
  name: string;
  description: string;
}

interface Appointment {
  id: number;
  doctorName: string;
  specialty: string | null;
  patientName: string;
  date: string; // Format: DD-MM-YYYY
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  reason: string;
  type: AppointmentType | null;
  status: 'EN_ATTENTE' | 'TERMINE' | 'ANNULE';
  createdAt: string;
  updatedAt: string;
}

interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page actuelle
  size: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-planings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planings.component.html',
  styleUrl: './planings.component.css'
})
export class PlaningsComponent implements OnInit {
  activeTab: 'agenda' | 'rendez-vous' = 'agenda';

  // Médecin connecté
  doctorId: number | null = null;

  // Gestion de la semaine
  currentWeekStart: Date = new Date();
  weekDays: WeekDay[] = [];

  // Jour sélectionné et créneaux
  selectedDay: WeekDay | null = null;
  timeSlots: TimeSlot[] = [];

  // États de chargement
  isLoadingDays = false;
  isLoadingSlots = false;
  errorMessage: string | null = null;
  slotsErrorMessage: string | null = null;

  // Jours disponibles du mois
  availableDaysCache: AvailableDay[] = [];

  // Rendez-vous pour la grille calendrier (tous les RDV)
  calendarAppointments: Appointment[] = [];

  // Liste des rendez-vous (tab rendez-vous - paginé)
  appointments: Appointment[] = [];

  // Pagination des rendez-vous
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  isFirstPage = true;
  isLastPage = true;
  isLoadingAppointments = false;
  appointmentsErrorMessage: string | null = null;

  // Filtres
  searchQuery = '';
  statusFilter = 'Tous les statuts';

  // Modal d'ajout de créneau
  showAddSlotModal = false;
  formError = '';
  newSlot = {
    date: '',
    heureDebut: '',
    heureFin: ''
  };

  constructor() {
    this.initializeCurrentWeek();
  }

  private getMockCurrentUser(): { id: number; nom?: string; prenom?: string } {
    return { id: 10, nom: 'Dupont', prenom: 'Jean' } as { id: number; nom?: string; prenom?: string };
  }

  ngOnInit(): void {
    this.loadDoctorIdAndAvailabilities();
  }

  /**
   * Charge le doctorId depuis l'utilisateur connecté et les disponibilités
   */
  loadDoctorIdAndAvailabilities(): void {
    const currentUser = this.getMockCurrentUser();
    if (currentUser) {
      this.doctorId = currentUser.id;
      this.loadAvailableDays();
      // Charger tous les rendez-vous pour l'affichage dans la grille calendrier
      this.loadAppointmentsForCalendar();
    } else {
      console.error('Erreur lors de la récupération du médecin connecté: utilisateur non connecté');
      this.errorMessage = 'Impossible de récupérer vos informations. Veuillez vous reconnecter.';
    }
  }

  /**
   * Charge tous les rendez-vous pour l'affichage dans le calendrier (sans pagination)
   */
  loadAppointmentsForCalendar(): void {
    if (!this.doctorId) return;

    // Charger avec une grande taille de page pour avoir tous les RDV
    this.localGetDoctorAppointments(this.doctorId, 0, 1000).subscribe({
      next: (response: PagedResponse<Appointment>) => {
        this.calendarAppointments = response.content;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des rendez-vous pour le calendrier (mock):', error);
      }
    });
  }

  /**
   * Initialise la semaine courante (du lundi au dimanche)
   */
  initializeCurrentWeek(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi de la semaine

    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() + diff);
    this.currentWeekStart.setHours(0, 0, 0, 0);

    this.generateWeekDays();
  }

  /**
   * Génère les 7 jours de la semaine
   */
  generateWeekDays(): void {
    this.weekDays = [];
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      const dayName = daysOfWeek[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];

      const dateString = this.formatDateToDDMMYYYY(date);

      this.weekDays.push({
        label: `${dayName} ${dayNum} ${monthName}`,
        date: date,
        dateString: dateString,
        isAvailable: false
      });
    }

    this.updateWeekAvailability();
  }

  /**
   * Charge les jours disponibles du mois en cours
   */
  loadAvailableDays(): void {
    if (!this.doctorId) return;

    const month = this.formatMonthToMMYYYY(this.currentWeekStart);
    this.isLoadingDays = true;
    this.errorMessage = null;

    this.localGetAvailableDays(this.doctorId, month).subscribe({
      next: (days) => {
        this.availableDaysCache = days;
        this.updateWeekAvailability();
        this.isLoadingDays = false;

        if (!this.selectedDay) {
          const firstAvailableDay = this.weekDays.find(day => day.isAvailable);
          if (firstAvailableDay) {
            this.selectDay(firstAvailableDay);
          }
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des disponibilités (mock):', error);
        this.errorMessage = 'Impossible de charger les disponibilités.';
        this.isLoadingDays = false;
      }
    });
  }

  /**
   * Met à jour la disponibilité des jours de la semaine
   */
  updateWeekAvailability(): void {
    this.weekDays.forEach(day => {
      const availability = this.availableDaysCache.find(
        avail => avail.date === day.dateString
      );
      day.isAvailable = !!availability;
      day.availability = availability;
    });
  }

  /**
   * Navigation vers la semaine précédente
   */
  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();

    // Recharger les disponibilités si on change de mois
    const newMonth = this.formatMonthToMMYYYY(this.currentWeekStart);
    const oldMonth = this.formatMonthToMMYYYY(new Date(this.currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000));

    if (newMonth !== oldMonth) {
      this.loadAvailableDays();
    } else {
      this.updateWeekAvailability();
      // Recharger le premier jour disponible
      const firstAvailableDay = this.weekDays.find(day => day.isAvailable);
      if (firstAvailableDay) {
        this.selectDay(firstAvailableDay);
      }
    }
  }

  /**
   * Navigation vers la semaine suivante
   */
  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();

    // Recharger les disponibilités si on change de mois
    const newMonth = this.formatMonthToMMYYYY(this.currentWeekStart);
    const oldMonth = this.formatMonthToMMYYYY(new Date(this.currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));

    if (newMonth !== oldMonth) {
      this.loadAvailableDays();
    } else {
      this.updateWeekAvailability();
      // Recharger le premier jour disponible
      const firstAvailableDay = this.weekDays.find(day => day.isAvailable);
      if (firstAvailableDay) {
        this.selectDay(firstAvailableDay);
      }
    }
  }

  /**
   * Sélectionne un jour et charge ses créneaux
   */
  selectDay(day: WeekDay): void {
    if (!day.isAvailable || !this.doctorId) return;

    this.selectedDay = day;
    this.loadAllWeekSlots();
  }

  /**
   * Charge tous les créneaux de la semaine pour affichage dans la grille
   */
  loadAllWeekSlots(): void {
    if (!this.doctorId || !this.selectedDay) return;

    this.slotsErrorMessage = null;
    this.isLoadingSlots = true;
    this.timeSlots = [];

    // Charger les créneaux du jour sélectionné
    this.localGetTimeSlots(this.doctorId, this.selectedDay.dateString).subscribe({
      next: (slots) => {
        this.timeSlots = slots;
        this.isLoadingSlots = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des créneaux (mock):', error);
        this.slotsErrorMessage = 'Impossible de charger les créneaux.';
        this.timeSlots = [];
        this.isLoadingSlots = false;
      }
    });
  }

  /**
   * Formate une date en DD-MM-YYYY
   */
  formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Formate un mois en MM-YYYY
   */
  formatMonthToMMYYYY(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${year}`;
  }

  /**
   * Obtient le label de la période de la semaine
   */
  getWeekLabel(): string {
    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(this.currentWeekStart.getDate() + 6);

    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

    const startDay = this.currentWeekStart.getDate();
    const endDay = endDate.getDate();
    const startMonth = months[this.currentWeekStart.getMonth()];
    const endMonth = months[endDate.getMonth()];
    const year = endDate.getFullYear();

    if (this.currentWeekStart.getMonth() === endDate.getMonth()) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    }
  }

  /**
   * Change d'onglet et charge les données appropriées
   */
  setActiveTab(tab: 'agenda' | 'rendez-vous'): void {
    this.activeTab = tab;
    if (tab === 'rendez-vous') {
      // Pour l'onglet rendez-vous, charger avec pagination
      this.currentPage = 0;
      this.loadAppointments();
    }
  }

  /**
   * Charge les rendez-vous du médecin avec pagination
   */
  loadAppointments(): void {
    if (!this.doctorId) {
      this.appointmentsErrorMessage = 'Impossible de récupérer vos rendez-vous. Veuillez vous reconnecter.';
      return;
    }

    this.isLoadingAppointments = true;
    this.appointmentsErrorMessage = null;

    this.localGetDoctorAppointments(this.doctorId, this.currentPage, this.pageSize).subscribe({
      next: (response: PagedResponse<Appointment>) => {
        this.appointments = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.currentPage = response.number;
        this.isFirstPage = response.first;
        this.isLastPage = response.last;
        this.isLoadingAppointments = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des rendez-vous (mock):', error);
        this.appointmentsErrorMessage = 'Erreur lors du chargement des rendez-vous. Veuillez réessayer.';
        this.isLoadingAppointments = false;
      }
    });
  }

  /**
   * Passe à la page précédente
   */
  previousPage(): void {
    if (!this.isFirstPage) {
      this.currentPage--;
      this.loadAppointments();
    }
  }

  /**
   * Passe à la page suivante
   */
  nextPage(): void {
    if (!this.isLastPage) {
      this.currentPage++;
      this.loadAppointments();
    }
  }

  /**
   * Formate le statut pour l'affichage
   */
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'TERMINE': 'Terminé',
      'ANNULE': 'Annulé'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtient la classe CSS pour le badge de statut
   */
  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'EN_ATTENTE': 'bg-[#F39C120F] text-[#F39C12]',
      'TERMINE': 'bg-[#00B8940F] text-[#00B894]',
      'ANNULE': 'bg-[#FF6B6B0F] text-[#FF6B6B]'
    };
    return classMap[status] || 'bg-gray-100 text-gray-600';
  }

  /**
   * Filtre les rendez-vous par recherche et statut
   */
  getFilteredAppointments(): Appointment[] {
    return this.appointments.filter(appointment => {
      // Filtre par recherche (nom du patient)
      const matchesSearch = this.searchQuery === '' ||
        appointment.patientName.toLowerCase().includes(this.searchQuery.toLowerCase());

      // Filtre par statut
      const matchesStatus = this.statusFilter === 'Tous les statuts' ||
        this.getStatusLabel(appointment.status) === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'Tous les statuts';
  }

  openAddSlotModal() {
    this.formError = '';
    this.showAddSlotModal = true;
  }

  closeAddSlotModal() {
    this.showAddSlotModal = false;
    this.resetNewSlot();
  }

  resetNewSlot() {
    this.newSlot = {
      date: '',
      heureDebut: '',
      heureFin: ''
    };
  }

  saveSlot() {
    this.formError = '';

    if (!this.newSlot.date || !this.newSlot.heureDebut || !this.newSlot.heureFin) {
      this.formError = 'Veuillez remplir tous les champs';
      return;
    }

    if (!this.doctorId) {
      this.formError = 'Erreur: Impossible de récupérer l\'identifiant du médecin';
      return;
    }

    // Convertir la date du format YYYY-MM-DD en DD-MM-YYYY
    const dateParts = this.newSlot.date.split('-');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    const availabilityData = {
      doctorId: this.doctorId,
      date: formattedDate,
      startTime: this.newSlot.heureDebut,
      endTime: this.newSlot.heureFin
    };

    this.localGenerateAvailabilities(availabilityData).subscribe({
      next: (response: { message: string }) => {
        console.log('Créneaux créés avec succès (mock):', response);
        Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Créneaux ajoutés avec succès',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeAddSlotModal();

        // Recharger les disponibilités
        this.loadAvailableDays();
      },
      error: (error: any) => {
        console.error('Erreur lors de la création des créneaux (mock):', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de l\'ajout des créneaux. Veuillez réessayer.',
          confirmButtonColor: '#01b894'
        });
      }
    });
  }

  viewAppointment(appointment: Appointment) {
    console.log('Voir rendez-vous:', appointment);
  }

  confirmAppointment(appointment: Appointment) {
    console.log('Confirmer rendez-vous:', appointment);
  }

  /**
   * Supprime un rendez-vous après confirmation
   */
  deleteAppointment(appointment: Appointment): void {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le rendez-vous de ${appointment.patientName} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#01b894',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.localDeleteAppointment(appointment.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: 'Le rendez-vous a été supprimé avec succès.',
              timer: 2000,
              showConfirmButton: false
            });
            // Recharger les rendez-vous
            if (this.activeTab === 'rendez-vous') {
              this.loadAppointments();
            } else {
              this.loadAppointmentsForCalendar();
            }
          },
          error: (error: any) => {
            console.error('Erreur lors de la suppression (mock):', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de supprimer le rendez-vous. Veuillez réessayer.',
              confirmButtonColor: '#01b894'
            });
          }
        });
      }
    });
  }

  /**
   * Génère les créneaux horaires de 30 minutes pour la grille calendrier
   */
  getTimeSlotLabels(): string[] {
    const slots: string[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < 18) {
        slots.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }
    return slots;
  }

  /**
   * Trouve les créneaux pour un jour et une heure donnés
   */
  getSlotsForDayAndTime(day: WeekDay, timeLabel: string): TimeSlot[] {
    if (!day.isAvailable) return [];

    return this.timeSlots.filter(slot => {
      // Le créneau doit correspondre au jour sélectionné et à l'heure
      return slot.date === day.dateString && slot.startTime === timeLabel;
    });
  }

  /**
   * Obtient l'heure actuelle au format HH:mm arrondie à la demi-heure
   */
  getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Arrondir à la demi-heure la plus proche
    const roundedMinutes = minutes < 30 ? '00' : '30';

    return `${String(hours).padStart(2, '0')}:${roundedMinutes}`;
  }

  /**
   * Vérifie si c'est aujourd'hui
   */
  isToday(day: WeekDay): boolean {
    const today = new Date();
    return day.date.toDateString() === today.toDateString();
  }

  /**
   * Vérifie si tous les jours sont indisponibles
   */
  allDaysUnavailable(): boolean {
    return this.weekDays.every(day => !day.isAvailable);
  }

  /**
   * Récupère les rendez-vous pour un jour et une heure donnés
   */
  getAppointmentsForDayAndTime(day: WeekDay, timeLabel: string): Appointment[] {
    if (!day.isAvailable) return [];

    return this.calendarAppointments.filter(appointment => {
      return appointment.date === day.dateString && appointment.startTime === timeLabel;
    });
  }

  /**
   * Calcule la hauteur du bloc de rendez-vous en fonction de sa durée
   * 1 slot = 30 minutes = 80px (h-20)
   */
  getAppointmentHeight(appointment: Appointment): string {
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    const [endHour, endMin] = appointment.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;

    // 30 minutes = 80px (h-20)
    // Réduction de 20px : 8px (top-2) + 12px espace bas pour séparation visible entre rendez-vous
    const heightPx = (durationMinutes / 30) * 80 - 20;

    return `${heightPx}px`;
  }

  /**
   * Obtient les classes CSS pour le bloc de rendez-vous selon le statut
   */
  getAppointmentBlockClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'EN_ATTENTE': 'bg-amber-50',
      'TERMINE': 'bg-emerald-50',
      'ANNULE': 'bg-rose-50 opacity-90'
    };
    return classMap[status] || 'bg-gray-50';
  }

  /**
   * Obtient la classe CSS pour la bordure à gauche selon le statut
   */
  getAppointmentBorderClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'EN_ATTENTE': 'border-amber-500',
      'TERMINE': 'border-emerald-500',
      'ANNULE': 'border-rose-500'
    };
    return classMap[status] || 'border-gray-400';
  }

  // ===== Local mock implementations =====
  private localGetDoctorAppointments(doctorId: number | null, page = 0, size = 10): Observable<PagedResponse<Appointment>> {
    const mockAppointments: Appointment[] = [
      { id: 1, doctorName: 'Dr Mock', specialty: 'Généraliste', patientName: 'Alice', date: this.formatDateToDDMMYYYY(new Date()), startTime: '09:00', endTime: '09:30', reason: '', type: null, status: 'EN_ATTENTE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    const response: PagedResponse<Appointment> = {
      content: mockAppointments,
      totalElements: mockAppointments.length,
      totalPages: 1,
      number: page,
      size: mockAppointments.length,
      first: true,
      last: true,
    };
    return of(response).pipe(delay(200));
  }

  private localGetAvailableDays(doctorId: number | null, month: string): Observable<AvailableDay[]> {
    const mock: AvailableDay[] = [
      { date: this.formatDateToDDMMYYYY(new Date()), startTime: '08:00', endTime: '17:00' }
    ];
    return of(mock).pipe(delay(150));
  }

  private localGetTimeSlots(doctorId: number | null, date: string): Observable<TimeSlot[]> {
    const mock: TimeSlot[] = [
      { id: 1, date, startTime: '08:00', endTime: '08:30', booked: false },
      { id: 2, date, startTime: '08:30', endTime: '09:00', booked: false }
    ];
    return of(mock).pipe(delay(150));
  }

  private localGenerateAvailabilities(data: { doctorId: number; date: string; startTime: string; endTime: string }): Observable<{ message: string }> {
    return of({ message: 'Generated' }).pipe(delay(180));
  }

  private localDeleteAppointment(appointmentId: number): Observable<{ message: string }> {
    return of({ message: 'Deleted' }).pipe(delay(150));
  }
}
