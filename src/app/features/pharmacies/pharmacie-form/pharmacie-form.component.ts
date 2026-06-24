import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

declare var google: any;

// ── Données administratives Sénégal ──────────────────────────────────────────
interface Dept   { name: string; communes: string[]; }
interface Region { name: string; departments: Dept[]; }

const SENEGAL: Region[] = [
  { name: 'Dakar', departments: [
    { name: 'Dakar',       communes: ['Dakar Plateau','Médina','Grand Dakar','Hann Bel-Air','HLM','Biscuiterie','Dieuppeul Derkle','Sicap Liberté','Fann Point E Amitié','Mermoz Sacré-Cœur','Ouakam','Yoff','Ngor'] },
    { name: 'Pikine',      communes: ['Pikine Ouest','Pikine Est','Pikine Nord','Dalifort','Djida Thiaroye Kao','Guinaw Rails Nord','Guinaw Rails Sud','Thiaroye sur Mer','Tivaouane Peulh'] },
    { name: 'Guédiawaye',  communes: ['Wakhinane Nimzatt','Médina Gounass','Ndiareme Limamoulaye','Sam Notaire','Golf Sud'] },
    { name: 'Rufisque',    communes: ['Rufisque Est','Rufisque Ouest','Rufisque Nord','Bargny','Diamniadio','Sébikhotane','Sangalkam','Yène'] },
    { name: 'Keur Massar', communes: ['Keur Massar Nord','Keur Massar Sud','Jaxaay Parcelles','Tivaouane Peulh'] },
  ]},
  { name: 'Thiès', departments: [
    { name: 'Thiès',     communes: ['Thiès Nord','Thiès Est','Thiès Ouest','Fandène','Pout','Khombole','Notto Gouye Diama','Pambal'] },
    { name: 'Mbour',     communes: ['Mbour','Joal-Fadiouth','Malicounda','Nguékhokh','Sandiara','Sindia','Somone','Thiadiaye'] },
    { name: 'Tivaouane', communes: ['Tivaouane','Mékhé','Pire Goureye','Méouane','Niakhène'] },
  ]},
  { name: 'Saint-Louis', departments: [
    { name: 'Saint-Louis', communes: ['Saint-Louis','Gandon','Mpal','Rao'] },
    { name: 'Dagana',      communes: ['Dagana','Richard Toll','Ronkh','Ndiaye'] },
    { name: 'Podor',       communes: ['Podor','Gamadji Saré','Ndioum','Salde','Médina Ndiathbé'] },
  ]},
  { name: 'Diourbel', departments: [
    { name: 'Diourbel', communes: ['Diourbel','Gawane','Ndame','Toubacouta'] },
    { name: 'Bambey',   communes: ['Bambey','Baba Garage','Lambaye','Ngogom','Ngoye'] },
    { name: 'Mbacké',   communes: ['Mbacké','Touba','Dara','Kael'] },
  ]},
  { name: 'Louga', departments: [
    { name: 'Louga',    communes: ['Louga','Coki','Nguidilé','Thiamène'] },
    { name: 'Kébémer',  communes: ['Kébémer','Darou Mousty','Diokoul Mbelbouk','Sagatta Djolof'] },
    { name: 'Linguère', communes: ['Linguère','Barkedji','Dodji','Ouarkhokh'] },
  ]},
  { name: 'Fatick', departments: [
    { name: 'Fatick',      communes: ['Fatick','Dangane','Diakhao','Ndiob','Niakhar','Tattaguine'] },
    { name: 'Foundiougne', communes: ['Foundiougne','Djilor','Sokone','Toubacouta'] },
    { name: 'Gossas',      communes: ['Gossas','Colobane','Mbar','Ouadiour'] },
  ]},
  { name: 'Kaolack', departments: [
    { name: 'Kaolack',      communes: ['Kaolack','Kahone','Ndoffane'] },
    { name: 'Guinguinéo',   communes: ['Guinguinéo','Dya','Ndiaffate','Ndiago'] },
    { name: 'Nioro du Rip', communes: ['Nioro du Rip','Darou Salam','Keur Madiabel','Paoskoto','Wack Ngouna'] },
  ]},
  { name: 'Kaffrine', departments: [
    { name: 'Kaffrine',      communes: ['Kaffrine','Gniby','Kathiote','Nganda'] },
    { name: 'Birkelane',     communes: ['Birkelane','Mabo','Ndiognick','Touba Mbella'] },
    { name: 'Koungheul',     communes: ['Koungheul','Ida Mouride','Lour Escale','Saly Escale'] },
    { name: 'Malème Hoddar', communes: ['Malème Hoddar','Khelcom Birame','Niang Olom','Prokhane'] },
  ]},
  { name: 'Ziguinchor', departments: [
    { name: 'Ziguinchor', communes: ['Ziguinchor','Adéane','Niaguis','Niassa','Oulampane'] },
    { name: 'Bignona',    communes: ['Bignona','Diouloulou','Kafountine','Tendouck','Sindian'] },
    { name: 'Oussouye',   communes: ['Oussouye','Cachouane','Kabrousse','Mlomp'] },
  ]},
  { name: 'Kolda', departments: [
    { name: 'Kolda',              communes: ['Kolda','Dabo','Dioulacolon','Mampatim','Médina El Hadj'] },
    { name: 'Médina Yoro Foulah', communes: ['Médina Yoro Foulah','Badion','Fafacourou','Bagadadji'] },
    { name: 'Vélingara',          communes: ['Vélingara','Bonconto','Kandia','Kounkané','Pakour'] },
  ]},
  { name: 'Sédhiou', departments: [
    { name: 'Sédhiou',   communes: ['Sédhiou','Bambali','Djibidione','Karantaba','Kolibantang'] },
    { name: 'Bounkiling', communes: ['Bounkiling','Boghal','Diacounda','Niaming'] },
    { name: 'Goudomp',   communes: ['Goudomp','Brefet','Diattacounda','Simbandi Balante'] },
  ]},
  { name: 'Tambacounda', departments: [
    { name: 'Tambacounda', communes: ['Tambacounda','Dialacoto','Missira','Niani'] },
    { name: 'Bakel',       communes: ['Bakel','Bélé','Diawara','Moudéry'] },
    { name: 'Goudiry',     communes: ['Goudiry','Bala','Dimboli','Gouthiafé','Koussanar'] },
    { name: 'Koumpentoum', communes: ['Koumpentoum','Kouthiaba Wolof','Maka Coulibantang','Payar'] },
  ]},
  { name: 'Kédougou', departments: [
    { name: 'Kédougou', communes: ['Kédougou','Bandafassi','Fongolimbi','Sénéganté'] },
    { name: 'Salémata', communes: ['Salémata','Dakatéli','Ethiolo','Kévoye'] },
    { name: 'Saraya',   communes: ['Saraya','Bembou','Khossanto','Moussala'] },
  ]},
  { name: 'Matam', departments: [
    { name: 'Matam',   communes: ['Matam','Agnam Civol','Bokidiawé','Ourossogui','Thilogne','Ogo'] },
    { name: 'Kanel',   communes: ['Kanel','Orkadières','Semmé','Hamady Hounaré','Dabia'] },
    { name: 'Ranérou', communes: ['Ranérou','Oudalaye','Vélingara Ferlo'] },
  ]},
];

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-pharmacie-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacie-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PharmacieFormComponent {

  private readonly api = environment.baseUrl;
  readonly regions = SENEGAL;

  form = {
    name:        '',
    responsable: '',
    phone:       '',
    email:       '',
    region:      '',
    department:  '',
    commune:     '',
    address:     '',
    latitude:    null as number | null,
    longitude:   null as number | null,
    isActive:    true,
  };

  saving    = false;
  saveError = '';

  // ── Map modal ──────────────────────────────────────────────────────────────
  showMapModal   = false;
  mapGeocoding   = false;
  mapPickedLat:  number | null = null;
  mapPickedLng:  number | null = null;

  private mapInstance:    any = null;
  private mapMarker:      any = null;
  private autocomplete:   any = null;

  @ViewChild('mapContainer')  mapContainerRef?:  ElementRef<HTMLDivElement>;
  @ViewChild('mapSearchInput') mapSearchRef?:    ElementRef<HTMLInputElement>;

  constructor(
    private http:   HttpClient,
    private router: Router,
    private cdr:    ChangeDetectorRef,
  ) {}

  // ── Cascades ────────────────────────────────────────────────────────────────
  get departments(): Dept[]   { return this.regions.find(r => r.name === this.form.region)?.departments ?? []; }
  get communes():    string[] { return this.departments.find(d => d.name === this.form.department)?.communes ?? []; }

  onRegionChange(): void { this.form.department = ''; this.form.commune = ''; }
  onDeptChange():   void { this.form.commune = ''; }

  // ── Map ────────────────────────────────────────────────────────────────────

  localiseSurLaCarte(): void {
    this.showMapModal = true;
    this.mapPickedLat = this.form.latitude;
    this.mapPickedLng = this.form.longitude;
    this.cdr.detectChanges();   // force le rendu du DOM avant initMap
    this.initMap();
  }

  private initMap(): void {
    const el = this.mapContainerRef?.nativeElement;
    if (!el || typeof google === 'undefined') return;

    const defaultCenter = { lat: this.form.latitude ?? 14.6937, lng: this.form.longitude ?? -17.4441 };

    this.mapInstance = new google.maps.Map(el, {
      center:             defaultCenter,
      zoom:               14,
      mapTypeControl:     false,
      streetViewControl:  false,
      fullscreenControl:  false,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
    });

    // ── Places Autocomplete sur l'input de recherche ──────────────────────
    const searchEl = this.mapSearchRef?.nativeElement;
    if (searchEl) {
      this.autocomplete = new google.maps.places.Autocomplete(searchEl, {
        componentRestrictions: { country: 'sn' },
        fields: ['geometry', 'formatted_address', 'name'],
      });
      // Empêcher le formulaire de se soumettre avec Entrée
      searchEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault();
      });
      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        if (!place?.geometry?.location) return;
        const loc = place.geometry.location;
        this.mapInstance.setCenter(loc);
        this.mapInstance.setZoom(17);
        this.placeMarker({ lat: loc.lat(), lng: loc.lng() });
      });
    }

    // ── Marqueur existant ─────────────────────────────────────────────────
    if (this.form.latitude && this.form.longitude) {
      this.placeMarker({ lat: this.form.latitude, lng: this.form.longitude });
    }

    // ── Centrage sur la commune sélectionnée ──────────────────────────────
    if (this.form.commune || this.form.region) {
      const address = [this.form.commune, this.form.department, this.form.region, 'Sénégal']
        .filter(Boolean).join(', ');
      this.mapGeocoding = true;
      this.cdr.markForCheck();
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any, status: any) => {
        this.mapGeocoding = false;
        this.cdr.markForCheck();
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          this.mapInstance.setCenter(loc);
          this.mapInstance.setZoom(14);
          if (!this.form.latitude && !this.form.longitude) {
            this.placeMarker({ lat: loc.lat(), lng: loc.lng() });
          }
        }
      });
    }

    // ── Clic sur la carte ─────────────────────────────────────────────────
    this.mapInstance.addListener('click', (e: any) => {
      this.placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
  }

  private placeMarker(pos: { lat: number; lng: number }): void {
    this.mapPickedLat = parseFloat(pos.lat.toFixed(6));
    this.mapPickedLng = parseFloat(pos.lng.toFixed(6));
    this.cdr.markForCheck();

    if (this.mapMarker) {
      this.mapMarker.setPosition(pos);
      return;
    }

    this.mapMarker = new google.maps.Marker({
      position:  pos,
      map:       this.mapInstance,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor:    '#104382',
        fillOpacity:  1,
        strokeColor:  '#ffffff',
        strokeWeight: 2,
      },
    });

    this.mapMarker.addListener('dragend', () => {
      const p = this.mapMarker.getPosition();
      this.mapPickedLat = parseFloat(p.lat().toFixed(6));
      this.mapPickedLng = parseFloat(p.lng().toFixed(6));
      this.cdr.markForCheck();
    });
  }

  confirmerLocalisation(): void {
    if (this.mapPickedLat !== null && this.mapPickedLng !== null) {
      this.form.latitude  = this.mapPickedLat;
      this.form.longitude = this.mapPickedLng;
    }
    this.fermerMap();
  }

  fermerMap(): void {
    this.showMapModal = false;
    this.mapMarker    = null;
    this.mapInstance  = null;
    this.mapPickedLat = null;
    this.mapPickedLng = null;
    this.cdr.markForCheck();
  }

  // ── Actions formulaire ─────────────────────────────────────────────────────
  annuler():   void { this.router.navigate(['/admin/pharmacies']); }

  enregistrer(): void {
    if (!this.form.name) return;
    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    const adresse = this.form.address
      || [this.form.commune, this.form.department, this.form.region].filter(Boolean).join(', ');

    // Envoi en JSON pour que latitude/longitude soient des numbers (FormData les convertit en strings,
    // ce qui fait échouer @IsNumber() dans le DTO NestJS)
    const payload: Record<string, any> = {
      name:      this.form.name,
      address:   adresse,
      latitude:  this.form.latitude  ?? 14.6937,
      longitude: this.form.longitude ?? -17.4441,
      isOpen:    this.form.isActive,
    };
    if (this.form.phone)    payload['phone']    = this.form.phone;
    if (this.form.email)    payload['email']    = this.form.email;
    if (this.form.region)   payload['region']   = this.form.region;

    this.http.post(`${this.api}/pharmacy/pharmacies`, payload)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  () => this.router.navigate(['/admin/pharmacies']),
        error: err => {
          const msg = err?.error?.message;
          this.saveError = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la création.');
        },
      });
  }
}
