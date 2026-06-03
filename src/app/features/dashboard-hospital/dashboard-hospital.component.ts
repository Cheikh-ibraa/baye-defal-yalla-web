import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  badge?: string;
  badgeClass?: string;
  icon: 'users' | 'requests' | 'critical' | 'money';
}

interface ActivityItem {
  title: string;
  subtitle: string;
  meta: string;
  time: string;
  icon: 'admission' | 'validation' | 'payment';
}

interface ServiceItem {
  name: string;
  count: number;
  progress: number;
  barClass: string;
  icon: 'pharmacy' | 'laboratory' | 'imagerie';
}

@Component({
  selector: 'app-dashboard-hospital',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard-hospital.component.html',
  styleUrls: ['./dashboard-hospital.component.css']
})
export class DashboardHospitalComponent {
  readonly selectedPeriod = 'Ce-mois';

  readonly evolutionChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEP', 'OCT', 'NOV', 'DÉC'],
    datasets: [
      {
        data: [8, 18, 34, 40, 42, 50, 52, 53, 52, 56, 62, 71],
        borderColor: '#2F7BF0',
        backgroundColor: 'rgba(219, 234, 254, 0.7)',
        fill: true,
        tension: 0.42,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#2F7BF0',
        pointBorderWidth: 3,
        borderWidth: 3
      }
    ]
  };

  readonly evolutionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    layout: {
      padding: {
        top: 6,
        right: 12,
        bottom: 0,
        left: 0
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            weight: 600
          },
          padding: 14
        }
      },
      y: {
        display: false,
        beginAtZero: true,
        grid: {
          display: false
        },
        border: {
          display: false
        }
      }
    }
  };

  readonly statCards: StatCard[] = [
    {
      title: 'TOTAL PATIENTS',
      value: '1,284',
      badge: '+4.2%',
      badgeClass: 'bg-emerald-50 text-emerald-500',
      icon: 'users'
    },
    {
      title: 'DEMANDES EN COURS',
      value: '45',
      badge: 'EN DIRECT',
      badgeClass: 'text-[#94A3B8]',
      icon: 'requests'
    },
    {
      title: 'CAS CRITIQUES',
      value: '12',
      badge: '! URGENT',
      badgeClass: 'bg-[#BA1A1A0D] text-[#BA1A1A]',
      icon: 'critical'
    },
    {
      title: 'TOTAL COLLECTÉ',
      value: '45.2M CFA',
      icon: 'money'
    }
  ];

  readonly recentActivities: ActivityItem[] = [
    {
      title: 'Admission patient: Marie Diallo',
      subtitle: 'Unité de Soins Intensifs',
      meta: 'Chambre 204',
      time: 'IL Y A 10 MIN',
      icon: 'admission'
    },
    {
      title: 'Demande validée: PT-2024-882',
      subtitle: 'Service de Radiologie',
      meta: 'Par Dr. Sow',
      time: 'IL Y A 45 MIN',
      icon: 'validation'
    },
    {
      title: 'Paiement reçu: 850,000 CFA',
      subtitle: 'Facture #F-9921',
      meta: 'Assurance AXA',
      time: 'IL Y A 2H',
      icon: 'payment'
    }
  ];

  readonly serviceItems: ServiceItem[] = [
    { name: 'Pharmacie', count: 128, progress: 76, barClass: 'bg-blue-900', icon: 'pharmacy' },
    { name: 'Laboratoire', count: 56, progress: 46, barClass: 'bg-blue-500', icon: 'laboratory' },
    { name: 'Imagerie', count: 24, progress: 22, barClass: 'bg-blue-400', icon: 'imagerie' }
  ];

  readonly quickMetrics = [
    { label: 'Admissions', value: '18' },
    { label: 'Urgences', value: '04' },
    { label: 'Sorties', value: '11' },
    { label: 'Taux d’occupation', value: '84%' }
  ];

  readonly hospitalMenuItems = [
    { label: 'Tableau de bord', route: '/dashboard-hospital', active: true },
    { label: 'Demandes', route: '/demandes' },
    { label: 'Patients', route: '/patients-hospital' },
    { label: 'Hospitalisations', route: '/hospitalisations' },
    { label: 'Chirurgie', route: '/chirurgie' },
    { label: 'Matériels', route: '/demande-materiels' },
    { label: 'Paiements', route: '/paiements-hospital' }
  ];

  readonly timelineItems = [
    { label: 'Admissions du jour', value: '24', color: '#104382' },
    { label: 'Sorties validées', value: '16', color: '#0F9D8A' },
    { label: 'Dossiers en attente', value: '09', color: '#F59E0B' }
  ];

  exportData(): void {
    return;
  }

  getProgressWidth(progress: number): string {
    return `${progress}%`;
  }
}