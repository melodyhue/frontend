import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { AUTH_LAST_REFRESH_KEY, AUTH_TOKEN_STORAGE_KEY } from '../constants/storage-keys';
import { TokenPair } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class SessionRefreshService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly authService = inject(AuthService);
  private timer: any = null;

  // Intervalle de rafraîchissement: 10 minutes (ajuster selon la durée de vie des access tokens)
  private readonly intervalMs = 10 * 60 * 1000;

  start() {
    if (!this.isBrowser) return;
    this.stop();
    // Lance un refresh immédiat si nécessaire
    this.refreshIfNeeded();
    // Puis planifie un refresh périodique
    this.timer = setInterval(() => this.refreshIfNeeded(), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private refreshIfNeeded() {
    try {
      const raw = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw) as TokenPair & { createdAt?: string; session?: string };
      const refreshToken = state?.refresh_token;
      if (!refreshToken) return;

      const last = localStorage.getItem(AUTH_LAST_REFRESH_KEY);
      const lastTs = last ? parseInt(last, 10) : 0;
      const now = Date.now();
      // Évite de spammer: au moins 5 minutes entre deux refresh forcés
      if (now - lastTs < 5 * 60 * 1000) return;

      this.authService.refresh({ refresh_token: refreshToken }).subscribe({
        next: (tokens) => {
          this.authService.storeTokenPair(tokens);
          try {
            localStorage.setItem(AUTH_LAST_REFRESH_KEY, String(Date.now()));
          } catch {}
        },
        error: (err) => {
          // En cas d'erreur, on ne déconnecte pas immédiatement; on réessaiera au prochain intervalle
          console.warn('[SessionRefresh] refresh failed', err);
        },
      });
    } catch {}
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
