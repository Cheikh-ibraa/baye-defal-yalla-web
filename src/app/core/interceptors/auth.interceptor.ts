import {
  HttpInterceptorFn, HttpRequest, HttpErrorResponse,
  HttpClient, HttpBackend
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router  = inject(Router);
  // Use HttpBackend to bypass interceptors (avoids circular dep + infinite loop)
  const backend = inject(HttpBackend);
  const rawHttp = new HttpClient(backend);

  const token = localStorage.getItem('access_token');
  const authedReq = token ? withBearer(req, token) : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        router.navigate(['/login']);
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshDone$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => next(withBearer(req, newToken!)))
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return rawHttp.post<{ accessToken: string; refreshToken: string }>(
        `${environment.baseUrl}/auth/refresh`,
        { refreshToken: refresh }
      ).pipe(
        switchMap(res => {
          localStorage.setItem('access_token', res.accessToken);
          localStorage.setItem('refresh_token', res.refreshToken);
          isRefreshing = false;
          refreshDone$.next(res.accessToken);
          return next(withBearer(req, res.accessToken));
        }),
        catchError(refreshErr => {
          isRefreshing = false;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
