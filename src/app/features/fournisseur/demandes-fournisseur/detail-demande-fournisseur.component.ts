import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

declare const L: any;

// ─── Domain Interfaces ────────────────────────────────────────────────────────

interface ProduitDemande {
  nom: string;
  ref: string;
  quantite: number;
  unite: string;
}

interface InfoClient {
  nomClient: string;
  certification: string;
  tauxPaiement: string;
  demandesCompletees: string;
}

interface LieuLivraison {
  adresse: string;
  ville: string;
  codePostal: string;
  lat: number;
  lng: number;
}

export interface DetailDemandeFournisseur {
  id: string;
  hopital: string;
  categorie: string;
  departement: string;
  dateDemandeLabel: string;
  niveauUrgence: 'Normal' | 'Urgent' | 'Critique';
  budgetEstime: string;
  budgetEstimeReel: string;
  budgetNote: string;
  produits: ProduitDemande[];
  description: string;
  exigencesTechniques: string;
  client: InfoClient;
  lieu: LieuLivraison;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-detail-demande-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-demande-fournisseur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDemandeFournisseurComponent implements OnInit, AfterViewInit, OnDestroy {

  private _detail: DetailDemandeFournisseur | null = null;
  private map: any = null;
  private isViewInitialized = false;

  isEmettreDevisMode = false;
  devisDestinataire = '';
  devisDateEmission = '';
  devisProduits: any[] = [];
  devisDelaiLivraison = '2 à 4 semaines';
  devisGarantie = '24 mois (Standard)';
  devisNotes = '';

  get subtotalHT(): number {
    return this.devisProduits.reduce((acc, p) => acc + ((p.quantite || 0) * (p.prixUnitaire || 0)), 0);
  }

  get devisTTC(): number {
    return 100000;
  }

  get totalTTC(): number {
    return this.subtotalHT + this.devisTTC;
  }

  toggleEmettreDevisMode(mode: boolean): void {
    this.isEmettreDevisMode = mode;
    if (mode) {
      this.devisDestinataire = 'Centre Hospitalier Universitaire (CHU)';
      this.devisDateEmission = '05/20/2024';
      
      this.devisProduits = [
        { nom: 'Échographe Doppler Couleur Premium', ref: 'Modèle: HD-900 Series', quantite: 1, prixUnitaire: 2100000 },
        { nom: 'Sonde Linéaire Haute Fréquence', ref: 'Accessoire compatible HD-900', quantite: 2, prixUnitaire: 400000 },
        { nom: 'Contrat de Maintenance Annuel', ref: 'Maintenance Préventive Gold', quantite: 1, prixUnitaire: 1000000 }
      ];
      this.devisNotes = '';
    }
  }

  addDevisProduit(): void {
    this.devisProduits.push({ nom: '', ref: '', quantite: 1, prixUnitaire: 0 });
  }

  removeDevisProduit(index: number): void {
    this.devisProduits.splice(index, 1);
  }

  saveBrouillon(): void {
    Swal.fire({
      title: 'Brouillon enregistré !',
      text: 'Le devis a été sauvegardé en tant que brouillon.',
      icon: 'success',
      confirmButtonColor: '#104382'
    });
  }

  sendDevis(): void {
    Swal.fire({
      title: 'Devis envoyé !',
      text: 'Le devis a été transmis avec succès à la clinique.',
      icon: 'success',
      confirmButtonColor: '#10B981'
    }).then(() => {
      this.isEmettreDevisMode = false;
    });
  }

  get detail(): DetailDemandeFournisseur | null {
    return this._detail;
  }

  set detail(value: DetailDemandeFournisseur | null) {
    this._detail = value;
    if (value && this.isViewInitialized) {
      setTimeout(() => this.initMap(), 50);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.detail = this.fetchDetail(id);
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.detail) {
      this.initMap();
    }
  }

  private initMap(): void {
    if (this.map) return;

    const lat = this.detail?.lieu.lat ?? 45.7435;
    const lng = this.detail?.lieu.lng ?? 4.8821;

    // Initialize map
    this.map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([lat, lng], 15);

    // CartoDB Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(this.map);

    // Leaflet marker icon configurations
    const markerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker([lat, lng], { icon: markerIcon }).addTo(this.map);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  /** 
   * Mock data factory — swap this body for HttpClient.get<DetailDemandeFournisseur>(...)
   * to consume the real API.
   */
  private fetchDetail(id: string | null): DetailDemandeFournisseur {
    const isClinic   = id === '2' || id === '4';
    const isCHU      = id === '3' || id === '6';

    const hopital    = isClinic ? 'Clinique du Parc'    : isCHU ? 'CHU Saint-Luc'         : 'BDY Hôpital Central';
    const categorie  = isClinic ? 'Imagerie IRM'        : isCHU ? 'Équipement Labo'        : 'Équipement de bureau';
    const departement= isClinic ? 'Radiologie'          : isCHU ? 'Biologie Médicale'      : 'Cardiologie';
    const budget     = isClinic ? '8 500 000 FCFA'      : isCHU ? '3 200 000 FCFA'         : '5 000 000 FCFA';
    const budgetReel = isClinic ? '9 200 000 FCFA'      : isCHU ? '3 800 000 FCFA'         : '6 000 000 FCFA';
    const urgence: 'Normal' | 'Urgent' | 'Critique' = isCHU ? 'Urgent' : 'Normal';

    const produitsMap: Record<string, ProduitDemande[]> = {
      default: [
        { nom: 'Moniteur Signaux Vitaux Elite V5', ref: 'MS-V5-2024', quantite: 5,  unite: 'unités' },
        { nom: 'Stéthoscope 3M Littmann Classic III', ref: 'ST-LIT-C3', quantite: 25, unite: 'unités' },
        { nom: 'Pack Consommables ECG',            ref: 'PK-ECG-100', quantite: 12, unite: 'unités' }
      ],
      clinic: [
        { nom: 'IRM 3 Tesla Siemens Magnetom',     ref: 'IRM-3T-2024', quantite: 1,  unite: 'unité' },
        { nom: "Console de traitement d\u2019images",   ref: 'CON-IMG-04',  quantite: 2,  unite: 'unités' },
        { nom: 'Antennes de surface multicanal',   ref: 'ANT-MC-12',   quantite: 5,  unite: 'unités' },
        { nom: 'Station de radiologie numérique',  ref: 'SRN-2024',    quantite: 3,  unite: 'unités' },
        { nom: 'Logiciel DICOM avancé',            ref: 'LG-DCM-V6',   quantite: 3,  unite: 'licences' }
      ],
      chu: [
        { nom: 'Analyseur hématologique',          ref: 'AH-BC6-2024', quantite: 1,  unite: 'unité' },
        { nom: 'Centrifugeuse de laboratoire',     ref: 'CL-3500',     quantite: 1,  unite: 'unité' }
      ]
    };

    const produits = isClinic ? produitsMap['clinic'] : isCHU ? produitsMap['chu'] : produitsMap['default'];

    return {
      id:               id ?? '1',
      hopital,
      categorie,
      departement,
      dateDemandeLabel: '14 Octobre 2024',
      niveauUrgence:    urgence,
      budgetEstime:     budget,
      budgetEstimeReel: budgetReel,
      budgetNote:       'Basé sur les tarifs moyens du marché',
      produits,
      description: `Dans le cadre de la modernisation du bloc opératoire de ${departement.toLowerCase()} de l'${hopital}, cette demande vise à renouveler le parc de monitoring de haute précision. Les équipements sélectionnés offrent une intégration complète avec le SIH actuel. Les appareils et consommables sont destinés à l'équipement des nouvelles unités de soins intensifs post-opératoires.`,
      exigencesTechniques: `Exigences techniques : Les équipements doivent être livrés avec les licences logicielles d'interopérabilité HL7 et une garantie maintenance site de 3 ans incluse. Installation prévu pour le début du Q1 2025.`,
      client: {
        nomClient:          `Hôpital de Lyon`,
        certification:      'Client certifié MedLink Platinum',
        tauxPaiement:       '98% de paiements à temps',
        demandesCompletees: '15 demandes complétées en 2023'
      },
      lieu: {
        adresse:    '5 Place d\'Arsonval',
        ville:      'Lyon',
        codePostal: '69003',
        lat:        45.7435,
        lng:        4.8821
      }
    };
  }

  urgenceBadgeClass(urgence: string): string {
    switch (urgence) {
      case 'Urgent':   return 'bg-[#FCE8E6] text-[#C5221F]';
      case 'Critique': return 'bg-[#FCE8E6] text-[#C5221F]';
      default:         return 'bg-[#F1F3F5] text-[#4E5166]';
    }
  }

  back(): void {
    if (this.isEmettreDevisMode) {
      this.isEmettreDevisMode = false;
    } else {
      this.router.navigate(['/demandes-fournisseur']);
    }
  }
}
