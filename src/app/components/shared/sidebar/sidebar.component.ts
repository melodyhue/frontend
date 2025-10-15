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
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';

interface SidebarSection {
  readonly key: string; // stable key for tracking
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
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  readonly isReady = signal(false);
  readonly role = signal<string | null>(null);

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
      // Au chargement, on récupère le rôle côté backend
      this.usersService.me().subscribe({
        next: (u) => {
          const backendRole = (u as any)?.role || null;
          this.role.set(backendRole);
        },
        error: () => {
          // en cas d'échec, on laisse null
          this.role.set(null);
        },
      });
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => this.isReady.set(true));
      } else {
        setTimeout(() => this.isReady.set(true));
      }
    }
  }

  // Le rôle ne doit pas provenir du stockage local car modifiable côté client

  readonly sections: readonly SidebarSection[] = [
    {
      key: 'profile',
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
      key: 'overlays',
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
      key: 'developer',
      title: { fr: 'Développeur', en: 'Developer' },
      items: [
        {
          path: '/developer/api',
          label: { fr: 'Mon API', en: 'My API' },
          icon: 'fa-solid fa-code',
          exact: true,
        },
      ],
    },
    {
      key: 'settings',
      title: { fr: 'Paramètres', en: 'Settings' },
      items: [
        {
          path: '/settings/general',
          label: { fr: 'Général', en: 'General' },
          icon: 'fa-solid fa-gear',
        },
        // {
        //   path: '/settings/appearance',
        //   label: { fr: 'Apparence', en: 'Appearance' },
        //   icon: 'fa-solid fa-palette',
        // },
        {
          path: '/settings/language',
          label: { fr: 'Langue', en: 'Language' },
          icon: 'fa-solid fa-language',
        },
      ],
    },
    {
      key: 'admin',
      title: { fr: 'Administration', en: 'Administration' },
      items: [
        {
          path: '/admin',
          label: { fr: 'Tableau de bord', en: 'Dashboard' },
          icon: 'fa-solid fa-tachometer-alt',
          exact: true,
        },
        {
          path: '/admin/roles',
          label: { fr: 'Rôles', en: 'Roles' },
          icon: 'fa-solid fa-user-shield',
        },
      ],
    },
    {
      key: 'moderation',
      title: { fr: 'Modération', en: 'Moderation' },
      items: [
        {
          path: '/modo/users',
          label: { fr: 'Utilisateurs', en: 'Users' },
          icon: 'fa-solid fa-users',
        },
        {
          path: '/modo/overlays',
          label: { fr: 'Overlays', en: 'Overlays' },
          icon: 'fa-solid fa-layer-group',
        },
      ],
    },
    {
      key: 'actions',
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
    const role = (this.role() || '').trim().toLowerCase();
    const isAdmin = role === 'admin';
    const isModerator = role === 'moderator';
    // Filtrer items en fonction du rôle
    return this.sections
      .map((section) => {
        const items = section.items
          .filter((item) => {
            const p = item.path || '';
            if (p.startsWith('/admin')) return isAdmin;
            if (p.startsWith('/modo')) return isAdmin || isModerator;
            return true;
          })
          .map((item) => ({
            ...item,
            label: item.label[locale],
          }));
        return {
          key: section.key,
          title: section.title[locale],
          items,
        };
      })
      .filter((s) => s.items.length > 0);
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
