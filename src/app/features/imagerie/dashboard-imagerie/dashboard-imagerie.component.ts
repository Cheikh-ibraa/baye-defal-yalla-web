import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: number;
  sub: string;
  subClass: string;
  icon: 'flask' | 'clock' | 'file' | 'users';
}

type Priority = 'Urgent' | 'Normal';
type ExamenStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
type EquipmentStatus = 'available' | 'busy' | 'maintenance';

interface PlanningExam {
  id: number;
  patientInitials: string;
  patientName: string;
  patientRef: string;
  type: string;
  prescripteur: string;
  equipements: string[];
  receivedAt: string;
  priority: Priority;
  status: ExamenStatus;
  hasAction: boolean;
}

interface Equipment {
  name: string;
  percent: number;
  status: EquipmentStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard-imagerie',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-imagerie.component.html',
  styleUrl: './dashboard-imagerie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardImagerieComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────────────────────
  loading = true;

  stats: StatCard[] = [];
  planningExams: PlanningExam[] = [];
  equipments: Equipment[] = [];

  // ── Mock data ──────────────────────────────────────────────────────────────
  private mockStats: StatCard[] = [
    { label: 'Examens du jour', value: 8,   sub: "Aujourd'hui",      subClass: 'text-gray-400',  icon: 'flask' },
    { label: 'Examens en attente', value: 3, sub: 'Dont 2 urgences',  subClass: 'text-red-500 font-medium',   icon: 'clock' },
    { label: 'Examens réalisés', value: 4,   sub: 'Total',            subClass: 'text-[#00B894]', icon: 'file'  },
    { label: 'Patients', value: 124,         sub: '+4% vs mois dernier', subClass: 'text-gray-500', icon: 'users', }
  ];

  private mockExams: PlanningExam[] = [
    { id: 5, patientInitials: 'MD', patientName: 'Moussa Wade', patientRef: '#0005', type: 'Cérébral',    prescripteur: 'Dr. Neuro',  equipements: ['IRM-01', 'IRM'],     receivedAt: '2025-01-15 09:15', priority: 'Urgent', status: 'ACCEPTED',  hasAction: true  },
    { id: 4, patientInitials: 'MF', patientName: 'Maman Fall',  patientRef: '#0004', type: 'Thorax',      prescripteur: 'Dr. Pneumo', equipements: ['CT-01', 'Scanner'],  receivedAt: '2025-01-15 09:15', priority: 'Urgent', status: 'ACCEPTED',  hasAction: true  },
    { id: 3, patientInitials: 'FF', patientName: 'Fatou Fall',  patientRef: '#0003', type: 'Genou Droit', prescripteur: 'Dr. Ortho',  equipements: ['RX-02', 'Radio'],    receivedAt: '2025-01-15 08:30', priority: 'Normal', status: 'PENDING',   hasAction: false },
    { id: 2, patientInitials: 'IL', patientName: 'Isseu Ly',    patientRef: '#0002', type: 'Abdominal',   prescripteur: 'Dr. Gastro', equipements: ['US-01', 'Echo'],     receivedAt: '2025-01-14 11:45', priority: 'Normal', status: 'PENDING',   hasAction: false },
    { id: 1, patientInitials: 'IL', patientName: 'Isseu Ly',    patientRef: '#0001', type: 'Genou Gauche',prescripteur: 'Dr. Ortho',  equipements: ['CT-01', 'Scanner'],  receivedAt: '2025-01-14 11:45', priority: 'Normal', status: 'PENDING',   hasAction: false }
  ];

  private mockEquipments: Equipment[] = [
    { name: 'IRM-01', percent: 85, status: 'busy'        },
    { name: 'CT-01',  percent: 60, status: 'available'   },
    { name: 'RX-01',  percent: 45, status: 'available'   },
    { name: 'RX-02',  percent: 30, status: 'maintenance' },
    { name: 'US-01',  percent: 75, status: 'busy'        }
  ];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    of(null).pipe(delay(300)).subscribe(() => {
      this.stats        = this.mockStats;
      this.planningExams = this.mockExams;
      this.equipments   = this.mockEquipments;
      this.loading      = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  getEquipmentBarClass(status: EquipmentStatus): string {
    return status === 'busy' ? 'bg-red-500'
      : status === 'maintenance' ? 'bg-yellow-400'
      : 'bg-[#00B894]';
  }

  navigateToAll(): void {
    this.router.navigate(['/examens-imagerie']);
  }

  viewExam(id: number): void {
    this.router.navigate(['/detail-examen-imagerie', id]);
  }

  confirmExam(id: number): void {
    // Action validation — à brancher sur le service
    console.log('confirm', id);
  }
}
