import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SessionRefreshService } from '../../../../core/services/session-refresh.service';
import { AUTH_LAST_REFRESH_KEY } from '../../../../core/constants/storage-keys';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutComponent {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly authService = inject(AuthService);
  private readonly sessionRefresh = inject(SessionRefreshService);

  readonly isProcessing = signal(true);

  constructor() {
    effect(() => {
      if (!this.isProcessing()) {
        return;
      }

      queueMicrotask(() => this.performLogout());
    });
  }

  private performLogout(): void {
    // Appelle le backend pour effacer les cookies HttpOnly puis nettoie côté client
    this.authService.logout().subscribe({
      next: () => {
        try {
          this.sessionRefresh.stop();
          localStorage.removeItem(AUTH_LAST_REFRESH_KEY);
        } catch {}
      },
      error: () => {
        // Déjà géré dans le service via catchError/finalize
      },
      complete: () => {
        this.isProcessing.set(false);
        this.router.navigateByUrl('/');
      },
    });
  }
}
