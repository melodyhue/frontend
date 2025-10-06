import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly localeService = inject(LocaleService);

  readonly isSubmitting = signal(false);
  readonly emailSent = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Mot de passe oublié' : 'Forgot Password';
  });

  readonly description = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? 'Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.'
      : 'Enter your email address and we will send you a link to reset your password.';
  });

  readonly emailLabel = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Adresse e-mail' : 'Email Address';
  });

  readonly submitButtonLabel = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Envoyer le lien' : 'Send Reset Link';
  });

  readonly submittingLabel = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Envoi en cours...' : 'Sending...';
  });

  readonly backToLoginLink = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Retour à la connexion' : 'Back to Login';
  });

  readonly successMessage = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? 'Un e-mail de réinitialisation a été envoyé à votre adresse.'
      : 'A password reset email has been sent to your address.';
  });

  readonly successDescription = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? 'Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.'
      : 'Check your inbox and follow the instructions to reset your password.';
  });

  readonly formDescription = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? 'Formulaire de réinitialisation de mot de passe'
      : 'Password reset form';
  });

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    // Simuler l'envoi d'un e-mail
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.emailSent.set(true);
    }, 1500);
  }
}
