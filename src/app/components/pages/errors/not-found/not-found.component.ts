import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocaleService } from '../../../../core/services/locale.service';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-not-found',
  imports: [ButtonComponent],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);

  readonly content = computed(() => {
    const locale = this.localeService.locale();
    return {
      title: locale === 'fr' ? 'Page introuvable' : 'Page Not Found',
      description:
        locale === 'fr' ? "Désolé, cette page n'existe pas." : "Sorry, this page doesn't exist.",
      buttons: {
        home: locale === 'fr' ? "Retour à l'accueil" : 'Back to Home',
        previous: locale === 'fr' ? 'Retour' : 'Go Back',
      },
    };
  });

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }
}
