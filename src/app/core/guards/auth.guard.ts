import { Router, UrlTree } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

function denyToLogin(router: Router): UrlTree {
  return router.createUrlTree(['/login']);
}

export const authRequiredCanMatch = async () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  const auth = inject(AuthService);
  try {
    // En SSR (pas de localStorage), on laisse passer: le check se fera côté navigateur
    if (!isBrowser) return true;
    // Cookie-only flow: tenter directement /users/me (l'intercepteur se charge de refresh automatique)
    await firstValueFrom(auth.me());
    return true;
  } catch {
    return isBrowser ? denyToLogin(router) : true;
  }
};

function redirectToProfile(router: Router): UrlTree {
  // Construire une UrlTree absolue robuste (gère multi-segments éventuels)
  const parts = 'profile'.split('/').filter(Boolean);
  return router.createUrlTree(['/', ...parts]);
}

// Unauth only: si déjà connecté, redirige vers /profile
export const unauthOnlyCanMatch = () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  const auth = inject(AuthService);
  try {
    if (!isBrowser) return true; // laisser SSR passer, redirection côté client
    const state = auth.readAuthState();
    const hasToken = !!state?.access_token;
    return hasToken ? redirectToProfile(router) : true;
  } catch {
    return true;
  }
};
