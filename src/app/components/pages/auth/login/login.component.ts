import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AUTH_TOKEN_STORAGE_KEY } from '../../../../core/constants/storage-keys';
import { LocaleService } from '../../../../core/services/locale.service';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly localeService = inject(LocaleService);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);

  readonly title = computed(() => (this.localeService.locale() === 'fr' ? 'Connexion' : 'Log in'));

  readonly subtitle = computed(() =>
    this.localeService.locale() === 'fr' ? 'Pas encore de compte ?' : "Don't have an account?"
  );

  readonly createAccountLink = computed(() =>
    this.localeService.locale() === 'fr' ? 'Créer un compte' : 'Sign up'
  );

  readonly emailLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Adresse e-mail' : 'Email address'
  );

  readonly passwordLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Mot de passe' : 'Password'
  );

  readonly rememberMeLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Se souvenir de moi' : 'Remember me'
  );

  readonly submitButtonLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Se connecter' : 'Log in'
  );

  readonly submittingLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Connexion…' : 'Logging in…'
  );

  readonly formDescription = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Tous les champs sont obligatoires sauf indication contraire.'
      : 'All fields are required unless otherwise indicated.'
  );

  readonly forgotPasswordLink = computed(() =>
    this.localeService.locale() === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true],
  });

  readonly controls = this.form.controls;

  readonly canShowEmailError = computed(() => this.shouldShowError('email'));
  readonly canShowPasswordError = computed(() => this.shouldShowError('password'));

  onSubmit(): void {
    this.submitAttempted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.submissionInProgress()) {
      return;
    }

    this.submissionInProgress.set(true);

    queueMicrotask(() => {
      if (this.isBrowser) {
        const expiration = this.controls.rememberMe.value ? 'persistent' : 'session';
        window.localStorage.setItem(
          AUTH_TOKEN_STORAGE_KEY,
          JSON.stringify({ session: expiration, createdAt: new Date().toISOString() })
        );
      }

      this.submissionInProgress.set(false);
      this.router.navigateByUrl('/profile');
    });
  }

  private shouldShowError(controlName: keyof typeof this.controls): boolean {
    const control = this.controls[controlName];
    return control.invalid && (control.touched || this.submitAttempted());
  }

  getEmailErrorMessage(): string {
    const control = this.controls.email;
    if (!control.errors) {
      return '';
    }

    const isFr = this.localeService.locale() === 'fr';

    if (control.errors['required']) {
      return isFr ? 'Adresse e-mail obligatoire' : 'Email address is required';
    }

    if (control.errors['email']) {
      return isFr ? 'Adresse e-mail invalide' : 'Invalid email address';
    }

    return isFr ? 'Adresse e-mail invalide' : 'Invalid email address';
  }

  getPasswordErrorMessage(): string {
    const control = this.controls.password;
    if (!control.errors) {
      return '';
    }

    const isFr = this.localeService.locale() === 'fr';

    if (control.errors['required']) {
      return isFr ? 'Mot de passe obligatoire' : 'Password is required';
    }

    if (control.errors['minlength']) {
      return isFr ? 'Au moins 8 caractères requis' : 'At least 8 characters required';
    }

    return isFr ? 'Mot de passe invalide' : 'Invalid password';
  }
}
