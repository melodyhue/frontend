import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';
import { authRefreshInterceptor } from './core/interceptors/auth-refresh.interceptor';
import { API_BASE_URL } from './core/tokens/api-base-url.token';
import { SessionRefreshService } from './core/services/session-refresh.service';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { RealtimeService } from './core/services/realtime.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([apiPrefixInterceptor, authRefreshInterceptor])),
    { provide: API_BASE_URL, useValue: 'https://api.melodyhue.com' },
    provideAppInitializer(() => {
      const s = inject(SessionRefreshService);
      const platformId = inject(PLATFORM_ID);
      const isBrowser = isPlatformBrowser(platformId);
      // Démarre le rafraîchissement périodique
      s.start();
      // Au boot navigateur: déclenche un GET /users/me; si 401 => intercepteur fera /auth/refresh puis rejouera
      if (isBrowser) {
        const auth = inject(AuthService);
        const rt = inject(RealtimeService);
        const router = inject(Router);

        // On déclenche sans bloquer le démarrage
        queueMicrotask(() => {
          // Ne pas faire l'appel /users/me sur les pages publiques
          const currentUrl = window.location.pathname;
          const isPublicPage =
            // Pages d'auth publiques
            currentUrl.startsWith('/auth/reset') ||
            currentUrl.startsWith('/auth/forgot') ||
            currentUrl.startsWith('/auth/login') ||
            currentUrl.startsWith('/auth/register') ||
            // Pages publiques principales
            currentUrl === '/' ||
            currentUrl.startsWith('/about') ||
            currentUrl.startsWith('/developer/api/') ||
            currentUrl.startsWith('/overlay/') ||
            currentUrl.startsWith('/legal/');

          if (isPublicPage) {
            // Sur les pages d'auth publiques, juste arrêter les services temps réel
            rt.stop();
            return;
          }

          auth.me().subscribe({
            next: () => {
              // Si aucun access token n'est en mémoire (cookie HttpOnly only), tenter un refresh
              const haveToken = !!auth.getAccessToken();
              if (!haveToken) {
                auth.refreshWithCookie().subscribe({
                  next: (tokens) => {
                    auth.storeTokenPair(tokens);
                    rt.start();
                  },
                  error: () => {
                    // En dernier recours, démarrer quand même (cookies pourraient suffire)
                    rt.start();
                  },
                });
              } else {
                rt.start();
              }
            },
            error: () => {
              // Si pas connecté, arrêter la connexion WS par sécurité
              rt.stop();
            },
          });
        });
      }
    }),
  ],
};
