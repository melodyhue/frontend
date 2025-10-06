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
import { AUTH_TOKEN_STORAGE_KEY } from '../../../../core/constants/storage-keys';

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
    if (this.isBrowser) {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }

    this.isProcessing.set(false);
    this.router.navigateByUrl('/');
  }
}
