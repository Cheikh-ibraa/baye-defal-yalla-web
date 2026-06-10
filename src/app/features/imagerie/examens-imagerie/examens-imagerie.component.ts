import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// ── Interfaces ────────────────────────────────────────────────────────────────

type Priority = 'Urgent' | 'Normal';
type ExamStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

interface ExamRow {
  id: number;
  initials: string;
  patientName: string;
  patientRef: string;
  type: string;
  prescripteur: string;
  equipements: string[];
  receivedAt: string;
  priority: Priority;
  status: ExamStatus;
}

interface FilterOption { label: string; value: string | null; }

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-examens-imagerie',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './examens-imagerie.component.html',
  styleUrl: './examens-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamensImagerieComponent implements OnInit {

  // ── Mock data ──────────────────────────────────────────────────────────────
  private allExams: ExamRow[] = [
    { id: 5, initials: 'MD', patientName: 'Moussa Wade', patientRef: '#0005', type: 'Cérébral',     prescripteur: 'Dr. Neuro',  equipements: ['IRM-01', 'IRM'],    receivedAt: '2025-01-15 09:15', priority: 'Urgent', status: 'ACCEPTED'  },
    { id: 4, initials: 'MF', patientName: 'Maman Fall',  patientRef: '#0004', type: 'Thorax',       prescripteur: 'Dr. Pneumo', equipements: ['CT-01', 'Scanner'], receivedAt: '2025-01-15 09:15', priority: 'Urgent', status: 'ACCEPTED'  },
    { id: 3, initials: 'FF', patientName: 'Fatou Fall',  patientRef: '#0003', type: 'Genou Droit',  prescripteur: 'Dr. Ortho',  equipements: ['RX-02', 'Radio'],   receivedAt: '2025-01-15 08:30', priority: 'Normal', status: 'PENDING'   },
    { id: 2, initials: 'IL', patientName: 'Isseu Ly',    patientRef: '#0002', type: 'Abdominal',    prescripteur: 'Dr. Gastro', equipements: ['US-01', 'Echo'],    receivedAt: '2025-01-14 11:45', priority: 'Normal', status: 'PENDING'   },
    { id: 1, initials: 'IL', patientName: 'Isseu Ly',    patientRef: '#0001', type: 'Genou Gauche', prescripteur: 'Dr. Ortho',  equipements: ['CT-01', 'Scanner'], receivedAt: '2025-01-14 11:45', priority: 'Normal', status: 'PENDING'   }
  ];

  // ── Display data ───────────────────────────────────────────────────────────
  exams: ExamRow[] = [];

  // ── Filters ────────────────────────────────────────────────────────────────
  searchTerm = '';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;
  statusLabel  = 'Tous les statuts';
  priorityLabel = 'Toutes les priorités';
  showStatusMenu   = false;
  showPriorityMenu = false;

  statusOptions: FilterOption[] = [
    { label: 'Tous les statuts', value: null },
    { label: 'En attente',       value: 'PENDING'   },
    { label: 'Accepté',          value: 'ACCEPTED'  },
    { label: 'Terminé',          value: 'COMPLETED' },
    { label: 'Annulé',           value: 'CANCELLED' }
  ];

  priorityOptions: FilterOption[] = [
    { label: 'Toutes les priorités', value: null },
    { label: 'Urgent',               value: 'Urgent' },
    { label: 'Normal',               value: 'Normal' }
  ];

  // ── Pagination ─────────────────────────────────────────────────────────────
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages    = 0;

  get startItem(): number { return this.totalElements === 0 ? 0 : this.page * this.size + 1; }
  get endItem():   number { return Math.min((this.page + 1) * this.size, this.totalElements); }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.applyFilters(); }

  // ── Filters ────────────────────────────────────────────────────────────────
  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.allExams.filter(e => {
      const matchSearch   = !term || e.patientName.toLowerCase().includes(term) || e.patientRef.includes(term);
      const matchStatus   = !this.selectedStatus   || e.status   === this.selectedStatus;
      const matchPriority = !this.selectedPriority || e.priority === this.selectedPriority;
      return matchSearch && matchStatus && matchPriority;
    });
    this.totalElements = filtered.length;
    this.totalPages    = Math.ceil(this.totalElements / this.size) || 1;
    if (this.page >= this.totalPages) this.page = 0;
    const start = this.page * this.size;
    this.exams  = filtered.slice(start, start + this.size);
    this.cdr.markForCheck();
  }

  onSearchChange(): void { this.page = 0; this.applyFilters(); }

  setStatus(opt: FilterOption): void {
    this.selectedStatus  = opt.value;
    this.statusLabel     = opt.label;
    this.showStatusMenu  = false;
    this.page = 0;
    this.applyFilters();
  }

  setPriority(opt: FilterOption): void {
    this.selectedPriority  = opt.value;
    this.priorityLabel     = opt.label;
    this.showPriorityMenu  = false;
    this.page = 0;
    this.applyFilters();
  }

  closeMenus(): void { this.showStatusMenu = false; this.showPriorityMenu = false; }

  // ── Pagination ─────────────────────────────────────────────────────────────
  prevPage(): void { if (this.page > 0) { this.page--; this.applyFilters(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.applyFilters(); } }

  onSizeChange(val: number): void { this.size = val; this.page = 0; this.applyFilters(); }
}
