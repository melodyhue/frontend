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
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { LocaleService } from '../../../../core/services/locale.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
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
  private readonly authService = inject(AuthService);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);
  readonly formError = signal<string | null>(null);

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
    rememberMe: [true],
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
    this.formError.set(null);

    if (this.form.invalid || this.passwordMismatch()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.submissionInProgress()) {
      return;
    }

    this.submissionInProgress.set(true);
    // Préférence de session: on aligne sur le comportement du login
    const sessionPref = this.controls.rememberMe?.value ? 'persistent' : 'session';
    this.authService.storeSessionPreference(sessionPref);
    const payload = {
      username: this.controls.username.value,
      email: this.controls.email.value,
      password: this.controls.password.value,
    } as const;
    this.authService.register(payload).subscribe({
      next: (res) => {
        const maybeAny = res as any;
        // Si l'API retourne déjà des tokens (comme login), on les stocke
        if (maybeAny?.access_token && maybeAny?.refresh_token) {
          this.authService.storeLoginTokens({
            access_token: maybeAny.access_token,
            refresh_token: maybeAny.refresh_token,
            token_type: maybeAny.token_type,
            requires_2fa: maybeAny.requires_2fa,
            ticket: maybeAny.ticket,
            role: maybeAny.role,
            user_id: maybeAny.user_id,
          });
        }
        this.submissionInProgress.set(false);
        this.router.navigateByUrl('/profile');
      },
      error: (err) => {
        this.submissionInProgress.set(false);
        this.form.markAllAsTouched();
        this.handleRegisterError(err);
      },
    });
  }

  private handleRegisterError(err: unknown): void {
    const isFr = this.localeService.locale() === 'fr';

    const setTaken = (controlName: 'email') => {
      const control = this.controls[controlName];
      const current = control.errors ?? {};
      control.setErrors({ ...current, taken: true });
      control.markAsTouched();
    };

    const generic = isFr
      ? 'Une erreur est survenue lors de la création du compte. Réessayez plus tard.'
      : 'An error occurred while creating the account. Please try again later.';

    if (err instanceof HttpErrorResponse) {
      const status = err.status;
      const body: any = err.error;
      const msg = (typeof body === 'string' ? body : body?.message || body?.error || '') as string;
      const detail = typeof body === 'object' ? (body?.detail as string | undefined) : undefined;

      // Détection explicite via body.detail (format: { detail: "Email déjà pris" })
      const detailEmailTaken =
        typeof detail === 'string' &&
        (/^email déjà pris$/i.test(detail.trim()) ||
          (/email/i.test(detail) && /(déjà|pris|taken|exists)/i.test(detail)));

      // Garde-fous additionnels (anciens formats)
      const hasEmailConflict =
        detailEmailTaken ||
        (body?.errors?.email && String(body.errors.email).length > 0) ||
        (/email/i.test(msg) && /(exist|déjà|taken|used|duplicate|conflict)/i.test(msg)) ||
        /EMAIL.*(TAKEN|EXISTS)/i.test(String(body?.code || body?.errorCode || msg));

      // Statuts communs pour conflits: 400 (validation), 409 (conflit), 422 (validation)
      if (status === 400 || status === 409 || status === 422) {
        let matched = false;
        if (hasEmailConflict) {
          setTaken('email');
          matched = true;
          // Affiche aussi un message global visible
          this.formError.set(isFr ? 'Cet e-mail est déjà utilisé' : 'This email is already in use');
        }
        if (!matched) {
          // Essayer de mapper des erreurs détaillées
          if (body?.errors) {
            const errs = body.errors as Record<string, string | string[]>;
            for (const key of Object.keys(errs)) {
              if (key in this.controls) {
                const c = this.controls[key as keyof typeof this.controls];
                const cur = c.errors ?? {};
                c.setErrors({ ...cur, server: true });
                c.markAsTouched();
                // On met un message générique au formulaire
                this.formError.set(generic);
              }
            }
            return;
          }
          // Sinon, message générique
          this.formError.set(generic);
        }
        return;
      }

      // Autres statuts -> message générique
      this.formError.set(generic);
      return;
    }

    // Erreur inconnue
    this.formError.set(generic);
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

    if (control.errors['taken'] || control.errors['conflict']) {
      return isFr ? 'Cet e-mail est déjà utilisé' : 'This email is already in use';
    }

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
