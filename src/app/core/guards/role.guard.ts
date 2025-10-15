import { Router, UrlTree } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { UsersService } from '../services/users.service';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

function buildUrlTree(router: Router, path: string = '/profile'): UrlTree {
  const cleaned = (path ?? '/profile').trim();
  const absolute = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return router.parseUrl(absolute);
}

let cachedRole: { value: string | null; ts: number } | null = null;
const ROLE_TTL_MS = 30_000; // 30s de cache soft pour limiter les appels

/**
 * Réinitialise le cache du rôle utilisateur.
 * Utile pour les tests unitaires.
 * @internal
 */
export function resetRoleCache(): void {
  cachedRole = null;
}

async function fetchRole(): Promise<string | null> {
  const now = Date.now();
  if (cachedRole && now - cachedRole.ts < ROLE_TTL_MS) {
    return cachedRole.value;
  }
  const users = inject(UsersService);
  try {
    const me = await firstValueFrom(users.me());
    const role = (me as any)?.role ? String((me as any).role).toLowerCase() : null;
    cachedRole = { value: role, ts: now };
    return role;
  } catch {
    // En cas d'erreur (401/403), considérer aucun rôle
    cachedRole = { value: null, ts: now };
    return null;
  }
}

// Admin only
export const adminOnlyCanMatch = async () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  // En SSR, rediriger vers /profile pour éviter un flash de contenu admin avant la redirection côté client
  if (!isBrowser) return buildUrlTree(router, '/profile');
  const role = await fetchRole();
  if (role === 'admin') return true;
  return buildUrlTree(router, '/profile');
};

// Moderator or Admin
export const moderatorOrAdminCanMatch = async () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  if (!isBrowser) return buildUrlTree(router, '/profile');
  const role = await fetchRole();
  if (role === 'admin' || role === 'moderator') return true;
  return buildUrlTree(router, '/profile');
};

// canActivate variantes pour forcer la redirection au lieu d'un simple "non match"
export const adminOnlyCanActivate = async () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  if (!isBrowser) return buildUrlTree(router, '/profile');
  const role = await fetchRole();
  return role === 'admin' ? true : buildUrlTree(router, '/profile');
};

export const moderatorOrAdminCanActivate = async () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  if (!isBrowser) return buildUrlTree(router, '/profile');
  const role = await fetchRole();
  return role === 'admin' || role === 'moderator' ? true : buildUrlTree(router, '/profile');
};
