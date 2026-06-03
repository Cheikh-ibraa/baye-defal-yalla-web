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
  selector: 'app-detail-devis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-devis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDevisComponent implements OnInit {
  ref: string | null = null;
  slug: string | null = null;
  devis: DevisDetail | undefined;

  stars(n: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(n));
  }

  private readonly data: DevisDetail[] = [
    {
      ref: 'REQ-2024-042',
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
      delaisLivraison: 'Livraison prévue sous **10 à 15 jours ouvrés** après réception du bon de commande administratif. Installation et calibration sur site incluses par nos techniciens certifiés.',
      conditionsPaiement: 'Virement bancaire à **30 jours fin de mois**. Escompte de 2% pour paiement comptant sous 8 jours. Clause de réserve de propriété maintenue jusqu\'au paiement intégral.'
    },
    {
      ref: 'REQ-2024-042',
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
      delaisLivraison: 'Livraison sous **7 à 10 jours ouvrés**. Mise en service incluse avec formation du personnel sur site (2 jours).',
      conditionsPaiement: 'Acompte de 30% à la commande. Solde à **60 jours réception**. Possibilité de crédit-bail sur 24 mois.'
    },
    {
      ref: 'REQ-2024-042',
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
        { label: 'Demande envoyée', date: '14 Oct. 2025 • 15:42', status: 'done', icon: 'check' },
        { label: 'Réponse - devis', date: '26 Oct. 2025 • 11:30', status: 'active', icon: 'user' },
        { label: 'Signature', date: '', status: 'upcoming', icon: 'doc' }
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
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.ref = this.route.snapshot.paramMap.get('ref');
    this.slug = this.route.snapshot.paramMap.get('fournisseur');
    this.devis = this.data.find(d => d.ref === this.ref && d.fournisseurSlug === this.slug)
      ?? this.buildFallback();
  }

  /** Construit un détail générique en réutilisant la structure REQ-2024-042/eurohealth-distrib
   *  mais en adaptant le nom du fournisseur depuis le slug de l'URL. */
  private buildFallback(): DevisDetail {
    const base = this.data.find(d => d.fournisseurSlug === 'eurohealth-distrib')!;
    const nomFromSlug = (this.slug ?? 'Fournisseur')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      ...base,
      ref: this.ref ?? '',
      fournisseurSlug: this.slug ?? '',
      fournisseurNom: nomFromSlug,
      fournisseurDescription: 'Spécialiste en fournitures médicales',
      contact: {
        nom: 'Contact Commercial',
        poste: 'Responsable des ventes',
        email: 'contact@fournisseur.com',
        telephone: '+221 77 000 00 00'
      }
    };
  }

  back(): void {
    this.router.navigate(['/demande-materiels', this.ref]);
  }

  formatText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  stepIconBg(status: HistoriqueStep['status']): string {
    switch (status) {
      case 'done':    return 'bg-[#059669] text-white';
      case 'active':  return 'bg-[#1E3A6E] text-white';
      case 'upcoming': return 'bg-[#E2E8F0] text-[#94A3B8]';
    }
  }
}
