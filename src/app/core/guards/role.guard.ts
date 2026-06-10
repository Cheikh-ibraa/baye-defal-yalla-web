import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

function getRolesFromToken(): string[] {
  const token = localStorage.getItem('access_token');
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (_route, _state) => {
    const router = inject(Router);
    const roles = getRolesFromToken();

    if (roles.length === 0) {
      router.navigate(['/login']);
      return false;
    }

    const hasRole = allowedRoles.some(r => roles.includes(r));
    if (!hasRole) {
      // Redirige vers le dashboard correspondant au rôle réel
      const priority = [
        'admin', 'doctor', 'pharmacist', 'hospital',
        'lab-technician', 'radiologist', 'supplier',
        'donor-individual', 'donor-organization', 'patient'
      ];
      const ROLE_ROUTES: Record<string, string> = {
        'admin':              '/dashboard-admin',
        'doctor':             '/dashboard-med',
        'pharmacist':         '/dashboard',
        'hospital':           '/dashboard-hospital',
        'lab-technician':     '/dashboard-lab',
        'radiologist':        '/dashboard-imagerie',
        'supplier':           '/dashboard-fournisseur',
        'donor-individual':   '/dons',
        'donor-organization': '/dons',
        'patient':            '/login',
      };
      const userRole = priority.find(r => roles.includes(r)) ?? 'patient';
      router.navigate([ROLE_ROUTES[userRole] ?? '/dashboard']);
      return false;
    }

    return true;
  };
};
