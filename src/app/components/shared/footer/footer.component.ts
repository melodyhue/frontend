import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/services/locale.service';
import pkg from '../../../../../package.json';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly localeService = inject(LocaleService);

  private readonly creationYear = 2025;
  readonly currentYear = signal(new Date().getFullYear());
  readonly yearsRange = computed(() =>
    this.currentYear() > this.creationYear
      ? `${this.creationYear} - ${this.currentYear()}`
      : `${this.creationYear}`
  );

  readonly version = pkg.version as string;

  readonly copyright = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? `© ${this.yearsRange()} MelodyHue - Tous droits réservés.`
      : `© ${this.yearsRange()} MelodyHue - All rights reserved.`;
  });

  readonly madeWith = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Fait avec' : 'Made with';
  });

  readonly by = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'par' : 'by';
  });

  readonly links = computed(() => {
    const locale = this.localeService.locale();
    return {
      about: locale === 'fr' ? 'À propos' : 'About',
      terms: locale === 'fr' ? "Conditions d'utilisation" : 'Terms of Service',
      privacy: locale === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy',
      github: locale === 'fr' ? 'Code source' : 'Source Code',
    };
  });
}
