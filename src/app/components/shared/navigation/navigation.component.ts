import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LocaleService, type SupportedLocale } from '../../../core/services/locale.service';
import { ButtonComponent } from '../button/button.component';

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
  private readonly localeService = inject(LocaleService);

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

  readonly localeOptions = this.localeService.localeOptions;
  readonly locale = this.localeService.locale;

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

  selectLocale(nextLocale: SupportedLocale): void {
    this.localeService.selectLocale(nextLocale);
  }

  toggleMenu(): void {
    this.menuOpen.update((currentValue) => !currentValue);
  }

  toggleLocale(closeMenuAfter = false): void {
    this.localeService.toggleLocale();

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
