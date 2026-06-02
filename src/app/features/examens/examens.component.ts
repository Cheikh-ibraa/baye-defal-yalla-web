import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LaboratoireService } from '../../services/laboratoire/laboratoire.service';

@Component({
    selector: 'app-examens',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './examens.component.html',
    styleUrl: './examens.component.css'
})
export class ExamensComponent implements OnInit {

    // =================== DATA ===================
    allAnalyses: any[] = [];      // Toutes les données brutes
    filteredAnalyses: any[] = [];  // Données après filtres
    analyses: any[] = [];          // Données de la page actuelle

    // ================ FILTERS ===================
    searchTerm = '';
    selectedStatus: string | null = null;
    selectedPriority: string | null = null;
    statusLabel = 'Tous les statuts';
    priorityLabel = 'Toutes les priorités';
    showStatusMenu = false;
    showPriorityMenu = false;

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
    selectedAnalyse: any = null;
    detailsLoading = false;
    detailsError: string | null = null;
    ongletActif: 'images' | 'compte-rendu' = 'images';

    // =============== IMAGES MEDICALES ===========
    imageBaseUrl = 'https://wakana.online/repertoire_chantier/';
    imagesMedicales: { id: number; titre: string; name: string; url: string; }[] = [];
    selectedFiles: File[] = [];
    previewUrls: string[] = [];
    showImportImageModal = false;
    showImportImageSuccess = false;
    selectedImage: any = null;
    showViewImageModal = false;
    showDeleteImageModal = false;
    showDeleteImageSuccess = false;

    // =============== COMPTE RENDU ===============
    compteRenduForm = { description: '' };
    compteRenduFile: File | null = null;
    compteRenduFilePreview: string | null = null;
    showValidateCompteRenduModal = false;
    showValidateCompteRenduSuccess = false;

    // =============== DROPDOWNS ==================
    statuses = [
        { label: 'Tous les statuts', value: null },
        { label: 'En attente', value: 'PENDING' },
        { label: 'Accepté', value: 'ACCEPTED' },
        { label: 'Terminé', value: 'COMPLETED' },
        { label: 'Annulé', value: 'CANCELLED' }
    ];

    priorities = [
        { label: 'Toutes les priorités', value: null },
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

    constructor(private laboratoireService: LaboratoireService) { }

    ngOnInit(): void {
        this.loadAnalyses();
    }

    // ================== API CALLS ===============
    loadAnalyses(): void {
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

        // Charger toutes les analyses en une fois (pagination côté client)
        this.laboratoireService.getAnalysesByPatientPhone(
            telephone,
            0,
            1000  // Charger toutes les données
        ).subscribe({
            next: (response) => {
                this.allAnalyses = response.content;
                this.applyFilters();  // Appliquer les filtres côté client
                this.loading = false;
                console.log('✅ Analyses chargées:', this.allAnalyses.length, 'résultats');
            },
            error: (err) => {
                console.error('❌ Erreur chargement analyses:', err);
                this.error = 'Erreur lors du chargement des analyses';
                this.loading = false;
            }
        });
    }

    // ============= FILTRES & RECHERCHE ===========
    applyFilters(): void {
        this.filteredAnalyses = this.allAnalyses.filter(analyse => {
            // Filtre recherche (laboratoire, type, indication)
            const matchSearch = !this.searchTerm ||
                analyse.laboratoryName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                analyse.type?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                analyse.clinicalIndication?.toLowerCase().includes(this.searchTerm.toLowerCase());

            // Filtre statut
            const matchStatus = !this.selectedStatus || analyse.status === this.selectedStatus;

            // Filtre priorité
            const matchPriority = !this.selectedPriority || analyse.urgencyLevel === this.selectedPriority;

            return matchSearch && matchStatus && matchPriority;
        });

        this.page = 0;  // Retour à la page 1
        this.applyPagination();
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    filterByStatus(status: any): void {
        this.selectedStatus = status.value;
        this.statusLabel = status.label;
        this.showStatusMenu = false;
        this.applyFilters();
    }

    filterByPriority(priority: any): void {
        this.selectedPriority = priority.value;
        this.priorityLabel = priority.label;
        this.showPriorityMenu = false;
        this.applyFilters();
    }

    // ================ PAGINATION ================
    applyPagination(): void {
        this.totalElements = this.filteredAnalyses.length;
        this.totalPages = Math.ceil(this.totalElements / this.size);

        const start = this.page * this.size;
        const end = start + this.size;
        this.analyses = this.filteredAnalyses.slice(start, end);
    }

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

    // ================ HELPERS ===================
    getInitials(name: string): string {
        if (!name) return '?';
        const names = name.trim().split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
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
            case 'PENDING':
                return 'En attente';
            case 'ACCEPTED':
                return 'Accepté';
            case 'COMPLETED':
                return 'Terminé';
            case 'CANCELLED':
                return 'Annulé';
            default:
                return status;
        }
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

    formatDate(date: string): string {
        if (!date) return 'Non disponible';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatAppointment(date: string | null, time: string | null): string {
        if (!date) return 'Non programmé';
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return time ? `${formattedDate} à ${time}` : formattedDate;
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

    downloadReport(reportFile: string): void {
        if (!reportFile) return;
        // Implémenter le téléchargement
        window.open(reportFile, '_blank');
    }

    viewPictures(pictures: string[]): void {
        if (!pictures || pictures.length === 0) return;
        // Implémenter la visualisation des pièces jointes
        console.log('Voir pièces jointes:', pictures);
    }

    viewDetails(analyse: any): void {
        console.log('📋 Ouverture des détails:', analyse);
        this.showDetailModal = true;
        this.detailsLoading = true;
        this.detailsError = null;
        this.ongletActif = 'images';

        // Appel API pour récupérer les détails complets
        this.laboratoireService.getLaboratoireById(analyse.id).subscribe({
            next: (details) => {
                this.selectedAnalyse = details;

                // Charger les images médicales
                this.imagesMedicales = (details.pictures || []).map((fileName: string, i: number) => ({
                    id: i + 1,
                    titre: `Image ${i + 1}`,
                    name: fileName,
                    url: `${this.imageBaseUrl}${fileName}`
                }));

                this.detailsLoading = false;
                console.log('✅ Détails chargés:', details);
            },
            error: (err) => {
                console.error('❌ Erreur chargement détails:', err);
                this.detailsError = 'Impossible de charger les détails de l\'examen.';
                this.detailsLoading = false;
            }
        });
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.selectedAnalyse = null;
        this.detailsError = null;
        this.ongletActif = 'images';
    }

    getUrgencyLabel(urgency: string): string {
        switch (urgency) {
            case 'URGENT':
                return 'Urgent';
            case 'PRIORITAIRE':
                return 'Prioritaire';
            case 'NORMAL':
            default:
                return 'Normal';
        }
    }

    // ============== GESTION DES IMAGES ==========
    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        Array.from(input.files).forEach(file => {
            // Validation de la taille (10 MB max par fichier)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                alert(`Le fichier ${file.name} est trop volumineux (max 10 MB)`);
                return;
            }

            this.selectedFiles.push(file);

            const reader = new FileReader();
            reader.onload = () => {
                this.previewUrls.push(reader.result as string);
            };
            reader.readAsDataURL(file);
        });

        // Reset input pour pouvoir re-sélectionner les mêmes fichiers
        input.value = '';
    }

    removeSelectedFile(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.previewUrls.splice(index, 1);
    }

    openImportImage(): void {
        this.showImportImageModal = true;
    }

    closeImportImage(): void {
        this.showImportImageModal = false;
        this.selectedFiles = [];
        this.previewUrls.forEach(url => URL.revokeObjectURL(url));
        this.previewUrls = [];
    }

    confirmerImportImage(): void {
        if (!this.selectedAnalyse || this.selectedFiles.length === 0) {
            alert('Veuillez sélectionner au moins une image');
            return;
        }

        const formData = new FormData();
        this.selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        this.laboratoireService.uploadMultiplePictures(this.selectedAnalyse.id, formData)
            .subscribe({
                next: () => {
                    this.showImportImageModal = false;
                    this.showImportImageSuccess = true;
                    this.selectedFiles = [];
                    this.previewUrls = [];

                    setTimeout(() => {
                        this.showImportImageSuccess = false;
                    }, 2000);

                    // Recharger les détails pour afficher les nouvelles images
                    this.viewDetails(this.selectedAnalyse);
                },
                error: (err) => {
                    console.error('❌ Erreur upload images:', err);
                    alert('Erreur lors de l\'importation des images');
                }
            });
    }

    closeImportImageSuccess(): void {
        this.showImportImageSuccess = false;
    }

    openViewImage(img: any): void {
        this.selectedImage = img;
        this.showViewImageModal = true;
    }

    closeViewImage(): void {
        this.showViewImageModal = false;
        this.selectedImage = null;
    }

    openModifierImage(): void {
        // TODO: Implémenter la fonctionnalité de modification d'image
        alert('Fonctionnalité de modification à venir');
    }

    openDeleteImageFromView(): void {
        this.showDeleteImageModal = true;
    }

    confirmerDeleteImage(): void {
        if (!this.selectedImage || !this.selectedAnalyse) {
            alert('Aucune image sélectionnée');
            return;
        }

        this.laboratoireService
            .deleteAnalysisPicture(this.selectedAnalyse.id, this.selectedImage.name)
            .subscribe({
                next: () => {
                    this.showDeleteImageModal = false;
                    this.showViewImageModal = false;
                    this.showDeleteImageSuccess = true;

                    setTimeout(() => {
                        this.showDeleteImageSuccess = false;
                    }, 2000);

                    // Recharger les détails pour mettre à jour la liste des images
                    this.viewDetails(this.selectedAnalyse);
                    this.selectedImage = null;
                },
                error: (err) => {
                    console.error('❌ Erreur suppression image:', err);
                    alert('Erreur lors de la suppression de l\'image');
                }
            });
    }

    closeDeleteImage(): void {
        this.showDeleteImageModal = false;
    }

    closeDeleteImageSuccess(): void {
        this.showDeleteImageSuccess = false;
    }

    // ================== COMPTE RENDU ==================

    get examenStatus(): string {
        return this.selectedAnalyse?.status as string;
    }

    isCompteRenduPublie(): boolean {
        return this.examenStatus === 'COMPLETED';
    }

    canEditCompteRendu(): boolean {
        return this.examenStatus === 'PENDING' || this.examenStatus === 'ACCEPTED';
    }

    getCurrentDate(): string {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
    }

    onCompteRenduFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        this.compteRenduFile = input.files[0];

        // Validation de la taille (10 MB max)
        const maxSize = 10 * 1024 * 1024;
        if (this.compteRenduFile.size > maxSize) {
            alert('Le fichier est trop volumineux (max 10 MB)');
            this.compteRenduFile = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.compteRenduFilePreview = reader.result as string;
        };
        reader.readAsDataURL(this.compteRenduFile);

        console.log('📄 Fichier sélectionné:', this.compteRenduFile.name);
    }

    removeCompteRenduFile(): void {
        this.compteRenduFile = null;
        this.compteRenduFilePreview = null;
    }

    genererAvecIA(): void {
        this.compteRenduForm.description = 'Compte rendu généré automatiquement par l\'IA.';
    }

    openValiderCompteRendu(): void {
        if (!this.compteRenduForm.description) {
            alert('Veuillez saisir le compte rendu');
            return;
        }
        this.showValidateCompteRenduModal = true;
    }

    closeValidateCompteRendu(): void {
        this.showValidateCompteRenduModal = false;
    }

    closeCompteRenduSuccess(): void {
        this.showValidateCompteRenduSuccess = false;
    }

    confirmerPublierCompteRendu(): void {
        if (!this.selectedAnalyse) {
            alert('Examen non chargé');
            return;
        }

        if (!this.compteRenduForm.description) {
            alert('Veuillez saisir le compte rendu');
            return;
        }

        console.log('📤 Envoi du compte rendu...');

        this.laboratoireService.submitAnalysisReport({
            requestId: this.selectedAnalyse.id,
            report: this.compteRenduForm.description,
            reportFile: this.compteRenduFile || undefined
        }).subscribe({
            next: (response) => {
                console.log('✅ Compte rendu publié:', response);

                if (this.selectedAnalyse) {
                    this.selectedAnalyse.status = 'COMPLETED';
                }

                this.showValidateCompteRenduModal = false;
                this.showValidateCompteRenduSuccess = true;

                setTimeout(() => {
                    this.showValidateCompteRenduSuccess = false;
                }, 2000);

                // Recharger les analyses pour mettre à jour le statut dans la liste
                this.loadAnalyses();
            },
            error: (err) => {
                console.error('❌ Erreur publication compte rendu:', err);
                alert('Erreur lors de la publication du compte rendu');
            }
        });
    }
}
