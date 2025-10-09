import { PLATFORM_ID, inject } from '@angular/core';
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
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

let refreshing = false;
const refreshed$ = new Subject<boolean>();

export const authRefreshInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
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
        // Utiliser le refresh via cookie HttpOnly si le backend l'autorise
        return auth.refreshWithCookie().pipe(
          switchMap((tokens) => {
            auth.storeTokenPair(tokens);
            refreshed$.next(true);
            // Rejouer la requête avec le nouveau token
            const tokenType = (tokens.token_type || 'bearer').trim();
            const header = `${tokenType.charAt(0).toUpperCase()}${tokenType.slice(1)} ${
              tokens.access_token
            }`;
            const retried = req.clone({ setHeaders: { Authorization: header } });
            return next(retried);
          }),
          catchError((refreshErr) => {
            refreshed$.next(false);
            auth.clearAuth();
            // Redirection vers /login si le refresh échoue et que l'on est côté navigateur
            if (isBrowser) {
              try {
                router.navigateByUrl('/login');
              } catch {}
            }
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
            // Utiliser le token fraîchement stocké
            const state = auth.readAuthState();
            const access = state?.access_token;
            if (access) {
              const tokenType = (state?.token_type || 'bearer').trim();
              const header = `${tokenType.charAt(0).toUpperCase()}${tokenType.slice(1)} ${access}`;
              const retried = req.clone({ setHeaders: { Authorization: header } });
              return next(retried);
            }
            return next(req);
          }
          // Refresh a échoué: propager l'erreur et (si possible) on est déjà redirigé plus haut
          return throwError(() => error);
        })
      );
    })
  );
};
