import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard d'authentification
 * Vérifie si l'utilisateur est connecté avant d'accéder à une route protégée
 * Ne force PAS de redirection vers un dashboard spécifique
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();

    // Si le token existe et est valide, autoriser l'accès
    if (token && authService.isTokenValid(token)) {
        return true;
    }

    // Sinon, rediriger vers la page de login
    // Conserver l'URL demandée pour rediriger après connexion
    router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
    });

    return false;
};
