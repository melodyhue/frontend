import { Router, UrlSegment, UrlTree } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { UsersService } from '../services/users.service';

function denyToLogin(router: Router): UrlTree {
  return router.createUrlTree(['/login']);
}

export const authRequiredCanMatch = async (_route?: unknown, segments?: UrlSegment[]) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  const auth = inject(AuthService);
  const users = inject(UsersService);
  try {
    // Ne s'applique qu'aux préfixes "privés"; sinon, laisser matcher d'autres routes (dont **)
    const s0 = segments?.[0]?.path ?? '';
    const s1 = segments?.[1]?.path ?? '';
    const isPrivatePrefix =
      s0 === 'profile' ||
      s0 === 'overlays' ||
      s0 === 'settings' ||
      s0 === 'admin' ||
      s0 === 'modo' ||
      (s0 === 'auth' && s1 === '2fa') ||
      (s0 === 'developer' && s1 === 'api');

    if (!isPrivatePrefix) {
      // Ne pas appliquer le guard: permet d'atteindre la route 404 (**)
      return false;
    }

    // En SSR (pas de localStorage), on laisse passer: le check se fera côté navigateur
    if (!isBrowser) return true;
    // Cookie-only flow: tenter directement /users/me
    const me = await firstValueFrom(auth.me());
    // Si le backend expose un flag de ban dans /users/me, déconnecter immédiatement
    if ((me as any)?.is_banned === true) {
      try {
        await firstValueFrom(auth.logout());
      } catch {}
      return router.createUrlTree(['/login'], { queryParams: { reason: 'banned' } });
    }
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

// Unauth only: si déjà connecté côté serveur (cookies), redirige vers /profile
export const unauthOnlyCanMatch = async () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  const auth = inject(AuthService);
  try {
    // En SSR, on ne bloque pas; on effectuera la vérification côté navigateur
    if (!isBrowser) return true;
    // Tenter /users/me (l’intercepteur gère le refresh sur 401). Si OK => déjà connecté.
    await firstValueFrom(auth.me());
    return redirectToProfile(router);
  } catch {
    // Pas connecté: laisser accéder à la page de login
    return true;
  }
};
