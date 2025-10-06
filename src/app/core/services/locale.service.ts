import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { LOCALE_STORAGE_KEY } from '../constants/storage-keys';

export type SupportedLocale = 'fr' | 'en';

export interface LocaleOption {
  readonly code: SupportedLocale;
  readonly shortLabel: string;
  readonly fullLabel: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocaleService {
  private readonly documentRef = inject(DOCUMENT, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly localeOptions: readonly LocaleOption[] = [
    { code: 'fr', shortLabel: 'FR', fullLabel: 'FR' },
    { code: 'en', shortLabel: 'EN', fullLabel: 'EN' },
  ] as const;

  private readonly initialLocale = this.resolveInitialLocale();
  readonly locale = signal<SupportedLocale>(this.initialLocale);

  private readonly syncLocaleEffect = effect(() => {
    const currentLocale = this.locale();

    if (this.documentRef?.documentElement) {
      this.documentRef.documentElement.lang = currentLocale;
    }

    if (this.isBrowser) {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
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

  toggleLocale(): void {
    const nextLocale: SupportedLocale = this.locale() === 'fr' ? 'en' : 'fr';
    this.selectLocale(nextLocale);
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
      const storedValue = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (storedValue === 'fr' || storedValue === 'en') {
        return storedValue;
      }
    } catch (error) {
      console.warn('Unable to read stored locale preference', error);
    }

    return null;
  }
}
