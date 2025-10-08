import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import { AUTH_TOKEN_STORAGE_KEY } from '../constants/storage-keys';

const ABSOLUTE_URL = /^(?:[a-z]+:)?\/\//i; // http://, https://, //, mailto:, etc.

export const apiPrefixInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const baseUrl = inject(API_BASE_URL, { optional: true });

  let modified = req;

  // Préfixer l'URL si nécessaire
  if (baseUrl && !ABSOLUTE_URL.test(req.url)) {
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const normalizedPath = req.url.replace(/^\//, '');
    modified = modified.clone({ url: `${normalizedBase}/${normalizedPath}` });
  }

  // Ajouter Authorization si un token est stocké
  try {
    const raw = window?.localStorage?.getItem?.(AUTH_TOKEN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { access_token?: string; token_type?: string } | null;
      const access = parsed?.access_token;
      if (access) {
        const tokenType = (parsed?.token_type || 'bearer').trim();
        modified = modified.clone({
          setHeaders: {
            Authorization: `${tokenType.charAt(0).toUpperCase()}${tokenType.slice(1)} ${access}`,
          },
        });
      }
    }
  } catch {
    // ignore côté SSR ou si localStorage indisponible
  }

  return next(modified);
};
