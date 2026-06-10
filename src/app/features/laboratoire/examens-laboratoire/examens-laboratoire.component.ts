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
  receivedAt: string;
  priority: Priority;
  status: ExamStatus;
}

interface FilterOption { label: string; value: string | null; }

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-examens-laboratoire',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './examens-laboratoire.component.html',
  styleUrl: './examens-laboratoire.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamensLaboratoireComponent implements OnInit {

  // ── Mock data (4 lignes) ───────────────────────────────────────────────────
  private allExams: ExamRow[] = [
    { id: 4, initials: 'MD', patientName: 'Moussa Diallo', patientRef: '#0004', type: 'NFS',            prescripteur: 'Dr. Cardio',  receivedAt: '2025-01-15 09:15', priority: 'Urgent', status: 'ACCEPTED' },
    { id: 3, initials: 'AF', patientName: 'Aminata Fall',  patientRef: '#0003', type: 'Glycémie',       prescripteur: 'Dr. Endocrino',receivedAt: '2025-01-15 08:30', priority: 'Urgent', status: 'ACCEPTED' },
    { id: 2, initials: 'OS', patientName: 'Omar Sow',      patientRef: '#0002', type: 'Ionogramme',     prescripteur: 'Dr. Néphro',  receivedAt: '2025-01-14 11:45', priority: 'Normal', status: 'PENDING'  },
    { id: 1, initials: 'FN', patientName: 'Fatou Ndiaye',  patientRef: '#0001', type: 'Bilan hépatique',prescripteur: 'Dr. Gastro',  receivedAt: '2025-01-14 10:00', priority: 'Normal', status: 'PENDING'  }
  ];

  // ── Display data ───────────────────────────────────────────────────────────
  exams: ExamRow[] = [];

  // ── Filters ────────────────────────────────────────────────────────────────
  searchTerm = '';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;
  statusLabel   = 'Tous les statuts';
  priorityLabel = 'Toutes les priorités';
  showStatusMenu   = false;
  showPriorityMenu = false;

  statusOptions: FilterOption[] = [
    { label: 'Tous les statuts', value: null       },
    { label: 'En attente',       value: 'PENDING'  },
    { label: 'Accepté',          value: 'ACCEPTED' },
    { label: 'Terminé',          value: 'COMPLETED'},
    { label: 'Annulé',           value: 'CANCELLED'}
  ];

  priorityOptions: FilterOption[] = [
    { label: 'Toutes les priorités', value: null     },
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
    this.selectedStatus = opt.value;
    this.statusLabel    = opt.label;
    this.showStatusMenu = false;
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
