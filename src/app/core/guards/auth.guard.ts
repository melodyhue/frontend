import { UrlTree } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

function denyToLogin(): UrlTree {
  const router = inject(Router);
  return router.parseUrl('/login');
}

export const authRequiredCanMatch = () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const auth = inject(AuthService);
  try {
    // En SSR (pas de localStorage), on laisse passer: le check se fera côté navigateur
    if (!isBrowser) return true;
    const state = auth.readAuthState();
    const hasToken = !!state?.access_token;
    return hasToken ? true : denyToLogin();
  } catch {
    return isBrowser ? denyToLogin() : true;
  }
};

function redirectToProfile(): UrlTree {
  const router = inject(Router);
  return router.parseUrl('/profile');
}

// Unauth only: si déjà connecté, redirige vers /profile
export const unauthOnlyCanMatch = () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const auth = inject(AuthService);
  try {
    if (!isBrowser) return true; // laisser SSR passer, redirection côté client
    const state = auth.readAuthState();
    const hasToken = !!state?.access_token;
    return hasToken ? redirectToProfile() : true;
  } catch {
    return true;
  }
};
