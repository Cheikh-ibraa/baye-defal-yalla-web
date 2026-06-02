import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Récupérer le token depuis localStorage
  const token = localStorage.getItem('access_token');
  
  // Si un token existe, cloner la requête et ajouter le header Authorization
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }
  
  // Sinon, passer la requête telle quelle
  return next(req);
};
