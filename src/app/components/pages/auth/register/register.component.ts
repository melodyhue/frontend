import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AUTH_TOKEN_STORAGE_KEY } from '../../../../core/constants/storage-keys';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly localeService = inject(LocaleService);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);

  readonly title = computed(() =>
    this.localeService.locale() === 'fr' ? 'Création de compte' : 'Create account'
  );

  readonly subtitle = computed(() =>
    this.localeService.locale() === 'fr' ? 'Déjà inscrit ?' : 'Already registered?'
  );

  readonly loginLink = computed(() =>
    this.localeService.locale() === 'fr' ? 'Se connecter' : 'Log in'
  );

  readonly usernameLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Pseudo' : 'Username'
  );

  readonly emailLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Adresse e-mail' : 'Email address'
  );

  readonly passwordLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Mot de passe' : 'Password'
  );

  readonly confirmPasswordLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Confirmation du mot de passe' : 'Confirm password'
  );

  readonly acceptTermsLabel = computed(() =>
    this.localeService.locale() === 'fr' ? "J'accepte les" : 'I accept the'
  );

  readonly termsLink = computed(() =>
    this.localeService.locale() === 'fr' ? "conditions d'utilisation" : 'terms of service'
  );

  readonly andText = computed(() => (this.localeService.locale() === 'fr' ? 'et la' : 'and'));

  readonly privacyLink = computed(() =>
    this.localeService.locale() === 'fr' ? 'politique de confidentialité' : 'privacy policy'
  );

  readonly submitButtonLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Créer mon compte' : 'Create my account'
  );

  readonly submittingLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Création en cours…' : 'Creating account…'
  );

  readonly formDescription = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Tous les champs sont obligatoires et doivent être valides pour créer votre compte.'
      : 'All fields are required and must be valid to create your account.'
  );

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  readonly controls = this.form.controls;

  readonly passwordMismatch = computed(() => {
    const { password, confirmPassword } = this.controls;
    return confirmPassword.value.length > 0 && password.value !== confirmPassword.value;
  });

  private readonly reconcilePasswords = effect(() => {
    const control = this.controls.confirmPassword;
    const mismatch = this.passwordMismatch();
    const currentErrors = control.errors ?? {};

    if (mismatch) {
      if (!currentErrors['mismatch']) {
        control.setErrors({ ...currentErrors, mismatch: true });
      }
      return;
    }

    if (currentErrors['mismatch']) {
      const { mismatch: _removed, ...rest } = currentErrors;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  });

  readonly canShowUsernameError = computed(() => this.shouldShowError('username'));
  readonly canShowEmailError = computed(() => this.shouldShowError('email'));
  readonly canShowPasswordError = computed(() => this.shouldShowError('password'));
  readonly canShowConfirmPasswordError = computed(
    () => this.shouldShowError('confirmPassword') || this.passwordMismatch()
  );
  readonly shouldShowAcceptTermsError = computed(
    () =>
      this.controls.acceptTerms.invalid &&
      (this.controls.acceptTerms.touched || this.submitAttempted())
  );

  onSubmit(): void {
    this.submitAttempted.set(true);

    if (this.form.invalid || this.passwordMismatch()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.submissionInProgress()) {
      return;
    }

    this.submissionInProgress.set(true);

    queueMicrotask(() => {
      if (this.isBrowser) {
        window.localStorage.setItem(
          AUTH_TOKEN_STORAGE_KEY,
          JSON.stringify({
            session: 'persistent',
            createdAt: new Date().toISOString(),
            profile: {
              username: this.controls.username.value,
            },
          })
        );
      }

      this.submissionInProgress.set(false);
      this.router.navigateByUrl('/profile');
    });
  }

  getUsernameError(): string {
    const control = this.controls.username;
    if (!control.errors) {
      return '';
    }

    const isFr = this.localeService.locale() === 'fr';

    if (control.errors['required']) {
      return isFr ? 'Pseudo obligatoire' : 'Username is required';
    }

    if (control.errors['minlength']) {
      return isFr ? 'Minimum 3 caractères' : 'Minimum 3 characters';
    }

    if (control.errors['maxlength']) {
      return isFr ? 'Maximum 30 caractères' : 'Maximum 30 characters';
    }

    return isFr ? 'Pseudo invalide' : 'Invalid username';
  }

  getEmailError(): string {
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

  getPasswordError(): string {
    const control = this.controls.password;
    if (!control.errors) {
      return '';
    }

    const isFr = this.localeService.locale() === 'fr';

    if (control.errors['required']) {
      return isFr ? 'Mot de passe obligatoire' : 'Password is required';
    }

    if (control.errors['minlength']) {
      return isFr ? 'Minimum 8 caractères requis' : 'Minimum 8 characters required';
    }

    return isFr ? 'Mot de passe invalide' : 'Invalid password';
  }

  getConfirmPasswordError(): string {
    const control = this.controls.confirmPassword;
    const isFr = this.localeService.locale() === 'fr';

    if (this.passwordMismatch()) {
      return isFr ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match';
    }

    if (!control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return isFr ? 'Confirmation obligatoire' : 'Confirmation is required';
    }

    if (control.errors['mismatch']) {
      return isFr ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match';
    }

    return isFr ? 'Confirmation invalide' : 'Invalid confirmation';
  }

  getAcceptTermsError(): string {
    const isFr = this.localeService.locale() === 'fr';
    return isFr
      ? 'Vous devez accepter les conditions pour continuer'
      : 'You must accept the terms to continue';
  }

  private shouldShowError(controlName: keyof typeof this.controls): boolean {
    const control = this.controls[controlName];
    return control.invalid && (control.touched || this.submitAttempted());
  }
}
