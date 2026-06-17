import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { HOSPITAL_TYPES } from '../hospital-form/hospital-form.component';

interface Dept   { name: string; communes: string[]; }
interface Region { name: string; departments: Dept[]; }

const SENEGAL: Region[] = [
  { name: 'Dakar', departments: [
    { name: 'Dakar',      communes: ['Dakar Plateau','Médina','Grand Dakar','HLM','Ouakam','Yoff','Ngor'] },
    { name: 'Pikine',     communes: ['Pikine Ouest','Pikine Est','Pikine Nord'] },
    { name: 'Rufisque',   communes: ['Rufisque Est','Rufisque Ouest','Bargny','Diamniadio'] },
  ]},
  { name: 'Thiès',        departments: [{ name: 'Thiès', communes: ['Thiès Nord','Thiès Est','Thiès Ouest'] }, { name: 'Mbour', communes: ['Mbour','Joal-Fadiouth'] }] },
  { name: 'Saint-Louis',  departments: [{ name: 'Saint-Louis', communes: ['Saint-Louis','Gandon'] }, { name: 'Dagana', communes: ['Dagana','Richard Toll'] }, { name: 'Podor', communes: ['Podor','Ndioum'] }] },
  { name: 'Diourbel',     departments: [{ name: 'Diourbel', communes: ['Diourbel'] }, { name: 'Bambey', communes: ['Bambey'] }, { name: 'Mbacké', communes: ['Mbacké','Touba'] }] },
  { name: 'Louga',        departments: [{ name: 'Louga', communes: ['Louga'] }, { name: 'Kébémer', communes: ['Kébémer'] }, { name: 'Linguère', communes: ['Linguère'] }] },
  { name: 'Fatick',       departments: [{ name: 'Fatick', communes: ['Fatick'] }, { name: 'Foundiougne', communes: ['Foundiougne'] }] },
  { name: 'Kaolack',      departments: [{ name: 'Kaolack', communes: ['Kaolack'] }, { name: 'Nioro du Rip', communes: ['Nioro du Rip'] }] },
  { name: 'Kaffrine',     departments: [{ name: 'Kaffrine', communes: ['Kaffrine'] }] },
  { name: 'Ziguinchor',   departments: [{ name: 'Ziguinchor', communes: ['Ziguinchor'] }, { name: 'Bignona', communes: ['Bignona'] }] },
  { name: 'Kolda',        departments: [{ name: 'Kolda', communes: ['Kolda'] }, { name: 'Vélingara', communes: ['Vélingara'] }] },
  { name: 'Sédhiou',      departments: [{ name: 'Sédhiou', communes: ['Sédhiou'] }] },
  { name: 'Tambacounda',  departments: [{ name: 'Tambacounda', communes: ['Tambacounda'] }, { name: 'Bakel', communes: ['Bakel'] }] },
  { name: 'Kédougou',     departments: [{ name: 'Kédougou', communes: ['Kédougou'] }] },
  { name: 'Matam',        departments: [{ name: 'Matam', communes: ['Matam','Ourossogui'] }] },
];

@Component({
  selector: 'app-hospital-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalDetailComponent implements OnInit {

  loading   = true;
  loadError = '';
  saving    = false;
  deleting  = false;
  saveOk    = false;

  hospital: any = null;

  editForm = {
    name:       '',
    type:       '',
    email:      '',
    phone:      '',
    address:    '',
    region:     '',
    department: '',
    isActive:   true,
  };

  saveError = '';
  showDeleteConfirm = false;

  readonly types   = HOSPITAL_TYPES;
  readonly regions = SENEGAL;

  private id = '';
  private readonly api = environment.baseUrl;

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
    private cdr:    ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';

    const nav   = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;
    if (state?.hospitalRow) {
      this.hospital = state.hospitalRow;
      this.applyHospital();
      this.loading = false;
      this.cdr.markForCheck();
    }

    this.load();
  }

  private load(): void {
    this.http.get<any>(`${this.api}/admin/hospitals/detail/${this.id}`)
      .pipe(catchError(() => of(null)))
      .subscribe(h => {
        if (h) { this.hospital = h; this.applyHospital(); }
        this.loading = false;
        if (!this.hospital) this.loadError = 'Hôpital introuvable.';
        this.cdr.markForCheck();
      });
  }

  private applyHospital(): void {
    this.editForm = {
      name:       this.hospital.name     ?? '',
      type:       this.hospital.type     ?? '',
      email:      this.hospital.email    ?? '',
      phone:      this.hospital.phone    ?? '',
      address:    this.hospital.address  ?? '',
      region:     this.hospital.region   ?? '',
      department: '',
      isActive:   this.hospital.isActive ?? true,
    };
  }

  get departments(): Dept[] { return this.regions.find(r => r.name === this.editForm.region)?.departments ?? []; }

  onRegionChange(): void { this.editForm.department = ''; }

  initials(name: string): string {
    const w = (name ?? '').split(' ').filter(Boolean);
    return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : (name ?? '?').substring(0, 2).toUpperCase();
  }

  save(): void {
    if (!this.editForm.name.trim()) return;
    this.saving    = true;
    this.saveError = '';
    this.saveOk    = false;
    this.cdr.markForCheck();

    const payload: Record<string, any> = {
      name:     this.editForm.name.trim(),
      isActive: this.editForm.isActive,
    };
    if (this.editForm.type)    payload['type']    = this.editForm.type;
    if (this.editForm.email)   payload['email']   = this.editForm.email.trim();
    if (this.editForm.phone)   payload['phone']   = this.editForm.phone.trim();
    if (this.editForm.address) payload['address'] = this.editForm.address.trim();
    if (this.editForm.region)  payload['region']  = this.editForm.region;

    this.http.patch(`${this.api}/admin/hospitals/${this.id}`, payload)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (updated: any) => {
          this.hospital = updated;
          this.saveOk   = true;
          this.cdr.markForCheck();
          setTimeout(() => { this.saveOk = false; this.cdr.markForCheck(); }, 3000);
        },
        error: err => {
          const msg = err?.error?.message;
          this.saveError = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde.');
        },
      });
  }

  confirmDelete(): void   { this.showDeleteConfirm = true; this.cdr.markForCheck(); }
  cancelDelete():  void   { this.showDeleteConfirm = false; this.cdr.markForCheck(); }

  deleteHospital(): void {
    this.deleting = true;
    this.cdr.markForCheck();
    this.http.delete(`${this.api}/admin/hospitals/${this.id}`)
      .pipe(finalize(() => { this.deleting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  () => this.router.navigate(['/admin/hospitals']),
        error: () => { this.showDeleteConfirm = false; this.cdr.markForCheck(); },
      });
  }

  retour(): void { this.router.navigate(['/admin/hospitals']); }
}
