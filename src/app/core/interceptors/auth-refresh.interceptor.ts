import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import {
  Observable,
  Subject,
  catchError,
  filter,
  finalize,
  first,
  switchMap,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshing = false;
const refreshed$ = new Subject<boolean>();

export const authRefreshInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);

  // Ne pas intercepter la route de refresh elle-même pour éviter les boucles
  const urlPath = (() => {
    try {
      const ABS = /^(?:[a-z]+:)?\/\//i.test(req.url);
      const path = ABS ? new URL(req.url).pathname : req.url;
      return path.startsWith('/') ? path : `/${path}`;
    } catch {
      return req.url;
    }
  })();
  const isRefreshCall = urlPath.startsWith('/auth/refresh');

  return next(req).pipe(
    catchError((err: unknown) => {
      const error = err as HttpErrorResponse;
      const unauthorized403 =
        error.status === 403 &&
        (() => {
          try {
            const det = (error?.error?.detail || error?.error?.error || '')
              .toString()
              .toLowerCase();
            return (
              det.includes('not authenticated') ||
              det.includes('invalid token') ||
              det.includes('expired')
            );
          } catch {
            return false;
          }
        })();
      const shouldTryRefresh = !isRefreshCall && (error.status === 401 || unauthorized403);
      if (!shouldTryRefresh) {
        return throwError(() => err);
      }

      if (!refreshing) {
        refreshing = true;
        // start refresh
        // Choisir la meilleure stratégie: si un refresh_token est disponible, utiliser le BODY refresh.
        const refresh$ = auth.refreshWithCookie();
        return refresh$.pipe(
          switchMap((tokens) => {
            // Pas d'Authorization nécessaire en mode cookies; on indique succès et rejoue la requête telle quelle
            refreshed$.next(true);
            const retried = req.clone({ withCredentials: true });
            return next(retried);
          }),
          catchError((refreshErr) => {
            // refresh failed; clear auth
            refreshed$.next(false);
            auth.clearAuth();
            return throwError(() => refreshErr);
          }),
          finalize(() => {
            refreshing = false;
          })
        );
      }

      // une autre requête attend la fin du refresh
      return refreshed$.pipe(
        first(),
        switchMap((ok) => {
          if (ok) {
            const retried = req.clone({ withCredentials: true });
            return next(retried);
          }
          // Refresh a échoué: propager l'erreur et (si possible) on est déjà redirigé plus haut
          return throwError(() => error);
        })
      );
    })
  );
};
