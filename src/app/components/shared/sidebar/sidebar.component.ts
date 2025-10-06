import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';

interface SidebarSection {
  readonly title: string;
  readonly items: readonly SidebarItem[];
}

interface SidebarItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sidebar',
    '[class.sidebar--collapsed]': 'isCollapsed()',
    '[class.sidebar--ready]': 'isReady()',
  },
})
export class SidebarComponent {
  private static readonly STORAGE_KEY = 'melodyhue:sidebar:collapsed';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly isReady = signal(false);

  private loadCollapsedState(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      const stored = window.localStorage.getItem(SidebarComponent.STORAGE_KEY);
      if (stored === 'true') {
        return true;
      }

      if (stored === 'false') {
        return false;
      }

      const prefersCollapsed =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(max-width: 768px)').matches
          : false;

      return prefersCollapsed;
    } catch (error) {
      console.warn('Unable to read sidebar collapsed state', error);
      return false;
    }
  }

  readonly isCollapsed = signal(this.loadCollapsedState());

  constructor() {
    if (this.isBrowser) {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => this.isReady.set(true));
      } else {
        setTimeout(() => this.isReady.set(true));
      }
    }
  }

  readonly sections: readonly SidebarSection[] = [
    {
      title: 'Profil',
      items: [
        { path: '/profile', label: 'Mon profil', icon: 'fa-solid fa-user', exact: true },
        { path: '/profile/edit', label: 'Modifier', icon: 'fa-solid fa-pen' },
        { path: '/profile/security', label: 'Sécurité', icon: 'fa-solid fa-lock' },
      ],
    },
    {
      title: 'Paramètres',
      items: [
        { path: '/settings/general', label: 'Général', icon: 'fa-solid fa-gear' },
        { path: '/settings/appearance', label: 'Apparence', icon: 'fa-solid fa-palette' },
      ],
    },
    // {
    //   title: 'Compte',
    //   items: [
    //     { path: '/account/subscription', label: 'Abonnement', icon: 'fa-solid fa-gem' },
    //     { path: '/account/billing', label: 'Facturation', icon: 'fa-solid fa-credit-card' },
    //   ],
    // },
    {
      title: 'Actions',
      items: [{ path: '/auth/logout', label: 'Se déconnecter', icon: 'fa-solid fa-sign-out-alt' }],
    },
  ];

  readonly exactMatchOptions = { exact: true } as const;
  readonly defaultMatchOptions = { exact: false } as const;

  private readonly syncCollapsedStateEffect = effect(() => {
    const collapsed = this.isCollapsed();
    this.saveCollapsedState(collapsed);
  });

  getMatchOptions(exact?: boolean) {
    return exact ? this.exactMatchOptions : this.defaultMatchOptions;
  }

  toggleCollapse(): void {
    this.isCollapsed.update((value) => !value);
  }

  private saveCollapsedState(collapsed: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(SidebarComponent.STORAGE_KEY, String(collapsed));
    } catch (error) {
      console.error('Unable to save sidebar collapsed state', error);
    }
  }
}
