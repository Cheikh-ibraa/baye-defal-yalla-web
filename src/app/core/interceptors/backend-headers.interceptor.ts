import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Intercepteur pour ajouter les headers requis par le backend
 * (x-user-id, x-user-roles, etc.)
 */
export const backendHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const user = authService.user$.value;
  
  if (!user) return next(req);

  // Extraire les informations du token JWT
  const token = localStorage.getItem('access_token');
  if (!token) return next(req);

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub; // Keycloak ID
    const roles = payload.realm_access?.roles ?? [];
    
    // Mapper les rôles Keycloak vers les rôles backend
    const roleMapping: Record<string, string> = {
      'admin': 'admin',
      'doctor': 'doctor',
      'pharmacist': 'pharmacist', 
      'hospital': 'hospital',
      'lab-technician': 'lab',
      'radiologist': 'imaging',
      'supplier': 'supplier',
      'donor-individual': 'donor',
      'donor-organization': 'organization',
      'patient': 'patient',
    };
    
    const mappedRoles = roles
      .filter((role: string) => roleMapping[role])
      .map((role: string) => roleMapping[role]);

    // Ajouter les headers requis par le backend
    const modifiedReq = req.clone({
      setHeaders: {
        'x-user-id': userId,
        'x-user-roles': JSON.stringify(mappedRoles),
        'x-user-name': `${user.prenom} ${user.nom}`.trim(),
      }
    });

    return next(modifiedReq);
  } catch (error) {
    console.warn('Erreur lors du parsing du token JWT:', error);
    return next(req);
  }
};