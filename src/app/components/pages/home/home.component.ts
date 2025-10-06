import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocaleService } from '../../../core/services/locale.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);

  readonly content = computed(() => {
    const locale = this.localeService.locale();
    return {
      hero: {
        title: locale === 'fr' ? 'MelodyHue' : 'MelodyHue',
        subtitle:
          locale === 'fr'
            ? 'Des overlays musicaux pour vos streams'
            : 'Music overlays for your streams',
        description:
          locale === 'fr'
            ? 'Affichez votre musique Spotify en direct avec style. Compatible OBS et XSplit.'
            : 'Display your Spotify music live with style. Compatible with OBS and XSplit.',
        ctaPrimary: locale === 'fr' ? 'Commencer gratuitement' : 'Start for Free',
        ctaSecondary: locale === 'fr' ? 'Découvrir' : 'Learn More',
        scrollHint: locale === 'fr' ? 'Défiler pour en savoir plus' : 'Scroll to learn more',
      },
      quickInfo: {
        title: locale === 'fr' ? 'Simple et puissant' : 'Simple and Powerful',
        items: [
          {
            titleFr: 'Connectez Spotify',
            titleEn: 'Connect Spotify',
          },
          {
            titleFr: 'Choisissez votre style',
            titleEn: 'Choose your style',
          },
          {
            titleFr: 'Intégrez dans OBS',
            titleEn: 'Integrate in OBS',
          },
        ],
      },
      cta: {
        title: locale === 'fr' ? 'Prêt à commencer ?' : 'Ready to get started?',
        button: locale === 'fr' ? 'Créer un compte' : 'Create Account',
      },
    };
  });

  getItemTitle(item: { titleFr: string; titleEn: string }): string {
    const locale = this.localeService.locale();
    return locale === 'fr' ? item.titleFr : item.titleEn;
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  goToAbout(): void {
    this.router.navigate(['/about']);
  }
}
