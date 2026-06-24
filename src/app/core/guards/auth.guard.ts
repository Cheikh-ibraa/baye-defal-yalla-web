import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp: number | undefined = payload?.exp;
    if (exp && Date.now() / 1000 > exp) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem('access_token');
    router.navigate(['/login']);
    return false;
  }
};
