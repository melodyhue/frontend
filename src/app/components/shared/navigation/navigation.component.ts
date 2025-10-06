import { DOCUMENT, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonComponent } from '../button/button.component';

type SupportedLocale = 'fr' | 'en';

interface LocaleOption {
  readonly code: SupportedLocale;
  readonly shortLabel: string;
  readonly fullLabel: string;
}

type NavigationGroup = 'primary' | 'auth';

interface NavigationEntry {
  readonly path: string;
  readonly label: Record<SupportedLocale, string>;
  readonly group: NavigationGroup;
  readonly exact?: boolean;
}

interface ViewNavigationItem {
  readonly path: string;
  readonly label: string;
  readonly matchOptions: { exact: boolean };
}

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, ButtonComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'navigation',
  },
})
export class NavigationComponent {
  private static readonly storageKey = 'melodyhue:locale';

  private readonly documentRef = inject(DOCUMENT, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly navigationEntries: readonly NavigationEntry[] = [
    {
      path: '/',
      label: { fr: 'Accueil', en: 'Home' },
      group: 'primary',
      exact: true,
    },
    {
      path: '/about',
      label: { fr: 'À propos', en: 'About' },
      group: 'primary',
    },
    {
      path: '/auth/login',
      label: { fr: 'Connexion', en: 'Log in' },
      group: 'auth',
    },
    {
      path: '/auth/register',
      label: { fr: 'Inscription', en: 'Sign up' },
      group: 'auth',
    },
  ];

  readonly localeOptions: readonly LocaleOption[] = [
    { code: 'fr', shortLabel: 'FR', fullLabel: 'FR' },
    { code: 'en', shortLabel: 'EN', fullLabel: 'EN' },
  ] as const;

  private readonly initialLocale = this.resolveInitialLocale();

  readonly locale = signal<SupportedLocale>(this.initialLocale);
  private readonly menuOpen = signal(false);

  readonly activeLocaleLabel = computed(
    () =>
      this.localeOptions.find((option) => option.code === this.locale())?.fullLabel ?? 'Français'
  );

  readonly primaryNavItems = computed<readonly ViewNavigationItem[]>(() =>
    this.mapNavigationEntries('primary')
  );

  readonly authNavItems = computed<readonly ViewNavigationItem[]>(() =>
    this.mapNavigationEntries('auth')
  );

  readonly isMenuOpen = computed(() => this.menuOpen());

  readonly mobileToggleLabels = computed(() =>
    this.locale() === 'fr'
      ? { open: 'Ouvrir la navigation', close: 'Fermer la navigation' }
      : { open: 'Open navigation', close: 'Close navigation' }
  );

  readonly mobileCloseLabel = computed(() =>
    this.locale() === 'fr' ? 'Fermer le menu' : 'Close menu'
  );

  readonly exactMatchOptions = { exact: true } as const;
  readonly defaultMatchOptions = { exact: false } as const;

  private readonly syncLocaleEffect = effect(() => {
    const currentLocale = this.locale();

    if (this.documentRef?.documentElement) {
      this.documentRef.documentElement.lang = currentLocale;
    }

    if (this.isBrowser) {
      try {
        window.localStorage.setItem(NavigationComponent.storageKey, currentLocale);
      } catch (error) {
        console.error('Unable to persist locale preference', error);
      }
    }
  });

  selectLocale(nextLocale: SupportedLocale): void {
    if (nextLocale === this.locale()) {
      return;
    }

    this.locale.set(nextLocale);
  }

  private resolveInitialLocale(): SupportedLocale {
    const fallbackLocale: SupportedLocale = 'fr';

    const storedLocale = this.readStoredLocale();
    if (storedLocale) {
      return storedLocale;
    }

    const documentLocale = this.documentRef?.documentElement?.lang;
    if (documentLocale === 'en') {
      return 'en';
    }

    return fallbackLocale;
  }

  private readStoredLocale(): SupportedLocale | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const storedValue = window.localStorage.getItem(NavigationComponent.storageKey);
      if (storedValue === 'fr' || storedValue === 'en') {
        return storedValue;
      }
    } catch (error) {
      console.warn('Unable to read stored locale preference', error);
    }

    return null;
  }

  toggleMenu(): void {
    this.menuOpen.update((currentValue) => !currentValue);
  }

  toggleLocale(closeMenuAfter = false): void {
    const nextLocale: SupportedLocale = this.locale() === 'fr' ? 'en' : 'fr';
    this.selectLocale(nextLocale);

    if (closeMenuAfter) {
      this.closeMenu();
    }
  }

  onToggleKey(event: KeyboardEvent): void {
    const key = event.key;
    if (key === ' ') {
      event.preventDefault();
    }

    if (key === 'Enter' || key === ' ') {
      this.toggleMenu();
    }
  }

  onLocaleChange(event: Event, closeAfterChange = false): void {
    const target = event.target as HTMLSelectElement | null;
    if (!target) {
      return;
    }

    const selected = target.value;
    if (selected === 'fr' || selected === 'en') {
      this.selectLocale(selected);

      if (closeAfterChange) {
        this.closeMenu();
      }

      return;
    }

    target.value = this.locale();
  }

  closeMenu(): void {
    if (!this.menuOpen()) {
      return;
    }

    this.menuOpen.set(false);
  }

  private mapNavigationEntries(group: NavigationGroup): ViewNavigationItem[] {
    const currentLocale = this.locale();

    return this.navigationEntries
      .filter((entry) => entry.group === group)
      .map((entry) => ({
        path: entry.path,
        label: entry.label[currentLocale],
        matchOptions: entry.exact ? this.exactMatchOptions : this.defaultMatchOptions,
      }));
  }
}
