import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface LigneProduit {
  designation: string;
  sousDetail: string;
  qte: number;
  prixUnitaire: string;
  totalHT: string;
}

interface HistoriqueStep {
  label: string;
  date: string;
  status: 'done' | 'active' | 'upcoming';
  icon: 'check' | 'user' | 'doc';
}

interface DevisDetail {
  ref: string;
  fournisseurSlug: string;
  fournisseurNom: string;
  fournisseurDescription: string;
  contact: { nom: string; poste: string; email: string; telephone: string };
  historique: HistoriqueStep[];
  collaboration: {
    derniereCommande: string;
    tauxLivraison: string;
    evaluation: number;
  };
  produits: LigneProduit[];
  sousTotal: string;
  ttc: string;
  totalTTC: string;
  delaisLivraison: string;
  conditionsPaiement: string;
}

@Component({
  selector: 'app-detail-devis-organisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-devis-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDevisOrganisationComponent implements OnInit {
  id: string | null = null;
  devis: DevisDetail | undefined;

  stars(n: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(n));
  }

  private readonly dataById: Record<string, DevisDetail[]> = {
    '1': [
      {
        ref: 'REQ-ORG-0001',
        fournisseurSlug: 'eurohealth-distrib',
        fournisseurNom: 'Eurohealth Distrib',
        fournisseurDescription: 'Spécialiste en équipements de réanimation et monitoring',
        contact: {
          nom: 'Jean-Pierre Lambert',
          poste: 'Directeur des Ventes',
          email: 'jm.lefebvre@pharmacore.com',
          telephone: '+33 (0)4 72 89 00 12'
        },
        historique: [
          { label: 'Demande envoyée', date: '14 Oct. 2025 • 15:42', status: 'done', icon: 'check' },
          { label: 'Réponse - devis', date: '28 Oct. 2025 • 10:15', status: 'active', icon: 'user' },
          { label: 'Organisation', date: '', status: 'upcoming', icon: 'doc' }
        ],
        collaboration: {
          derniereCommande: '12 Mars 2024 — 3 000 000 FCFA',
          tauxLivraison: '98.5%',
          evaluation: 4
        },
        produits: [
          {
            designation: 'Moniteur Multiparamétrique VitalScan 5',
            sousDetail: 'Modèle: VS-500-2024 | Garantie 3 ans',
            qte: 4,
            prixUnitaire: '100 000 FCFA',
            totalHT: '400 000 FCFA'
          },
          {
            designation: 'Sondes de Température (Lot de 10)',
            sousDetail: 'Usage unique, stérile',
            qte: 20,
            prixUnitaire: '70 000 FCFA',
            totalHT: '1 400 000 FCFA'
          },
          {
            designation: "Logiciel d'Interfaçage Centralisé",
            sousDetail: 'Mise à jour v4.2 incluse',
            qte: 1,
            prixUnitaire: '2 100 000 FCFA',
            totalHT: '2 100 000 FCFA'
          }
        ],
        sousTotal: '3 900 000 FCFA',
        ttc: '100 000 FCFA',
        totalTTC: '4 000 000 FCFA',
        delaisLivraison:
          'Livraison prévue sous **10 à 15 jours ouvrés** après réception du bon de commande administratif. Installation et calibration sur site incluses par nos techniciens certifiés.',
        conditionsPaiement:
          'Virement bancaire à **30 jours fin de mois**. Escompte de 2% pour paiement comptant sous 8 jours. Clause de réserve de propriété maintenue jusqu\'au paiement intégral.'
      },
      {
        ref: 'REQ-ORG-0001',
        fournisseurSlug: 'medtech-solutions',
        fournisseurNom: 'MedTech Solutions',
        fournisseurDescription: 'Leader en équipements médicaux haute performance',
        contact: {
          nom: 'Sophie Marchand',
          poste: 'Responsable Commerciale',
          email: 'sophie.marchand@medtech.com',
          telephone: '+33 (0)1 44 55 66 77'
        },
        historique: [
          { label: 'Demande envoyée', date: '14 Oct. 2025 • 15:42', status: 'done', icon: 'check' },
          { label: 'Réponse - devis', date: '25 Oct. 2025 • 09:00', status: 'done', icon: 'check' },
          { label: 'Validation Technique', date: '30 Oct. 2025 • 14:00', status: 'active', icon: 'user' }
        ],
        collaboration: {
          derniereCommande: '05 Fév 2024 — 5 500 000 FCFA',
          tauxLivraison: '99.1%',
          evaluation: 5
        },
        produits: [
          {
            designation: 'Automate Anesthésie PrimaCare X3',
            sousDetail: 'Modèle: PCX-3 | Garantie 5 ans',
            qte: 2,
            prixUnitaire: '1 500 000 FCFA',
            totalHT: '3 000 000 FCFA'
          },
          {
            designation: 'Moniteur patient compact',
            sousDetail: 'Écran 15" tactile, 5 paramètres',
            qte: 5,
            prixUnitaire: '400 000 FCFA',
            totalHT: '2 000 000 FCFA'
          },
          {
            designation: 'Kit maintenance annuelle',
            sousDetail: 'Pièces + main d\'œuvre incluses',
            qte: 1,
            prixUnitaire: '500 000 FCFA',
            totalHT: '500 000 FCFA'
          }
        ],
        sousTotal: '5 200 000 FCFA',
        ttc: '300 000 FCFA',
        totalTTC: '5 500 000 FCFA',
        delaisLivraison:
          'Livraison sous **7 à 10 jours ouvrés**. Mise en service incluse avec formation du personnel sur site (2 jours).',
        conditionsPaiement:
          'Acompte de 30% à la commande. Solde à **60 jours réception**. Possibilité de crédit-bail sur 24 mois.'
      }
    ],
    '2': [
      {
        ref: 'REQ-ORG-0002',
        fournisseurSlug: 'biocore-advance',
        fournisseurNom: 'BioCore Advance',
        fournisseurDescription: 'Distributeur agréé équipements biomédicaux',
        contact: {
          nom: 'Karim Traoré',
          poste: 'Directeur Régional',
          email: 'k.traore@biocore.com',
          telephone: '+221 77 456 78 90'
        },
        historique: [
          { label: 'Demande envoyée', date: '10 Nov. 2025 • 11:00', status: 'done', icon: 'check' },
          { label: 'Réponse - devis', date: '17 Nov. 2025 • 15:40', status: 'active', icon: 'user' },
          { label: 'Organisation', date: '', status: 'upcoming', icon: 'doc' }
        ],
        collaboration: {
          derniereCommande: '20 Jan 2024 — 6 000 000 FCFA',
          tauxLivraison: '95.2%',
          evaluation: 4
        },
        produits: [
          {
            designation: 'Station Anesthésie BioFlow 7',
            sousDetail: 'Modèle: BF-7 Pro | Garantie 4 ans',
            qte: 3,
            prixUnitaire: '1 800 000 FCFA',
            totalHT: '5 400 000 FCFA'
          },
          {
            designation: 'Capteurs SpO2 (boîte de 20)',
            sousDetail: 'Compatible toutes marques',
            qte: 10,
            prixUnitaire: '60 000 FCFA',
            totalHT: '600 000 FCFA'
          }
        ],
        sousTotal: '5 700 000 FCFA',
        ttc: '300 000 FCFA',
        totalTTC: '6 000 000 FCFA',
        delaisLivraison: 'Livraison express **24h** sur stock disponible. Délai installation 3 jours supplémentaires.',
        conditionsPaiement: 'Paiement intégral à la commande. Remise de 5% pour paiement immédiat.'
      }
    ]
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    const list = (this.id && this.dataById[this.id]) || [];
    this.devis = list[0] ?? this.buildFallback();
  }

  private buildFallback(): DevisDetail {
    return {
      ref: this.id ? `REQ-ORG-${this.id.padStart(4, '0')}` : 'REQ-ORG-0000',
      fournisseurSlug: 'fournisseur-generique',
      fournisseurNom: 'Fournisseur Partenaire',
      fournisseurDescription: 'Spécialiste agréé en équipements médicaux et de laboratoire',
      contact: {
        nom: 'Responsable des ventes',
        poste: 'Service Commercial',
        email: 'commercial@fournisseur-partenaire.com',
        telephone: '+221 77 123 45 67'
      },
      historique: [
        { label: 'Demande envoyée', date: '01 Nov. 2025 • 09:00', status: 'done', icon: 'check' },
        { label: 'Réponse - devis', date: '05 Nov. 2025 • 14:30', status: 'done', icon: 'check' },
        { label: 'Validation en cours', date: 'En attente', status: 'active', icon: 'user' }
      ],
      collaboration: {
        derniereCommande: '15 Août 2024 — 2 500 000 FCFA',
        tauxLivraison: '97.4%',
        evaluation: 4.5
      },
      produits: [
        {
          designation: 'Équipement Médical Standard',
          sousDetail: 'Garantie 2 ans | Installation incluse',
          qte: 2,
          prixUnitaire: '1 000 000 FCFA',
          totalHT: '2 000 000 FCFA'
        },
        {
          designation: 'Lot de consommables',
          sousDetail: 'Conforme aux normes ISO',
          qte: 10,
          prixUnitaire: '50 000 FCFA',
          totalHT: '500 000 FCFA'
        }
      ],
      sousTotal: '2 500 000 FCFA',
      ttc: '250 000 FCFA',
      totalTTC: '2 750 000 FCFA',
      delaisLivraison: 'Livraison prévue sous **7 jours ouvrés**. Installation technique incluse.',
      conditionsPaiement: 'Acompte de 40% à la commande, le solde à **30 jours** après livraison.'
    };
  }

  back(): void {
    this.router.navigate(['/demande-organisation']);
  }

  formatText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  stepIconBg(status: HistoriqueStep['status']): string {
    switch (status) {
      case 'done':
        return 'bg-[#059669] text-white';
      case 'active':
        return 'bg-[#1E3A6E] text-white';
      case 'upcoming':
        return 'bg-[#E2E8F0] text-[#94A3B8]';
    }
  }
}

