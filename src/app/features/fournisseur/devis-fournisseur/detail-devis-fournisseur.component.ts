import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface DevisProduct {
  name: string;
  unit: string;
  qty: number;
  unitPrice: string;
  total: string;
}

interface TimelineEvent {
  title: string;
  time: string;
  description: string;
  iconType: 'check' | 'plane' | 'eye' | 'success';
}

interface DevisDetail {
  id: string;
  hopitalName: string;
  departement: string;
  location: string;
  categorie: string;
  status: string;
  valableJusquAu: string;
  conditionsPaiement: string;
  gestionnaire: string;
  devise: string;
  products: DevisProduct[];
  sousTotal: string;
  remise: {
    label: string;
    amount: string;
  };
  tva: string;
  montantTotal: string;
  timeline: TimelineEvent[];
  notesInternes: string;
}

@Component({
  selector: 'app-detail-devis-fournisseur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-devis-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDevisFournisseurComponent implements OnInit {
  devisDetail: DevisDetail | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const devisId = this.route.snapshot.paramMap.get('id');
    this.devisDetail = this.fetchDevisDetail(devisId);
  }

  fetchDevisDetail(id: string | null): DevisDetail {
    // Mock data that could be replaced by an API call later
    const hopitalName = id === '2' || id === '6' ? 'Clinique du Parc' : 
                        id === '3' || id === '4' ? 'CHRU Lille' : 'Hôpital Saint-Louis';
    
    let status = 'Retenu';
    if (id === '2' || id === '6') status = 'En attente';
    if (id === '3' || id === '4') status = 'Non retenu';

    return {
      id: id || '1',
      hopitalName: hopitalName,
      departement: 'Division Centrale des Achats',
      location: hopitalName.includes('Lille') ? 'Lille' : hopitalName.includes('Parc') ? 'Lyon' : 'Saint-Louis',
      categorie: 'Équipement de bureau',
      status: status,
      valableJusquAu: '30 sept. 2023',
      conditionsPaiement: 'Net 30 Jours',
      gestionnaire: 'Mouhamed Diop',
      devise: 'FCFA',
      products: [
        {
          name: 'Scalpels chirurgicaux de précision (Pack 50)',
          unit: 'Boites',
          qty: 12,
          unitPrice: '100 000',
          total: '1 200 000'
        },
        {
          name: 'Rouleaux de gaze stérile',
          unit: 'Boites',
          qty: 40,
          unitPrice: '70 000',
          total: '2 800 000'
        },
        {
          name: 'Moniteur cardiaque numérique V4',
          unit: 'Unité',
          qty: 2,
          unitPrice: '50 000',
          total: '100 000'
        },
        {
          name: 'Gants de protection en nitrile',
          unit: 'Boites',
          qty: 15,
          unitPrice: '20 000',
          total: '300 000'
        }
      ],
      sousTotal: '4 400 000',
      remise: {
        label: 'Remise Médicale (5%)',
        amount: '-220 000'
      },
      tva: '100 000',
      montantTotal: '4 280 000',
      timeline: [
        {
          title: 'Devis créé',
          time: '12 août 2023 • 09:15',
          description: 'Rédigé par Sarah Jenkins',
          iconType: 'check'
        },
        {
          title: "Envoyé à l'hôpital",
          time: '13 août 2023 • 11:40',
          description: 'Envoyé à procurement@stmarys.org',
          iconType: 'plane'
        },
        {
          title: 'Consulté par le client',
          time: '14 août 2023 • 10:22',
          description: 'Ouvert depuis Chicago, IL [IP: 192.168.1.45]',
          iconType: 'eye'
        },
        {
          title: 'Retenu',
          time: 'Livraison en cours',
          description: '',
          iconType: 'success'
        }
      ],
      notesInternes: '"Le client est intéressé par une extension de cette commande si les moniteurs cardiaques sont performants lors du déploiement initial. À suivre après la première livraison. Application de la remise standard Hôpital Tier 2."'
    };
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Retenu':     return 'bg-[#E6F4EA] text-[#137333]';
      case 'En attente': return 'bg-[#DBEAFE] text-[#104382]';
      case 'Non retenu': return 'bg-[#FCE8E6] text-[#C5221F]';
      default:           return 'bg-slate-100 text-slate-600';
    }
  }

  back(): void {
    this.router.navigate(['/devis-fournisseur']);
  }
}
