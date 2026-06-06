import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

interface KpiCard {
  title: string;
  value: number;
  percentage: string;
  trendClass: string;
  iconBg: string;
  iconColor: string;
  iconType: 'box' | 'plane' | 'check' | 'cross';
  badgeText?: string;
  badgeBg?: string;
}

interface ActivityItem {
  type: 'retenu' | 'demande' | 'envoye';
  title: string;
  subtitle: string;
  isUrgent?: boolean;
}

interface ClientItem {
  name: string;
  orders: number;
}

@Component({
  selector: 'app-dashboard-fournisseur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardFournisseurComponent {
  selectedPeriod = 'Ce-mois';

  readonly kpis: KpiCard[] = [
    {
      title: 'Demandes reçues',
      value: 12,
      percentage: '+15%',
      trendClass: 'bg-[#2FA373] text-white',
      iconBg: 'bg-[#EEF2F6]',
      iconColor: 'text-[#1E40AF]',
      iconType: 'box'
    },
    {
      title: 'Devis envoyés',
      value: 45,
      percentage: '+5%',
      trendClass: 'bg-[#0F4C81] text-white',
      iconBg: 'bg-[#00B8941A]',
      iconColor: 'text-[#0C66E4]',
      iconType: 'plane'
    },
    {
      title: 'Devis retenus',
      value: 8,
      percentage: 'Record',
      trendClass: 'bg-[#EA580C] text-white',
      iconBg: 'bg-[#00B894]',
      iconColor: 'text-[#137333]',
      iconType: 'check'
    },
    {
      title: 'Devis non retenus',
      value: 5,
      percentage: '-2%',
      trendClass: 'bg-[#FFDAD6] text-[#BA1A1A]',
      iconBg: 'bg-[#FFDAD6]',
      iconColor: 'text-[#C5221F]',
      iconType: 'cross'
    }
  ];

  readonly activities: ActivityItem[] = [
    {
      type: 'retenu',
      title: 'Devis retenu - Clinique du Parc',
      subtitle: 'Prothèses hanche (Lot 45) - Il y a 4 heures'
    },
    {
      type: 'demande',
      title: 'Nouvelle demande - CHU Lyon',
      subtitle: 'Fournitures chirurgicales - Il y a 10 minutes',
      isUrgent: true
    },
    {
      type: 'envoye',
      title: 'Devis envoyé - Hôpital Nord',
      subtitle: 'Consommables IRM - Il y a 2 heures'
    },
    {
      type: 'retenu',
      title: 'Devis retenu - Clinique du Parc',
      subtitle: 'Prothèses hanche (Lot 45) - Il y a 4 heures'
    },
    {
      type: 'demande',
      title: 'Nouvelle demande - CHU Lyon',
      subtitle: 'Fournitures chirurgicales - Il y a 10 minutes',
      isUrgent: true
    }
  ];

  readonly topClients: ClientItem[] = [
    { name: 'AP-HM Marseille', orders: 15 },
    { name: 'Hospices Civils de Lyon', orders: 12 },
    { name: 'Institut Curie', orders: 8 }
  ];
}
