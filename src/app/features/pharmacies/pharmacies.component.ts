import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-pharmacies-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacies.component.html',
  styleUrls: ['./pharmacies.component.css']
})
export class PharmaciesComponent implements OnInit, AfterViewInit {
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;

  Math = Math;

  searchTerm = '';
  itemsPerPage = 10;
  currentPage = 1;

  allPharmacies: any[] = [];
  filteredPharmacies: any[] = [];
  paginatedPharmacies: any[] = [];
  totalPages = 1;
  loading = false;
  loadError = '';

  showModal = false;
  saving = false;
  saveError = '';
  pharmacyForm = {
    name: '', address: '', phone: '', email: '',
    latitude: null as number | null, longitude: null as number | null,
    openingHours: '', isOpen: true,
  };
  logoFile: File | null = null;
  logoPreview: string | null = null;

  performanceChart: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadPharmacies();
  }

  ngAfterViewInit() {
    this.createPerformanceChart();
  }

  loadPharmacies(): void {
    this.loading = true;
    this.loadError = '';
    this.http.get<any[]>(`${environment.baseUrl}/pharmacy/pharmacies`).subscribe({
      next: (data) => {
        this.allPharmacies = data || [];
        this.loading = false;
        this.filterPharmacies();
      },
      error: () => {
        this.loadError = 'Impossible de charger les pharmacies.';
        this.loading = false;
        this.allPharmacies = [];
        this.filterPharmacies();
      },
    });
  }

  openModal(): void {
    this.pharmacyForm = {
      name: '', address: '', phone: '', email: '',
      latitude: null, longitude: null,
      openingHours: '', isOpen: true,
    };
    this.logoFile = null;
    this.logoPreview = null;
    this.saveError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onLogoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.logoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
  }

  createPharmacy(): void {
    if (!this.pharmacyForm.name || !this.pharmacyForm.address) return;
    this.saving = true;
    this.saveError = '';
    const fd = new FormData();
    fd.append('name', this.pharmacyForm.name);
    fd.append('address', this.pharmacyForm.address);
    if (this.pharmacyForm.phone)        fd.append('phone', this.pharmacyForm.phone);
    if (this.pharmacyForm.email)        fd.append('email', this.pharmacyForm.email);
    fd.append('latitude',  String(this.pharmacyForm.latitude  ?? 0));
    fd.append('longitude', String(this.pharmacyForm.longitude ?? 0));
    if (this.pharmacyForm.openingHours) fd.append('openingHours', this.pharmacyForm.openingHours);
    fd.append('isOpen', String(this.pharmacyForm.isOpen));
    if (this.logoFile) fd.append('logo', this.logoFile);

    this.http.post(`${environment.baseUrl}/pharmacy/pharmacies`, fd).subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadPharmacies();
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message;
        this.saveError = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la création.');
      },
    });
  }

  get totalActive(): number { return this.allPharmacies.filter(p => p.isOpen || p.isActive).length; }
  get totalInactive(): number { return this.allPharmacies.filter(p => !p.isOpen && !p.isActive).length; }
  get totalWithPharmacist(): number { return this.allPharmacies.filter(p => p.pharmacistId).length; }

  createPerformanceChart() {
    if (!this.performanceChartRef?.nativeElement) return;
    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
          datasets: [{
            label: 'Pharmacies enregistrées',
            data: [1, 2, 2, 3, 4, this.allPharmacies.length || 1],
            backgroundColor: '#2C7BE5',
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }
  }

  filterPharmacies(): void {
    this.filteredPharmacies = this.allPharmacies.filter(p => {
      const q = this.searchTerm.toLowerCase();
      return (p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q) || p.region?.toLowerCase().includes(q));
    });
    this.totalPages = Math.ceil(this.filteredPharmacies.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPharmacies = this.filteredPharmacies.slice(start, start + this.itemsPerPage);
  }

  onSearchChange(): void { this.filterPharmacies(); }
  onItemsPerPageChange(): void { this.filterPharmacies(); }
  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); } }

  getInitialsColor(index: number): string {
    const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700'];
    return colors[index % colors.length];
  }

  getPharmacieInitials(name: string): string {
    const w = (name || '').split(' ');
    return w.length >= 2 ? w[0][0] + w[1][0] : (name || '?').substring(0, 2);
  }
}
