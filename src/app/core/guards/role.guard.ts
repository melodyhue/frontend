import { UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

function denyTo(path: string = '/profile'): UrlTree {
  const router = inject(Router);
  return router.parseUrl(path);
}

function getRole(): string | null {
  const auth = inject(AuthService);
  try {
    const st = auth.readAuthState();
    const role = (st?.role || '').toString().trim().toLowerCase();
    return role || null;
  } catch {
    return null;
  }
}

// Admin only
export const adminOnlyCanMatch = () => {
  const role = getRole();
  if (role === 'admin') return true;
  return denyTo('/profile');
};

// Moderator or Admin
export const moderatorOrAdminCanMatch = () => {
  const role = getRole();
  if (role === 'admin' || role === 'moderator') return true;
  return denyTo('/profile');
};
