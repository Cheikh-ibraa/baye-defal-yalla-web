import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface WeekDay {
  label: string;
  date: Date;
  dateString: string;
  isAvailable: boolean;
}

interface CalendarEntry {
  id: string;
  patientLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
}

interface ActivityItem {
  id: string;
  type: 'Analyse' | 'Imagerie' | 'Hospitalisation';
  patientLabel: string;
  dateDisplay: string;
  time: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-planings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planings.component.html',
  styleUrl: './planings.component.css'
})
export class PlaningsComponent implements OnInit, OnDestroy {
  activeTab: 'agenda' | 'rendez-vous' = 'agenda';

  currentWeekStart: Date = new Date();
  weekDays: WeekDay[] = [];
  calendarEntries: CalendarEntry[] = [];

  allActivities: ActivityItem[] = [];
  filteredActivities: ActivityItem[] = [];

  searchQuery = '';
  statusFilter = 'Tous les statuts';

  currentPage = 0;
  pageSize = 10;

  isLoadingCalendar = false;
  isLoadingActivities = false;
  errorCalendar: string | null = null;
  errorActivities: string | null = null;

  private activitiesLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {
    this.initializeCurrentWeek();
  }

  ngOnInit(): void {
    this.loadCalendarData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Semaine ===

  initializeCurrentWeek(): void {
    const today = new Date();
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() + diff);
    this.currentWeekStart.setHours(0, 0, 0, 0);
    this.generateWeekDays();
  }

  generateWeekDays(): void {
    this.weekDays = [];
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(this.currentWeekStart.getDate() + i);
      this.weekDays.push({
        label: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
        date: d,
        dateString: this.toDateString(d),
        isAvailable: true,
      });
    }
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    this.loadCalendarData();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    this.loadCalendarData();
  }

  getWeekLabel(): string {
    const end = new Date(this.currentWeekStart);
    end.setDate(this.currentWeekStart.getDate() + 6);
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const s = this.currentWeekStart, e = end;
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} - ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
    }
    return `${s.getDate()} ${months[s.getMonth()]} - ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
  }

  isToday(day: WeekDay): boolean {
    return day.date.toDateString() === new Date().toDateString();
  }

  // === Agenda (calendrier) ===

  loadCalendarData(): void {
    this.isLoadingCalendar = true;
    this.errorCalendar = null;

    this.http.get<any[]>(`${environment.baseUrl}/medical/appointments/doctor`)
      .pipe(takeUntil(this.destroy$), catchError(() => of([])))
      .subscribe(data => {
        this.calendarEntries = data.map(a => {
          const dt = new Date(a.appointmentDate);
          const startTime = this.isoToTime(a.appointmentDate);
          return {
            id: a.id,
            patientLabel: `Patient #${a.patientId.substring(0, 8).toUpperCase()}`,
            date: this.toDateString(dt),
            startTime,
            endTime: this.addMinutes(startTime, 30),
            reason: a.reason || 'RDV médical',
            status: a.status,
          };
        });
        this.isLoadingCalendar = false;
      });
  }

  getTimeSlotLabels(): string[] {
    const slots: string[] = [];
    for (let h = 8; h <= 18; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 18) slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  }

  getCurrentTime(): string {
    const now = new Date();
    const mins = now.getMinutes() < 30 ? '00' : '30';
    return `${String(now.getHours()).padStart(2, '0')}:${mins}`;
  }

  getEntriesForDayAndTime(day: WeekDay, timeLabel: string): CalendarEntry[] {
    return this.calendarEntries.filter(e => e.date === day.dateString && e.startTime === timeLabel);
  }

  getEntryBlockClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-50', CONFIRMED: 'bg-emerald-50',
      CANCELLED: 'bg-rose-50 opacity-90', COMPLETED: 'bg-blue-50',
    };
    return map[status] || 'bg-gray-50';
  }

  getEntryBorderClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'border-amber-500', CONFIRMED: 'border-emerald-500',
      CANCELLED: 'border-rose-500', COMPLETED: 'border-blue-500',
    };
    return map[status] || 'border-gray-400';
  }

  // === Activités (rendez-vous + consultations) ===

  setActiveTab(tab: 'agenda' | 'rendez-vous'): void {
    this.activeTab = tab;
    if (tab === 'rendez-vous' && !this.activitiesLoaded) {
      this.loadActivities();
    }
  }

  loadActivities(): void {
    this.isLoadingActivities = true;
    this.errorActivities = null;
    this.activitiesLoaded = true;

    forkJoin({
      labOrders:        this.http.get<any[]>(`${environment.baseUrl}/lab-orders/doctor`).pipe(catchError(() => of([]))),
      imagingOrders:    this.http.get<any[]>(`${environment.baseUrl}/imaging-orders/doctor`).pipe(catchError(() => of([]))),
      hospitalizations: this.http.get<any[]>(`${environment.baseUrl}/medical/hospitalizations/doctor`).pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ labOrders, imagingOrders, hospitalizations }) => {
        const labItems: ActivityItem[] = labOrders.map(o => ({
          id: o.id,
          type: 'Analyse' as const,
          patientLabel: `Patient #${o.patientId.substring(0, 8).toUpperCase()}`,
          dateDisplay: this.formatDate(o.appointmentDate),
          time: this.isoToTime(o.appointmentDate),
          description: o.categories?.join(', ') || o.clinicalIndication || 'Analyse biologique',
          status: o.status,
        }));

        const imagingItems: ActivityItem[] = imagingOrders.map(o => ({
          id: o.id,
          type: 'Imagerie' as const,
          patientLabel: `Patient #${o.patientId.substring(0, 8).toUpperCase()}`,
          dateDisplay: this.formatDate(o.appointmentDate),
          time: this.isoToTime(o.appointmentDate),
          description: o.examTypes?.join(', ') || o.clinicalIndication || 'Examen d\'imagerie',
          status: o.status,
        }));

        const hospItems: ActivityItem[] = hospitalizations.map(h => ({
          id: h.id,
          type: 'Hospitalisation' as const,
          patientLabel: `Patient #${h.patientId.substring(0, 8).toUpperCase()}`,
          dateDisplay: this.formatDate(h.admissionDate),
          time: this.isoToTime(h.admissionDate),
          description: h.motif || h.department || 'Hospitalisation',
          status: h.status,
        }));

        this.allActivities = [...labItems, ...imagingItems, ...hospItems]
          .sort((a, b) => a.dateDisplay.localeCompare(b.dateDisplay));
        this.applyFilters();
        this.isLoadingActivities = false;
      });
  }

  applyFilters(): void {
    let list = this.allActivities;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a =>
        a.patientLabel.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter !== 'Tous les statuts') {
      list = list.filter(a => this.getStatusLabel(a.status) === this.statusFilter);
    }
    this.filteredActivities = list;
    this.currentPage = 0;
  }

  get paginatedActivities(): ActivityItem[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredActivities.slice(start, start + this.pageSize);
  }

  get totalElements(): number { return this.filteredActivities.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredActivities.length / this.pageSize)); }
  get isFirstPage(): boolean { return this.currentPage === 0; }
  get isLastPage(): boolean { return this.currentPage >= this.totalPages - 1; }

  previousPage(): void {
    if (!this.isFirstPage) this.currentPage--;
  }

  nextPage(): void {
    if (!this.isLastPage) this.currentPage++;
  }


  // === Statuts ===

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING:        'En attente',
      ACCEPTED:       'Accepté',
      FUNDED:         'Financé',
      IN_PROGRESS:    'En cours',
      COMPLETED:      'Terminé',
      REJECTED:       'Refusé',
      EXPIRED:        'Expiré',
      ADMITTED:       'Admis',
      DISCHARGED:     'Sorti',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:     'bg-[#F39C120F] text-[#F39C12]',
      ACCEPTED:    'bg-[#00B8940F] text-[#00B894]',
      FUNDED:      'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED:   'bg-gray-100 text-gray-600',
      REJECTED:    'bg-[#FF6B6B0F] text-[#FF6B6B]',
      EXPIRED:     'bg-orange-100 text-orange-700',
      ADMITTED:    'bg-purple-100 text-purple-700',
      DISCHARGED:  'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      'Analyse':        'bg-blue-100 text-blue-700',
      'Imagerie':       'bg-purple-100 text-purple-700',
      'Hospitalisation':'bg-rose-100 text-rose-700',
    };
    return map[type] || 'bg-gray-100 text-gray-600';
  }

  // === Utilitaires ===

  toDateString(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  isoToTime(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  allDaysUnavailable(): boolean { return false; }
}
