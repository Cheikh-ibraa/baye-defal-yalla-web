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

interface Dept   { name: string; communes: string[]; }
interface Region { name: string; departments: Dept[]; }

const SENEGAL: Region[] = [
  { name: 'Dakar', departments: [
    { name: 'Dakar',       communes: ['Dakar Plateau','Médina','Grand Dakar','Hann Bel-Air','HLM','Biscuiterie','Dieuppeul Derkle','Sicap Liberté','Fann Point E Amitié','Mermoz Sacré-Cœur','Ouakam','Yoff','Ngor'] },
    { name: 'Pikine',      communes: ['Pikine Ouest','Pikine Est','Pikine Nord','Dalifort','Djida Thiaroye Kao','Guinaw Rails Nord','Guinaw Rails Sud','Thiaroye sur Mer','Tivaouane Peulh'] },
    { name: 'Guédiawaye',  communes: ['Wakhinane Nimzatt','Médina Gounass','Ndiareme Limamoulaye','Sam Notaire','Golf Sud'] },
    { name: 'Rufisque',    communes: ['Rufisque Est','Rufisque Ouest','Rufisque Nord','Bargny','Diamniadio','Sébikhotane','Sangalkam','Yène'] },
  ]},
  { name: 'Thiès', departments: [
    { name: 'Thiès', communes: ['Thiès Nord','Thiès Est','Thiès Ouest','Fandène','Pout','Khombole'] },
    { name: 'Mbour', communes: ['Mbour','Joal-Fadiouth','Malicounda','Nguékhokh','Sandiara','Sindia','Somone'] },
  ]},
  { name: 'Saint-Louis', departments: [
    { name: 'Saint-Louis', communes: ['Saint-Louis','Gandon','Mpal','Rao'] },
    { name: 'Dagana',      communes: ['Dagana','Richard Toll','Ronkh','Ndiaye'] },
  ]},
  { name: 'Diourbel', departments: [
    { name: 'Diourbel', communes: ['Diourbel','Gawane','Ndame'] },
    { name: 'Mbacké',   communes: ['Mbacké','Touba','Dara','Kael'] },
  ]},
  { name: 'Louga', departments: [
    { name: 'Louga',   communes: ['Louga','Coki','Nguidilé','Thiamène'] },
    { name: 'Kébémer', communes: ['Kébémer','Darou Mousty','Diokoul Mbelbouk','Sagatta Djolof'] },
  ]},
  { name: 'Kaolack', departments: [
    { name: 'Kaolack', communes: ['Kaolack','Kahone','Ndoffane'] },
  ]},
  { name: 'Ziguinchor', departments: [
    { name: 'Ziguinchor', communes: ['Ziguinchor','Adéane','Niaguis','Niassa','Oulampane'] },
  ]},
  { name: 'Tambacounda', departments: [
    { name: 'Tambacounda', communes: ['Tambacounda','Dialacoto','Missira','Niani'] },
  ]},
  { name: 'Matam', departments: [
    { name: 'Matam', communes: ['Matam','Agnam Civol','Bokidiawé','Ourossogui','Thilogne'] },
  ]},
  { name: 'Kolda', departments: [
    { name: 'Kolda', communes: ['Kolda','Dabo','Dioulacolon','Mampatim'] },
  ]},
];

@Component({
  selector: 'app-imagerie-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagerie-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagerieFormComponent {

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

  showMapModal   = false;
  mapGeocoding   = false;
  mapPickedLat:  number | null = null;
  mapPickedLng:  number | null = null;

  private mapInstance:  any = null;
  private mapMarker:    any = null;
  private autocomplete: any = null;

  @ViewChild('mapContainer')   mapContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('mapSearchInput') mapSearchRef?:   ElementRef<HTMLInputElement>;

  constructor(
    private http:   HttpClient,
    private router: Router,
    private cdr:    ChangeDetectorRef,
  ) {}

  get departments(): Dept[]   { return this.regions.find(r => r.name === this.form.region)?.departments ?? []; }
  get communes():    string[] { return this.departments.find(d => d.name === this.form.department)?.communes ?? []; }

  onRegionChange(): void { this.form.department = ''; this.form.commune = ''; }
  onDeptChange():   void { this.form.commune = ''; }

  localiseSurLaCarte(): void {
    this.showMapModal = true;
    this.mapPickedLat = this.form.latitude;
    this.mapPickedLng = this.form.longitude;
    this.cdr.detectChanges();
    this.initMap();
  }

  private initMap(): void {
    const el = this.mapContainerRef?.nativeElement;
    if (!el || typeof google === 'undefined') return;

    const defaultCenter = { lat: this.form.latitude ?? 14.6937, lng: this.form.longitude ?? -17.4441 };
    this.mapInstance = new google.maps.Map(el, {
      center: defaultCenter, zoom: 14,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });

    const searchEl = this.mapSearchRef?.nativeElement;
    if (searchEl) {
      this.autocomplete = new google.maps.places.Autocomplete(searchEl, {
        componentRestrictions: { country: 'sn' },
        fields: ['geometry', 'formatted_address', 'name'],
      });
      searchEl.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault(); });
      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        if (!place?.geometry?.location) return;
        const loc = place.geometry.location;
        this.mapInstance.setCenter(loc);
        this.mapInstance.setZoom(17);
        this.placeMarker({ lat: loc.lat(), lng: loc.lng() });
      });
    }

    if (this.form.latitude && this.form.longitude) {
      this.placeMarker({ lat: this.form.latitude, lng: this.form.longitude });
    }

    if (this.form.commune || this.form.region) {
      const address = [this.form.commune, this.form.department, this.form.region, 'Sénégal'].filter(Boolean).join(', ');
      this.mapGeocoding = true;
      this.cdr.markForCheck();
      new google.maps.Geocoder().geocode({ address }, (results: any, status: any) => {
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

    this.mapInstance.addListener('click', (e: any) => {
      this.placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
  }

  private placeMarker(pos: { lat: number; lng: number }): void {
    this.mapPickedLat = parseFloat(pos.lat.toFixed(6));
    this.mapPickedLng = parseFloat(pos.lng.toFixed(6));
    this.cdr.markForCheck();

    if (this.mapMarker) { this.mapMarker.setPosition(pos); return; }

    this.mapMarker = new google.maps.Marker({
      position: pos, map: this.mapInstance, draggable: true, animation: google.maps.Animation.DROP,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#6D28D9', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
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

  annuler(): void { this.router.navigate(['/admin/imageries']); }

  enregistrer(): void {
    if (!this.form.name) return;
    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    const adresse = this.form.address
      || [this.form.commune, this.form.department, this.form.region].filter(Boolean).join(', ');

    const payload: Record<string, any> = {
      name:      this.form.name,
      address:   adresse,
      latitude:  this.form.latitude  ?? 14.6937,
      longitude: this.form.longitude ?? -17.4441,
      isOpen:    this.form.isActive,
    };
    if (this.form.phone)  payload['phone']  = this.form.phone;
    if (this.form.email)  payload['email']  = this.form.email;
    if (this.form.region) payload['region'] = this.form.region;

    this.http.post(`${this.api}/admin/imaging-centers`, payload)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  () => this.router.navigate(['/admin/imageries']),
        error: err => {
          const msg = err?.error?.message;
          this.saveError = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la création.');
        },
      });
  }
}
