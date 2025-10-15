import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
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
        // On déclenche sans bloquer le démarrage
        queueMicrotask(() => {
          auth.me().subscribe({ next: () => {}, error: () => {} });
        });
      }
    }),
  ],
};
