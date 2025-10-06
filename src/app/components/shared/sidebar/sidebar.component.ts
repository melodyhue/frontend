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
import { LocaleService, type SupportedLocale } from '../../../core/services/locale.service';

interface SidebarSection {
  readonly title: Record<SupportedLocale, string>;
  readonly items: readonly SidebarItem[];
}

interface SidebarItem {
  readonly path: string;
  readonly label: Record<SupportedLocale, string>;
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
  readonly localeService = inject(LocaleService);

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
      title: { fr: 'Profil', en: 'Profile' },
      items: [
        {
          path: '/profile',
          label: { fr: 'Mon profil', en: 'My profile' },
          icon: 'fa-solid fa-user',
          exact: true,
        },
        { path: '/profile/edit', label: { fr: 'Modifier', en: 'Edit' }, icon: 'fa-solid fa-pen' },
        {
          path: '/profile/security',
          label: { fr: 'Sécurité', en: 'Security' },
          icon: 'fa-solid fa-lock',
        },
      ],
    },
    {
      title: { fr: 'Overlays', en: 'Overlays' },
      items: [
        {
          path: '/overlays',
          label: { fr: 'Mes overlays', en: 'My overlays' },
          icon: 'fa-solid fa-layer-group',
          exact: true,
        },
      ],
    },
    {
      title: { fr: 'Paramètres', en: 'Settings' },
      items: [
        {
          path: '/settings/general',
          label: { fr: 'Général', en: 'General' },
          icon: 'fa-solid fa-gear',
        },
        {
          path: '/settings/appearance',
          label: { fr: 'Apparence', en: 'Appearance' },
          icon: 'fa-solid fa-palette',
        },
        {
          path: '/settings/language',
          label: { fr: 'Langue', en: 'Language' },
          icon: 'fa-solid fa-language',
        },
      ],
    },
    // {
    //   title: { fr: 'Compte', en: 'Account' },
    //   items: [
    //     { path: '/account/subscription', label: { fr: 'Abonnement', en: 'Subscription' }, icon: 'fa-solid fa-gem' },
    //     { path: '/account/billing', label: { fr: 'Facturation', en: 'Billing' }, icon: 'fa-solid fa-credit-card' },
    //   ],
    // },
    {
      title: { fr: 'Actions', en: 'Actions' },
      items: [
        {
          path: '/auth/logout',
          label: { fr: 'Se déconnecter', en: 'Log out' },
          icon: 'fa-solid fa-sign-out-alt',
        },
      ],
    },
  ];

  readonly localizedSections = computed(() => {
    const locale = this.localeService.locale();
    return this.sections.map((section) => ({
      title: section.title[locale],
      items: section.items.map((item) => ({
        ...item,
        label: item.label[locale],
      })),
    }));
  });

  readonly collapseAriaLabel = computed(() =>
    this.localeService.locale() === 'fr'
      ? this.isCollapsed()
        ? 'Déplier la sidebar'
        : 'Replier la sidebar'
      : this.isCollapsed()
      ? 'Expand sidebar'
      : 'Collapse sidebar'
  );

  readonly logoAriaLabel = computed(() =>
    this.localeService.locale() === 'fr' ? "Retour à l'accueil" : 'Back to home'
  );

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
