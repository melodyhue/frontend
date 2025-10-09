import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-settings-language',
  imports: [],
  templateUrl: './language.component.html',
  styleUrl: './language.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageComponent {
  readonly localeService = inject(LocaleService);

  readonly title = computed(() => (this.localeService.locale() === 'fr' ? 'Langue' : 'Language'));

  readonly description = computed(() =>
    this.localeService.locale() === 'fr'
      ? "Choisissez la langue de l'interface de l'application."
      : 'Choose the language for the application interface.'
  );

  readonly currentLanguageLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Langue actuelle' : 'Current language'
  );

  readonly selectLanguageLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Sélectionner une langue' : 'Select a language'
  );

  readonly localeOptions = this.localeService.localeOptions;

  readonly displayLocale = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Français' : 'English';
  });

  selectLocale(code: string): void {
    if (code === 'fr' || code === 'en') {
      this.localeService.selectLocale(code);
    }
  }
}
