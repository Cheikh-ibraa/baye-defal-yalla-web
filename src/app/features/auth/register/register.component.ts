// register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscriptionService, InscriptionData } from '../../../services/inscription.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  
  // Étape courante (1: Rôle, 2: Informations)
  currentStep: number = 1;
  
  // Rôle sélectionné (doit correspondre aux valeurs du backend)
  selectedRole: string = '';
  
  // Mapping des rôles affichés vers les valeurs attendues par le backend
  roleMapping: { [key: string]: string } = {
    'administrateur': 'ADMIN',
    'medecin': 'DOCTOR',
    'pharmacien': 'PHARMACIST',
    'patient': 'PATIENT',
    'representant': 'REPRESENTATIVE',
    'donneur': 'DONOR',
    'livreur': 'DELIVERY_PERSON'
  };

  // Liste des rôles disponibles pour l'affichage
  availableRoles = [
    { key: 'medecin', label: 'Médecin', description: 'Professionnel de santé' },
    { key: 'pharmacien', label: 'Pharmacien', description: 'Gestionnaire de pharmacie' },
    { key: 'patient', label: 'Patient', description: 'Utilisateur standard' },
    { key: 'representant', label: 'Représentant', description: 'Représentant médical' },
    { key: 'donneur', label: 'Donneur', description: 'Donneur de médicaments' },
    { key: 'livreur', label: 'Livreur', description: 'Agent de livraison' }
  ];

  // Informations utilisateur
  userInfo: InscriptionData = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    adress: '',
    lat: 0,
    lon: 0,
    profil: ''
  };

  // Confirmation du mot de passe
  confirmPassword: string = '';

  // États de l'inscription
  isRegistering = false;
  registrationSuccess = false;
  registrationError = '';
  isLoadingLocation = false;

  constructor(private inscriptionService: InscriptionService) { }

  ngOnInit(): void {
    this.getCurrentLocation();
  }

  // Sélectionner un rôle
  selectRole(roleKey: string): void {
    this.selectedRole = roleKey;
    // Convertir le rôle en valeur attendue par le backend
    this.userInfo.profil = this.roleMapping[roleKey] || roleKey.toUpperCase();
    this.clearError();
  }

  // Passer à l'étape suivante
  nextStep(): void {
    if (this.currentStep === 1 && this.canContinueStep1()) {
      this.currentStep = 2;
      this.clearError();
    }
  }

  // Revenir à l'étape précédente
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.clearError();
    }
  }

  // Vérifier si on peut continuer depuis l'étape 1
  canContinueStep1(): boolean {
    return this.selectedRole !== '' && this.userInfo.profil !== '';
  }

  // Vérifier si on peut terminer l'inscription
  canCompleteRegistration(): boolean {
    return this.userInfo.nom.trim() !== '' && 
           this.userInfo.prenom.trim() !== '' && 
           this.userInfo.email.trim() !== '' && 
           this.userInfo.password.trim() !== '' && 
           this.confirmPassword.trim() !== '' &&
           this.userInfo.password === this.confirmPassword &&
           this.userInfo.telephone.trim() !== '' && 
           this.userInfo.adress.trim() !== '' && 
           this.userInfo.profil.trim() !== '';
  }

  // Validation des mots de passe
  passwordsMatch(): boolean {
    return this.userInfo.password === this.confirmPassword;
  }

  // Validation de la force du mot de passe
  isPasswordStrong(): boolean {
    const password = this.userInfo.password;
    return password.length >= 6; // Vous pouvez ajouter plus de critères
  }

  // Terminer l'inscription
  completeRegistration(): void {
    // Vérification des champs obligatoires
    if (!this.canCompleteRegistration()) {
      this.registrationError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    // Vérification de la correspondance des mots de passe
    if (!this.passwordsMatch()) {
      this.registrationError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    // Vérification de la force du mot de passe
    if (!this.isPasswordStrong()) {
      this.registrationError = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    // Validation des données via le service
    if (!this.inscriptionService.validateUserData(this.userInfo)) {
      this.registrationError = 'Veuillez vérifier les informations saisies (email valide, téléphone correct).';
      return;
    }

    // S'assurer que le profil est en majuscules
    this.userInfo.profil = this.userInfo.profil.toUpperCase();

    // Envoyer les données
    this.isRegistering = true;
    this.registrationError = '';

    console.log('Données envoyées:', {
      ...this.userInfo,
      password: '[MASQUÉ]' // Pour la sécurité dans les logs
    });

    this.inscriptionService.createUser(this.userInfo).subscribe({
      next: (response) => {
        console.log('Inscription réussie:', response);
        this.isRegistering = false;
        this.registrationSuccess = true;
        // Ne pas réinitialiser immédiatement pour permettre à l'utilisateur de voir le succès
        setTimeout(() => {
          this.resetForm();
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur inscription:', error);
        this.isRegistering = false;
        this.registrationError = this.getErrorMessage(error);
      }
    });
  }

  // Obtenir un message d'erreur personnalisé
  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    
    if (error.status === 0) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    }
    
    if (error.status === 400) {
      return 'Données invalides. Veuillez vérifier les informations saisies.';
    }
    
    if (error.status === 409) {
      return 'Cet email est déjà utilisé. Veuillez en choisir un autre.';
    }
    
    if (error.status === 422) {
      return 'Format des données incorrect. Veuillez vérifier vos informations.';
    }
    
    return 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
  }

  // Réinitialiser les erreurs
  clearError(): void {
    this.registrationError = '';
  }

  // Réinitialiser le formulaire
  private resetForm(): void {
    this.currentStep = 1;
    this.selectedRole = '';
    this.confirmPassword = '';
    this.registrationSuccess = false;
    this.userInfo = {
      nom: '',
      prenom: '',
      email: '',
      password: '',
      telephone: '',
      adress: '',
      lat: 0,
      lon: 0,
      profil: ''
    };
  }

  // Obtenir la géolocalisation (optionnel)
  private getCurrentLocation(): void {
    if (navigator.geolocation) {
      this.isLoadingLocation = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userInfo.lat = position.coords.latitude;
          this.userInfo.lon = position.coords.longitude;
          this.isLoadingLocation = false;
          console.log('Géolocalisation obtenue:', {
            lat: this.userInfo.lat,
            lon: this.userInfo.lon
          });
        },
        (error) => {
          console.warn('Géolocalisation non disponible:', error);
          this.isLoadingLocation = false;
          // Valeurs par défaut si géolocalisation échoue
          this.userInfo.lat = 0;
          this.userInfo.lon = 0;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.warn('Géolocalisation non supportée par ce navigateur');
    }
  }

  // Méthode utilitaire pour obtenir le label d'un rôle
  getRoleLabel(roleKey: string): string {
    const role = this.availableRoles.find(r => r.key === roleKey);
    return role ? role.label : roleKey;
  }

  // Méthode pour formater le téléphone (optionnel)
  formatPhone(): void {
    // Supprimer tous les caractères non numériques
    this.userInfo.telephone = this.userInfo.telephone.replace(/\D/g, '');
    
    // Limiter à 9 caractères pour les numéros sénégalais
    if (this.userInfo.telephone.length > 9) {
      this.userInfo.telephone = this.userInfo.telephone.substring(0, 9);
    }
  }

  // Validation en temps réel de l'email
  isValidEmail(): boolean {
    if (!this.userInfo.email) return true; // Ne pas valider si vide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.userInfo.email);
  }

  // Validation en temps réel du téléphone
  isValidPhone(): boolean {
    if (!this.userInfo.telephone) return true; // Ne pas valider si vide
    return this.userInfo.telephone.length >= 9;
  }
}