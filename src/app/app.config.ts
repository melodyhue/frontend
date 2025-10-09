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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([apiPrefixInterceptor, authRefreshInterceptor])),
    // { provide: API_BASE_URL, useValue: 'https://api.melodyhue.com' },
    { provide: API_BASE_URL, useValue: 'http://localhost:8765' },
    provideAppInitializer(() => {
      const s = inject(SessionRefreshService);
      s.start();
    }),
  ],
};
