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

  // Ne pas ajouter d'Authorization pour les endpoints publics (infos/color/health/auth/*)
  const isPublicEndpoint = (() => {
    try {
      const ABS = ABSOLUTE_URL.test(req.url);
      const path = ABS ? new URL(req.url).pathname : req.url;
      const p = path.startsWith('/') ? path.slice(1) : path;
      // Cas 1: appel direct vers /infos, /color, /health, /auth/*
      if (
        p.startsWith('infos') ||
        p.startsWith('color') ||
        p.startsWith('health') ||
        p.startsWith('auth/') ||
        p.startsWith('overlay/')
      )
        return true;
      // Cas 2: appel via proxy local /developer/api/:userId/(infos|color)
      if (p.startsWith('developer/api/')) {
        const seg = p.split('/').slice(3)[0]; // après developer/api/:userId
        return seg === 'infos' || seg === 'color';
      }
      return false;
    } catch {
      return false;
    }
  })();

  // Préfixer l'URL si nécessaire. On évite seulement pour les proxys locaux (developer/api/*).
  if (baseUrl && !ABSOLUTE_URL.test(req.url)) {
    const path = req.url.startsWith('/') ? req.url.slice(1) : req.url;
    const avoidPrefix = path.startsWith('developer/api/');
    if (!avoidPrefix) {
      const normalizedBase = baseUrl.replace(/\/$/, '');
      const normalizedPath = path;
      modified = modified.clone({ url: `${normalizedBase}/${normalizedPath}` });
    }
  }

  // Ajouter Authorization si un token est stocké (sessionStorage prioritaire, sinon localStorage)
  if (!isPublicEndpoint) {
    try {
      const sraw = window?.sessionStorage?.getItem?.(AUTH_TOKEN_STORAGE_KEY);
      const lraw = window?.localStorage?.getItem?.(AUTH_TOKEN_STORAGE_KEY);
      const raw = sraw || lraw;
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
  }

  return next(modified);
};
