import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, delay } from 'rxjs';
import { StandalonePacsViewerComponent } from '../../core/utils/standalone-pacs-viewer.component';
import { DicomQrCodeComponent } from '../../core/utils/dicom-qr-code.component';

@Component({
    selector: 'app-imagerie-list',
    standalone: true,
    imports: [CommonModule, FormsModule, StandalonePacsViewerComponent, DicomQrCodeComponent],
    templateUrl: './imagerie-list.component.html',
    styleUrl: './imagerie-list.component.css'
})
export class ImagerieListComponent implements OnInit {

    // =================== DATA ===================
    allImageries: any[] = [];      // Toutes les données brutes
    filteredImageries: any[] = [];  // Données après filtres
    imageries: any[] = [];          // Données de la page actuelle

    // ================ FILTERS ===================
    searchTerm = '';
    selectedStatus: string | null = null;
    selectedUrgency: string | null = null;
    statusLabel = 'Tous les statuts';
    urgencyLabel = 'Toutes les urgences';
    showStatusMenu = false;
    showUrgencyMenu = false;

    // =============== PAGINATION =================
    page = 0;
    size = 10;
    totalElements = 0;
    totalPages = 0;

    // =============== LOADING ====================
    loading = false;
    error: string | null = null;

    // =============== MODAL DETAILS ==============
    showDetailModal = false;
    selectedImagerie: any = null;
    detailsLoading = false;
    detailsError: string | null = null;
    ongletActif: 'images' | 'compte-rendu' | 'resultat' = 'resultat';

    // =============== DICOM VIEWER ===============
    accessionNumber: string = '';
    dicomViewerUrl: string = '';   // URL directe du viewer encodée dans le QR code
    viewerRefreshTrigger: number = 0;
    dicomFullscreen: boolean = false;

    // =============== IMAGES MEDICALES ===========
    imageBaseUrl = 'https://wakana.online/repertoire_chantier/';
    imagesMedicales: {
        id: number;
        titre: string;
        name: string;
        url: string;
    }[] = [];
    selectedImage: any = null;
    showViewImageModal = false;

    // =============== DROPDOWNS ==================
    statuses = [
        { label: 'Tous les statuts', value: null },
        { label: 'En attente', value: 'PENDING' },
        { label: 'Accepté', value: 'ACCEPTED' },
        { label: 'Terminé', value: 'COMPLETED' },
        { label: 'Annulé', value: 'CANCELLED' }
    ];

    urgencies = [
        { label: 'Toutes les urgences', value: null },
        { label: 'Normal', value: 'NORMAL' },
        { label: 'Prioritaire', value: 'PRIORITAIRE' },
        { label: 'Urgent', value: 'URGENT' }
    ];

    get startItem(): number {
        return this.totalElements === 0 ? 0 : this.page * this.size + 1;
    }

    get endItem(): number {
        const end = (this.page + 1) * this.size;
        return end > this.totalElements ? this.totalElements : end;
    }

    // Local mock dataset + helpers replacing ImagerieService
    private mockImageries: any[] = [
        { id: 1, patientPhone: '770000000', status: 'PENDING', urgencyLevel: 'NORMAL', imagingCenterName: 'Centre A', type: 'Radiologie', region: 'Thorax', clinicalIndication: 'Douleur' },
        { id: 2, patientPhone: '770000000', status: 'COMPLETED', urgencyLevel: 'URGENT', imagingCenterName: 'Clinique B', type: 'Échographie', region: 'Abdomen', clinicalIndication: 'Contrôle' }
    ];

    private localGetImageriesByPatientPhone(telephone: string, page = 0, size = 10) {
        const content = this.mockImageries.filter(i => i.patientPhone === telephone);
        return of({ content, totalElements: content.length }).pipe(delay(120));
    }

    private localGetImagerieById(id: number) {
        const found: any = this.mockImageries.find(i => i.id === id) || null;
        // enrich with pictures and accessionNumber for UI
        const enriched = found ? { ...found, pictures: ['img1.jpg','img2.jpg'], accessionNumber: 'ACC-' + id } : null;
        return of(enriched).pipe(delay(120));
    }

    private localGetDicomViewer(accessionNumber: string) {
        const response: any = { series: { 'study1': ['https://viewer.example.com/' + accessionNumber] } };
        return of(response).pipe(delay(120));
    }

    constructor() { }

    ngOnInit(): void {
        this.loadImageries();
    }

    // ================== API CALLS ===============
    loadImageries(): void {
        // Récupérer le téléphone du patient depuis localStorage
        const selectedPatient = localStorage.getItem('selectedPatient');

        if (!selectedPatient) {
            this.error = 'Aucun patient sélectionné';
            return;
        }

        const patient = JSON.parse(selectedPatient);
        const telephone = patient.telephone;

        if (!telephone) {
            this.error = 'Téléphone du patient non disponible';
            return;
        }

        this.loading = true;
        this.error = null;

        // Charger toutes les imageries en une fois (pagination côté client)
        this.localGetImageriesByPatientPhone(
            telephone,
            0,
            1000
        ).subscribe({
            next: (response) => {
                this.allImageries = response.content;
                this.applyFilters();
                this.loading = false;
                console.log('✅ Imageries chargées (mock):', this.allImageries.length, 'résultats');
            },
            error: (err) => {
                console.error('❌ Erreur chargement imageries (mock):', err);
                this.error = 'Erreur lors du chargement des imageries';
                this.loading = false;
            }
        });
    }

    // ============= FILTRES & RECHERCHE ===========
    applyFilters(): void {
        this.filteredImageries = this.allImageries.filter(imagerie => {
            // Filtre recherche (centre, type, région, indication)
            const matchSearch = !this.searchTerm ||
                imagerie.imagingCenterName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                imagerie.type?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                imagerie.region?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                imagerie.clinicalIndication?.toLowerCase().includes(this.searchTerm.toLowerCase());

            // Filtre statut
            const matchStatus = !this.selectedStatus || imagerie.status === this.selectedStatus;

            // Filtre urgence
            const matchUrgency = !this.selectedUrgency || imagerie.urgencyLevel === this.selectedUrgency;

            return matchSearch && matchStatus && matchUrgency;
        });

        // Mettre à jour le total
        this.totalElements = this.filteredImageries.length;
        this.totalPages = Math.ceil(this.totalElements / this.size);

        // Réinitialiser la page si nécessaire
        if (this.page >= this.totalPages && this.totalPages > 0) {
            this.page = this.totalPages - 1;
        } else if (this.totalPages === 0) {
            this.page = 0;
        }

        // Appliquer la pagination
        this.applyPagination();
    }

    applyPagination(): void {
        const start = this.page * this.size;
        const end = start + this.size;
        this.imageries = this.filteredImageries.slice(start, end);
    }

    onSearchChange(): void {
        this.page = 0;  // Reset à la première page
        this.applyFilters();
    }

    filterByStatus(status: any): void {
        this.selectedStatus = status.value;
        this.statusLabel = status.label;
        this.showStatusMenu = false;
        this.page = 0;
        this.applyFilters();
    }

    filterByUrgency(urgency: any): void {
        this.selectedUrgency = urgency.value;
        this.urgencyLabel = urgency.label;
        this.showUrgencyMenu = false;
        this.page = 0;
        this.applyFilters();
    }

    // ============== PAGINATION ==================
    nextPage(): void {
        if (this.page < this.totalPages - 1) {
            this.page++;
            this.applyPagination();
        }
    }

    prevPage(): void {
        if (this.page > 0) {
            this.page--;
            this.applyPagination();
        }
    }

    // ============== UTILS =======================
    formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getUrgencyClass(urgency: string): string {
        switch (urgency) {
            case 'URGENT':
                return 'text-[#FF6B6B] bg-[#FF6B6B]/10';
            case 'PRIORITAIRE':
                return 'text-[#FFA500] bg-[#FFA500]/10';
            case 'NORMAL':
            default:
                return 'text-[#00B894] bg-[#00B894]/10';
        }
    }

    getUrgencyLabel(urgency: string): string {
        switch (urgency) {
            case 'NORMAL': return 'Normal';
            case 'PRIORITAIRE': return 'Prioritaire';
            case 'URGENT': return 'Urgent';
            default: return urgency;
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700';
            case 'ACCEPTED':
                return 'bg-blue-100 text-blue-700';
            case 'COMPLETED':
                return 'bg-green-100 text-green-700';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'PENDING': return 'En attente';
            case 'ACCEPTED': return 'Accepté';
            case 'COMPLETED': return 'Terminé';
            case 'CANCELLED': return 'Annulé';
            default: return status;
        }
    }

    viewDetails(imagerie: any): void {
        this.selectedImagerie = null;
        this.detailsError = null;
        this.detailsLoading = true;
        this.showDetailModal = true;
        this.ongletActif = 'resultat';
        this.accessionNumber = '';

        // Appel API pour récupérer les détails complets
        this.localGetImagerieById(imagerie.id).subscribe({
            next: (data) => {
                this.selectedImagerie = data;
                this.accessionNumber = (data as any).accessionNumber || '';

                if (this.accessionNumber) {
                    this.localGetDicomViewer(this.accessionNumber).subscribe({
                        next: (response) => {
                            const studyIds = Object.keys(response.series || {});
                            if (studyIds.length > 0) {
                                this.dicomViewerUrl = response.series[studyIds[0]]?.[0] || '';
                            } else {
                                this.dicomViewerUrl = '';
                            }
                        },
                        error: () => {
                            this.dicomViewerUrl = '';
                        }
                    });
                } else {
                    this.dicomViewerUrl = '';
                }

                this.imagesMedicales = (data?.pictures || []).map((fileName: string, i: number) => ({
                    id: i + 1,
                    titre: `Image ${i + 1}`,
                    name: fileName,
                    url: `${this.imageBaseUrl}${fileName}`
                }));

                this.detailsLoading = false;
                console.log('✅ Détails imagerie chargés (mock):', data);
                console.log('✅ Accession Number:', this.accessionNumber);
            },
            error: (err) => {
                console.error('❌ Erreur chargement détails imagerie (mock):', err);
                this.detailsError = 'Impossible de charger les détails de l\'examen.';
                this.detailsLoading = false;
            }
        });
    }

    openDicomFullscreen(): void {
        this.dicomFullscreen = true;
    }

    closeDicomFullscreen(): void {
        this.dicomFullscreen = false;
    }

    copyAccessionNumber(): void {
        if (this.accessionNumber) {
            navigator.clipboard.writeText(this.accessionNumber);
        }
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.selectedImagerie = null;
        this.detailsError = null;
        this.ongletActif = 'resultat';
        this.accessionNumber = '';
        this.dicomViewerUrl = '';
        this.imagesMedicales = [];
        this.selectedImage = null;
        this.showViewImageModal = false;
    }

    openViewImage(image: any): void {
        this.selectedImage = image;
        this.showViewImageModal = true;
    }

    closeViewImage(): void {
        this.showViewImageModal = false;
        this.selectedImage = null;
    }

    // =============== COMPTE RENDU ===============
    isCompteRenduPublie(): boolean {
        return this.selectedImagerie?.status === 'COMPLETED';
    }

    getCurrentDate(): string {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
    }

    formatAppointmentLong(date: string | null): string {
        if (!date) return 'Rendez-vous non programmé';

        // Parser le format DD-MM-YYYY
        const parts = date.split('-');
        if (parts.length !== 3) return 'Rendez-vous non programmé';

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Les mois JavaScript sont 0-indexés
        const year = parseInt(parts[2], 10);

        const d = new Date(year, month, day);

        // Vérifier si la date est valide
        if (isNaN(d.getTime())) return 'Rendez-vous non programmé';

        const dayOfWeek = d.toLocaleDateString('fr-FR', { weekday: 'long' });
        const monthName = d.toLocaleDateString('fr-FR', { month: 'long' });

        // Capitaliser la première lettre du jour
        const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
        return `${capitalizedDay} ${day} ${monthName} ${year}`;
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getInitialsColor(initials: string): string {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500'
        ];
        const charCode = initials.charCodeAt(0);
        return colors[charCode % colors.length];
    }

    formatDateLong(dateStr: string): string {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    hasRendezVous(): boolean {
        return !!(this.selectedImagerie?.appointmentDate && this.selectedImagerie?.appointmentTime);
    }
}
