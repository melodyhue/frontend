import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
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
import { SessionRefreshService } from '../services/session-refresh.service';
import { RealtimeService } from '../services/realtime.service';

let refreshing = false;
const refreshed$ = new Subject<boolean>();
// Empêche les boucles: si un refresh a définitivement échoué (ex: 401 répété),
// on ne tente plus de refresh jusqu'à rechargement ou nouvelle connexion.
let refreshDisabled = false;
// Evite les ré-entrées et nouvelles tentatives après un logout forcé/bannissement
let forcedLogout = false;

export const authRefreshInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const sessionRefresh = inject(SessionRefreshService);
  const realtime = inject(RealtimeService);

  // Ne pas intercepter les routes d'auth publiques pour éviter les boucles de redirection
  const urlPath = (() => {
    try {
      const ABS = /^(?:[a-z]+:)?\/\//i.test(req.url);
      const path = ABS ? new URL(req.url).pathname : req.url;
      return path.startsWith('/') ? path : `/${path}`;
    } catch {
      return req.url;
    }
  })();
  const isPublicAuthCall =
    urlPath.startsWith('/auth/refresh') ||
    urlPath.startsWith('/auth/reset') ||
    urlPath.startsWith('/auth/forgot') ||
    urlPath.startsWith('/auth/login') ||
    urlPath.startsWith('/auth/register');

  return next(req).pipe(
    // 0) Surveille aussi les réponses réussies de /users/me pour couper immédiatement si is_banned
    //    (fallback si le backend répond encore 200 pendant une courte période après le ban)
    //    On ne touche pas aux autres endpoints.
    (source$) =>
      new Observable<HttpEvent<unknown>>((subscriber) => {
        const sub = source$.subscribe({
          next: (event) => {
            if (
              !forcedLogout &&
              event instanceof HttpResponse &&
              // Sécurise la détection sur le chemin de la requête initiale
              urlPath.startsWith('/users/me')
            ) {
              try {
                const body: any = event.body as any;
                if (body && body.is_banned === true) {
                  try {
                    sessionRefresh.stop();
                  } catch {}
                  try {
                    realtime.stop();
                  } catch {}
                  auth.clearAuth();
                  forcedLogout = true;
                  try {
                    const path = (typeof location !== 'undefined' ? location.pathname : '/') || '/';
                    const isPrivate =
                      path.startsWith('/profile') ||
                      path.startsWith('/overlays') ||
                      path.startsWith('/settings') ||
                      path.startsWith('/admin') ||
                      path.startsWith('/modo') ||
                      path.startsWith('/auth/2fa');
                    if (isPrivate) {
                      setTimeout(
                        () => router.navigate(['/login'], { queryParams: { reason: 'banned' } }),
                        0
                      );
                    }
                  } catch {}
                }
              } catch {}
            }
            subscriber.next(event);
          },
          error: (e) => subscriber.error(e),
          complete: () => subscriber.complete(),
        });
        return () => sub.unsubscribe();
      }),
    catchError((err: unknown) => {
      const error = err as HttpErrorResponse;
      // Si on est déjà en état de logout forcé ou refresh désactivé, ne tentez rien de plus
      if (forcedLogout) {
        return throwError(() => error);
      }
      // 1) Gestion bannissement: si le backend signale explicitement un ban, on déconnecte immédiatement
      const isBanned = (() => {
        try {
          const statusBan = error.status === 403 || error.status === 423 || error.status === 401;
          const hdrBan =
            (error.headers?.get?.('X-Account-Banned') || '').toString().toLowerCase() === 'true';
          let bodyStr = '';
          const ee: any = (error as any)?.error;
          if (typeof ee === 'string') bodyStr = ee;
          else if (ee) bodyStr = JSON.stringify(ee);
          const msg = bodyStr.toLowerCase();
          const msgBan =
            msg.includes('banned') ||
            msg.includes('ban ') ||
            msg.includes(' ban') ||
            msg.includes('banishment') ||
            msg.includes('banni') ||
            msg.includes('suspend') ||
            msg.includes('account_disabled') ||
            msg.includes('account disabled') ||
            msg.includes('revoked');
          return statusBan && (hdrBan || msgBan);
        } catch {
          return false;
        }
      })();

      if (isBanned) {
        try {
          // Stopper timers/WS et nettoyer l'état d'auth
          try {
            sessionRefresh.stop();
          } catch {}
          try {
            realtime.stop();
          } catch {}
          auth.clearAuth();
          forcedLogout = true;
          // Rediriger vers la page de login uniquement si l'utilisateur est sur une page privée
          try {
            const path = (typeof location !== 'undefined' ? location.pathname : '/') || '/';
            const isPrivate =
              path.startsWith('/profile') ||
              path.startsWith('/overlays') ||
              path.startsWith('/settings') ||
              path.startsWith('/admin') ||
              path.startsWith('/modo') ||
              path.startsWith('/auth/2fa');
            if (isPrivate) {
              setTimeout(
                () => router.navigate(['/login'], { queryParams: { reason: 'banned' } }),
                0
              );
            }
          } catch {}
        } catch {}
        return throwError(() => error);
      }
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
      const shouldTryRefresh =
        !isPublicAuthCall && !refreshDisabled && (error.status === 401 || unauthorized403);
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
            refreshDisabled = true;
            try {
              sessionRefresh.stop();
            } catch {}
            try {
              realtime.stop();
            } catch {}
            auth.clearAuth();
            // Redirige vers /login sur échec de refresh uniquement si on est sur une page privée.
            try {
              const path = (typeof location !== 'undefined' ? location.pathname : '/') || '/';
              const isPrivate =
                path.startsWith('/profile') ||
                path.startsWith('/overlays') ||
                path.startsWith('/settings') ||
                path.startsWith('/admin') ||
                path.startsWith('/modo') ||
                path.startsWith('/auth/2fa');
              if (isPrivate) {
                setTimeout(
                  () => router.navigate(['/login'], { queryParams: { reason: 'expired' } }),
                  0
                );
              }
            } catch {}
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
