import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type DevisStatut = 'Validé Technique' | 'En révision' | 'Attente Signature' | 'Rejeté';

type KpiId = 'devis' | 'prix' | 'delai' | 'echeance';

interface KpiDetail {
  id: KpiId;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}

interface Fournisseur {
  nom: string;
  slug: string;
  note: number;
  avis: number;
  prixTotal: string;
  delaiLivraison: string;
  dateReception: string;
  statut: DevisStatut;
}

interface DetailDemande {
  ref: string;
  titre: string;
  description: string;
  devisRecus: number;
  meilleurPrix: string;
  delaiMoyen: string;
  echeance: string;
  fournisseurs: Fournisseur[];
}

@Component({
  selector: 'app-detail-demande-materiels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-demande-materiels.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDemandeMaterielComponent implements OnInit {
  ref: string | null = null;
  detail: DetailDemande | undefined;
  kpis: KpiDetail[] = [];

  private readonly data: DetailDemande[] = [
    {
      ref: 'REQ-2024-042',
      titre: 'Equipements de blocs opératoires',
      description: "Série d'automates d'anesthésie et moniteurs multiparamétriques",
      devisRecus: 12,
      meilleurPrix: '4 000 000 FCFA',
      delaiMoyen: '5 jours',
      echeance: '12/05/26',
      fournisseurs: [
        {
          nom: 'MedTech Solutions',
          slug: 'medtech-solutions',
          note: 4.9,
          avis: 128,
          prixTotal: '5 500 000 FCFA',
          delaiLivraison: '48h',
          dateReception: '12 Oct 2025',
          statut: 'Validé Technique'
        },
        {
          nom: 'EuroHealth Distrib',
          slug: 'eurohealth-distrib',
          note: 4.7,
          avis: 94,
          prixTotal: '4 000 000 FCFA',
          delaiLivraison: '5 jours',
          dateReception: '14 Oct 2025',
          statut: 'En révision'
        },
        {
          nom: 'BioCore Advance',
          slug: 'biocore-advance',
          note: 4.2,
          avis: 42,
          prixTotal: '6 000 000 FCFA',
          delaiLivraison: '24h',
          dateReception: '15 Oct 2025',
          statut: 'Attente Signature'
        }
      ]
    },
    {
      ref: 'REQ-2024-001',
      titre: 'Gants stériles en latex',
      description: 'Gants chirurgicaux stériles taille S/M/L — commande annuelle',
      devisRecus: 4,
      meilleurPrix: '320 000 FCFA',
      delaiMoyen: '3 jours',
      echeance: '30/11/26',
      fournisseurs: [
        {
          nom: 'Pharma Supply Co.',
          slug: 'pharma-supply-co',
          note: 4.5,
          avis: 210,
          prixTotal: '320 000 FCFA',
          delaiLivraison: '3 jours',
          dateReception: '10 Oct 2023',
          statut: 'Validé Technique'
        },
        {
          nom: 'MediGloves SAS',
          slug: 'medigloves-sas',
          note: 4.1,
          avis: 87,
          prixTotal: '380 000 FCFA',
          delaiLivraison: '5 jours',
          dateReception: '11 Oct 2023',
          statut: 'En révision'
        }
      ]
    },
    {
      ref: 'REQ-2024-015',
      titre: 'Kits de perfusion standard',
      description: 'Kits IV complets pour perfusion continue — usage hospitalier',
      devisRecus: 3,
      meilleurPrix: '180 000 FCFA',
      delaiMoyen: '4 jours',
      echeance: '15/01/26',
      fournisseurs: [
        {
          nom: 'InfuMed Pro',
          slug: 'infumed-pro',
          note: 4.8,
          avis: 155,
          prixTotal: '180 000 FCFA',
          delaiLivraison: '2 jours',
          dateReception: '04 Oct 2023',
          statut: 'Validé Technique'
        },
        {
          nom: 'HealthDirect',
          slug: 'healthdirect',
          note: 4.3,
          avis: 60,
          prixTotal: '210 000 FCFA',
          delaiLivraison: '6 jours',
          dateReception: '05 Oct 2023',
          statut: 'Attente Signature'
        },
        {
          nom: 'MedLine Africa',
          slug: 'medline-africa',
          note: 3.9,
          avis: 34,
          prixTotal: '250 000 FCFA',
          delaiLivraison: '4 jours',
          dateReception: '06 Oct 2023',
          statut: 'Rejeté'
        }
      ]
    },
    {
      ref: 'REQ-2024-112',
      titre: 'Sondes urinaires silicone',
      description: 'Sondes Foley silicone CH12 à CH22 — stock 6 mois',
      devisRecus: 5,
      meilleurPrix: '95 000 FCFA',
      delaiMoyen: '2 jours',
      echeance: '28/02/26',
      fournisseurs: [
        {
          nom: 'SondeMed',
          slug: 'sondemed',
          note: 4.6,
          avis: 75,
          prixTotal: '95 000 FCFA',
          delaiLivraison: '48h',
          dateReception: '29 Sep 2023',
          statut: 'Validé Technique'
        },
        {
          nom: 'CathSup Intl',
          slug: 'cathsup-intl',
          note: 4.4,
          avis: 48,
          prixTotal: '110 000 FCFA',
          delaiLivraison: '3 jours',
          dateReception: '30 Sep 2023',
          statut: 'En révision'
        }
      ]
    },
    {
      ref: 'REQ-2024-088',
      titre: 'Pansements hydrocellulaires',
      description: 'Pansements absorbants pour plaies chroniques — formats variés',
      devisRecus: 3,
      meilleurPrix: '145 000 FCFA',
      delaiMoyen: '3 jours',
      echeance: '10/03/26',
      fournisseurs: [
        {
          nom: 'WoundCare Pro',
          slug: 'woundcare-pro',
          note: 4.7,
          avis: 92,
          prixTotal: '145 000 FCFA',
          delaiLivraison: '2 jours',
          dateReception: '26 Sep 2023',
          statut: 'Validé Technique'
        },
        {
          nom: 'BioFlex Medical',
          slug: 'bioflex-medical',
          note: 4.0,
          avis: 31,
          prixTotal: '170 000 FCFA',
          delaiLivraison: '4 jours',
          dateReception: '27 Sep 2023',
          statut: 'Attente Signature'
        }
      ]
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.ref = this.route.snapshot.paramMap.get('ref');
    this.detail = this.data.find(d => d.ref === this.ref);
    if (this.detail) {
      this.kpis = [
        { id: 'devis',    label: 'Devis reçus',   value: this.detail.devisRecus,  iconBg: 'bg-[#DCE1FF]', iconColor: 'text-[#00339E]' },
        { id: 'prix',     label: 'Meilleur prix',  value: this.detail.meilleurPrix, iconBg: 'bg-[#00B894]',  iconColor: 'text-white'     },
        { id: 'delai',    label: 'Délai moyen',    value: this.detail.delaiMoyen,   iconBg: 'bg-[#F39C121A]',iconColor: 'text-[#F39C12]' },
        { id: 'echeance', label: 'Échéance',         value: this.detail.echeance,     iconBg: 'bg-[#E2E1ED]',  iconColor: 'text-[#747686]' }
      ];
    }
  }

  back(): void {
    this.router.navigate(['/demande-materiels']);
  }

  openDevis(fournisseurSlug: string): void {
    this.router.navigate(['/demande-materiels', this.ref, 'devis', fournisseurSlug]);
  }

  statutClass(s: DevisStatut): string {
    switch (s) {
      case 'Validé Technique':   return 'text-[#16A34A]';
      case 'En révision':        return 'text-[#475569]';
      case 'Attente Signature':  return 'text-[#791C00]';
      case 'Rejeté':             return 'text-[#DC2626]';
    }
  }

  statutIconType(s: DevisStatut): 'check' | 'clock' | 'warning' {
    if (s === 'Validé Technique') return 'check';
    if (s === 'En révision') return 'clock';
    return 'warning';
  }
}
