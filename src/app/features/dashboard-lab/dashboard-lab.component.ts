import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

// ── Interfaces ────────────────────────────────────────────────────────────────

type Priority  = 'Urgent' | 'Normal';
type ExamStatus = 'En attente' | 'En cours' | 'Validé' | 'Annulé';

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

interface PerformanceBar {
  label: string;
  value: number;
  max: number;
  unit: string;
  displayValue: string;
  valueClass: string;
  barClass: string;
  subLabel: string;
}

interface AssuranceItem {
  label: string;
  percent: number;
  dotClass: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard-lab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-lab.component.html',
  styleUrl: './dashboard-lab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLabComponent implements OnInit {

  loading = true;

  // ── Stats ──────────────────────────────────────────────────────────────────
  stats = [
    { label: 'Examens reçus',    value: 8,  sub: 'Aujourd\'hui',    subClass: 'text-gray-400',  icon: 'flask'  },
    { label: 'Examens en attente', value: 4, sub: 'Dont 2 urgences', subClass: 'text-gray-400',  icon: 'clock'  },
    { label: 'Examens urgents',  value: 3,  sub: '-5%  vs mois dernier', subClass: 'text-red-500',   icon: 'alert'  },
    { label: 'Examens validés',  value: 2,  sub: '+8%  vs mois dernier', subClass: 'text-[#00B894]', icon: 'check'  }
  ];

  // ── Table ──────────────────────────────────────────────────────────────────
  examens: ExamRow[] = [
    { id: 4, initials: 'MD', patientName: 'Moussa Wade', patientRef: '#0004', type: 'Hémogramme complet', prescripteur: 'Dr. DIOP', receivedAt: '2025-01-15 09:15', priority: 'Urgent', status: 'En attente' },
    { id: 3, initials: 'MF', patientName: 'Maman Fall',  patientRef: '#0003', type: 'Hémogramme complet', prescripteur: 'Dr. DIOP', receivedAt: '2025-01-15 09:15', priority: 'Urgent', status: 'En attente' },
    { id: 2, initials: 'FF', patientName: 'Fatou Fall',  patientRef: '#0002', type: 'Glycémie à jeun',    prescripteur: 'Dr. DIOP', receivedAt: '2025-01-15 08:30', priority: 'Normal', status: 'En cours'   },
    { id: 1, initials: 'IL', patientName: 'Isseu Ly',    patientRef: '#0001', type: 'Bilan lipidique',    prescripteur: 'Dr. DIOP', receivedAt: '2025-01-14 11:45', priority: 'Normal', status: 'Validé'     },
    { id: 1, initials: 'IL', patientName: 'Isseu Ly',    patientRef: '#0001', type: 'Bilan lipidique',    prescripteur: 'Dr. DIOP', receivedAt: '2025-01-14 11:45', priority: 'Normal', status: 'Validé'     }
  ];

  // ── Performance du jour ────────────────────────────────────────────────────
  performance: PerformanceBar[] = [
    { label: 'Délai moyen de rendu', value: 75, max: 100, unit: '', displayValue: '45 min', valueClass: 'text-[#343A40] font-medium', barClass: 'bg-[#2C7BE5]',  subLabel: 'Objectif : < 60 min' },
    { label: 'Taux de conformité',   value: 98.5, max: 100, unit: '', displayValue: '98.5%', valueClass: 'text-[#343A40] font-medium', barClass: 'bg-[#00B894]', subLabel: '' },
    { label: 'Analyses anormales',   value: 12, max: 100, unit: '', displayValue: '12%',  valueClass: 'text-[#F59E0B] font-semibold', barClass: 'bg-[#F59E0B]', subLabel: '' }
  ];

  // ── État Assurance ─────────────────────────────────────────────────────────
  assurance: AssuranceItem[] = [
    { label: 'Pris en charge', percent: 85, dotClass: 'bg-[#00B894]' },
    { label: 'En attente',     percent: 12, dotClass: 'bg-[#F59E0B]' },
    { label: 'Refusé',         percent: 3,  dotClass: 'bg-red-500'   }
  ];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    of(null).pipe(delay(300)).subscribe(() => {
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getStatusClass(status: ExamStatus): string {
    switch (status) {
      case 'En attente': return 'bg-yellow-100 text-yellow-700';
      case 'En cours':   return 'bg-blue-100 text-blue-700';
      case 'Validé':     return 'bg-green-100 text-[#00B894]';
      case 'Annulé':     return 'bg-red-100 text-red-600';
    }
  }

  navigateToAll(): void { this.router.navigate(['/examens-laboratoire']); }
  viewExam(id: number): void { this.router.navigate(['/detail-examen-laboratoire', id]); }
}
