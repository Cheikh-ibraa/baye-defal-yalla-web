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

interface DetailDemandeOrganisation {
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
  selector: 'app-detail-demande-organisation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-demande-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDemandeOrganisationComponent implements OnInit {
  id: string | null = null;
  detail: DetailDemandeOrganisation | undefined;
  kpis: KpiDetail[] = [];

  private readonly data: DetailDemandeOrganisation[] = [
    {
      ref: '1',
      titre: 'Equipements de bloc — Demande Organisation',
      description:
        'Série d’équipements pour établissements : monitoring, anesthésie et consommables critiques.',
      devisRecus: 3,
      meilleurPrix: '4 000 000 FCFA',
      delaiMoyen: '5 jours',
      echeance: '12/05/26',
      fournisseurs: [
        {
          nom: 'Eurohealth Distrib',
          slug: 'eurohealth-distrib',
          note: 4.7,
          avis: 94,
          prixTotal: '4 000 000 FCFA',
          delaiLivraison: '5 jours',
          dateReception: '14 Oct 2025',
          statut: 'En révision'
        },
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
      ref: '2',
      titre: 'Imagerie IRM — Demande Organisation',
      description:
        'Approvisionnement d’équipements et accessoires pour la mise en service d’une salle d’imagerie.',
      devisRecus: 5,
      meilleurPrix: '5 000 000 FCFA',
      delaiMoyen: '7 jours',
      echeance: '30/07/26',
      fournisseurs: [
        {
          nom: 'BioCore Advance',
          slug: 'biocore-advance',
          note: 4.2,
          avis: 42,
          prixTotal: '6 000 000 FCFA',
          delaiLivraison: '24h',
          dateReception: '10 Nov 2025',
          statut: 'Validé Technique'
        },
        {
          nom: 'MedTech Solutions',
          slug: 'medtech-solutions',
          note: 4.9,
          avis: 128,
          prixTotal: '5 500 000 FCFA',
          delaiLivraison: '48h',
          dateReception: '17 Nov 2025',
          statut: 'En révision'
        }
      ]
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // param route: /demande-organisation/:id
    this.id = this.route.snapshot.paramMap.get('id');
    this.detail = this.data.find(d => d.ref === this.id);

    if (!this.detail) {
      this.detail = {
        ref: this.id || 'N/A',
        titre: 'Demande Générique — Organisation',
        description: 'Détails de la demande générés automatiquement. Cette demande concerne l\'approvisionnement d\'équipements.',
        devisRecus: 2,
        meilleurPrix: '2 500 000 FCFA',
        delaiMoyen: '5 jours',
        echeance: '31/12/2026',
        fournisseurs: [
          {
            nom: 'Fournisseur Médical Alpha',
            slug: 'fournisseur-medical-alpha',
            note: 4.5,
            avis: 50,
            prixTotal: '2 500 000 FCFA',
            delaiLivraison: '5 jours',
            dateReception: '20 Nov 2025',
            statut: 'En révision'
          },
          {
            nom: 'Santé Plus Logistique',
            slug: 'sante-plus-logistique',
            note: 4.8,
            avis: 110,
            prixTotal: '2 800 000 FCFA',
            delaiLivraison: '3 jours',
            dateReception: '22 Nov 2025',
            statut: 'Validé Technique'
          }
        ]
      };
    }

    if (this.detail) {
      this.kpis = [
        {
          id: 'devis',
          label: 'Devis reçus',
          value: this.detail.devisRecus,
          iconBg: 'bg-[#DCE1FF]',
          iconColor: 'text-[#00339E]'
        },
        {
          id: 'prix',
          label: 'Meilleur prix',
          value: this.detail.meilleurPrix,
          iconBg: 'bg-[#00B894]',
          iconColor: 'text-white'
        },
        {
          id: 'delai',
          label: 'Délai moyen',
          value: this.detail.delaiMoyen,
          iconBg: 'bg-[#F39C121A]',
          iconColor: 'text-[#F39C12]'
        },
        {
          id: 'echeance',
          label: 'Échéance',
          value: this.detail.echeance,
          iconBg: 'bg-[#E2E1ED]',
          iconColor: 'text-[#747686]'
        }
      ];
    }
  }

  back(): void {
    this.router.navigate(['/demande-organisation']);
  }

  openDevis(fournisseurSlug: string): void {
    // Rediriger vers le détail du devis de la demande d'organisation
    if (!this.id) return;
    this.router.navigate(['/demande-organisation', this.id, 'devis']);
  }

  statutClass(s: DevisStatut): string {
    switch (s) {
      case 'Validé Technique':
        return 'text-[#16A34A]';
      case 'En révision':
        return 'text-[#475569]';
      case 'Attente Signature':
        return 'text-[#791C00]';
      case 'Rejeté':
        return 'text-[#DC2626]';
    }
  }

  statutIconType(s: DevisStatut): 'check' | 'clock' | 'warning' {
    if (s === 'Validé Technique') return 'check';
    if (s === 'En révision') return 'clock';
    return 'warning';
  }
}

