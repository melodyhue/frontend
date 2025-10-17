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
    { provide: API_BASE_URL, useValue: 'https://dev.api.melodyhue.com' },
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
          // Ne faire l'appel /users/me que sur les pages privées connues.
          // Toute autre URL (y compris 404) est considérée publique pour éviter des redirections involontaires.
          const currentUrl = window.location.pathname || '/';
          const isPrivatePage =
            currentUrl.startsWith('/profile') ||
            currentUrl.startsWith('/overlays') ||
            currentUrl.startsWith('/settings') ||
            currentUrl.startsWith('/admin') ||
            currentUrl.startsWith('/modo') ||
            currentUrl.startsWith('/auth/2fa');

          if (!isPrivatePage) {
            // Sur les pages publiques/inconnues (incl. 404), stopper le temps réel et ne rien déclencher.
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
