import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
    { name: 'Sédhiou',    communes: ['Sédhiou','Bambali','Djibidione','Karantaba','Kolibantang'] },
    { name: 'Bounkiling', communes: ['Bounkiling','Boghal','Diacounda','Niaming'] },
    { name: 'Goudomp',    communes: ['Goudomp','Brefet','Diattacounda','Simbandi Balante'] },
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

export const HOSPITAL_TYPES = ['CHU', 'CHR', 'Hôpital de district', 'Clinique privée', 'Polyclinique', 'Centre de santé'];

@Component({
  selector: 'app-hospital-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalFormComponent {

  private readonly api = environment.baseUrl;
  readonly regions     = SENEGAL;
  readonly types       = HOSPITAL_TYPES;

  form = {
    name:       '',
    type:       '',
    email:      '',
    phone:      '',
    region:     '',
    department: '',
    commune:    '',
    address:    '',
    isActive:   true,
  };

  saving    = false;
  saveError = '';

  constructor(
    private http:   HttpClient,
    private router: Router,
    private cdr:    ChangeDetectorRef,
  ) {}

  get departments(): Dept[]   { return this.regions.find(r => r.name === this.form.region)?.departments ?? []; }
  get communes():    string[] { return this.departments.find(d => d.name === this.form.department)?.communes ?? []; }

  onRegionChange(): void { this.form.department = ''; this.form.commune = ''; }
  onDeptChange():   void { this.form.commune = ''; }

  annuler(): void { this.router.navigate(['/admin/hospitals']); }

  enregistrer(): void {
    if (!this.form.name.trim()) return;
    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    const adresse = this.form.address.trim()
      || [this.form.commune, this.form.department, this.form.region].filter(Boolean).join(', ');

    const payload: Record<string, any> = {
      name:     this.form.name.trim(),
      isActive: this.form.isActive,
    };
    if (this.form.type)       payload['type']    = this.form.type;
    if (this.form.email)      payload['email']   = this.form.email.trim();
    if (this.form.phone)      payload['phone']   = this.form.phone.trim();
    if (adresse)              payload['address'] = adresse;
    if (this.form.region)     payload['region']  = this.form.region;

    this.http.post(`${this.api}/admin/hospitals`, payload)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  () => this.router.navigate(['/admin/hospitals']),
        error: err => {
          const msg = err?.error?.message;
          this.saveError = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la création.');
        },
      });
  }
}
