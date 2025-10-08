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

  return next(req).pipe(
    catchError((err: unknown) => {
      const error = err as HttpErrorResponse;
      if (error.status !== 401) {
        return throwError(() => err);
      }

      const state = auth.readAuthState();
      const refreshToken = state?.refresh_token;
      if (!refreshToken) {
        return throwError(() => err);
      }

      if (!refreshing) {
        refreshing = true;
        return auth.refresh({ refresh_token: refreshToken }).pipe(
          switchMap((tokens) => {
            auth.storeTokenPair(tokens);
            refreshed$.next(true);
            return next(req);
          }),
          catchError((refreshErr) => {
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
        filter(Boolean),
        first(),
        switchMap(() => next(req))
      );
    })
  );
};
