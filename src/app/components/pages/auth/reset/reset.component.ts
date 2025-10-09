import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ButtonComponent } from '../../../shared/button/button.component';
import { LocaleService } from '../../../../core/services/locale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reset',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly localeService = inject(LocaleService);
  private readonly authService = inject(AuthService);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);
  readonly formError = signal<string | null>(null);
  readonly token = signal<string | null>(null);

  constructor() {
    // Lecture du token depuis la query string
    const qp = this.route.snapshot.queryParamMap;
    const t = qp.get('token');
    this.token.set(t);
  }

  // Libellés
  readonly title = computed(() =>
    this.localeService.locale() === 'fr' ? 'Réinitialiser le mot de passe' : 'Reset password'
  );

  readonly description = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Choisissez un nouveau mot de passe pour votre compte.'
      : 'Choose a new password for your account.'
  );

  readonly newPasswordLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Nouveau mot de passe' : 'New password'
  );

  readonly confirmPasswordLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Confirmation du mot de passe' : 'Confirm password'
  );

  readonly submitButtonLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Réinitialiser' : 'Reset password'
  );

  readonly submittingLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Réinitialisation…' : 'Resetting…'
  );

  readonly backToLogin = computed(() =>
    this.localeService.locale() === 'fr' ? 'Retour à la connexion' : 'Back to login'
  );

  readonly tokenMissingText = computed(() =>
    this.localeService.locale() === 'fr'
      ? "Lien invalide: token manquant dans l'URL."
      : 'Invalid link: missing token in URL.'
  );

  readonly tokenInvalidText = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.'
      : 'The reset link is invalid or has expired. Please request a new link.'
  );

  readonly form = this.fb.nonNullable.group({
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly controls = this.form.controls;

  readonly passwordMismatch = computed(() => {
    const { new_password, confirmPassword } = this.controls;
    return confirmPassword.value.length > 0 && new_password.value !== confirmPassword.value;
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

  readonly canShowNewPasswordError = computed(() => this.shouldShowError('new_password'));
  readonly canShowConfirmPasswordError = computed(
    () => this.shouldShowError('confirmPassword') || this.passwordMismatch()
  );

  onSubmit(): void {
    this.submitAttempted.set(true);
    this.formError.set(null);

    if (!this.token()?.length) {
      this.formError.set(this.tokenMissingText());
      return;
    }

    if (this.form.invalid || this.passwordMismatch()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.submissionInProgress()) {
      return;
    }

    this.submissionInProgress.set(true);
    const payload = {
      token: this.token() as string,
      new_password: this.controls.new_password.value,
    } as const;

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.submissionInProgress.set(false);
        // Redirection vers la page de login après succès
        this.router.navigateByUrl('/auth/login');
      },
      error: (err) => {
        this.submissionInProgress.set(false);
        this.form.markAllAsTouched();
        this.handleResetError(err);
      },
    });
  }

  private handleResetError(err: unknown): void {
    const isFr = this.localeService.locale() === 'fr';
    const generic = isFr
      ? 'Une erreur est survenue lors de la réinitialisation. Réessayez plus tard.'
      : 'An error occurred while resetting your password. Please try again later.';

    if (err instanceof HttpErrorResponse) {
      const status = err.status;
      const body: any = err.error;
      const msg = (typeof body === 'string' ? body : body?.message || body?.error || '') as string;

      const isInvalidOrExpired =
        status === 400 || status === 404 || status === 422 || /expired|invalid/i.test(msg);

      if (isInvalidOrExpired) {
        this.formError.set(this.tokenInvalidText());
        return;
      }

      this.formError.set(generic);
      return;
    }

    this.formError.set(generic);
  }

  getNewPasswordError(): string {
    const control = this.controls.new_password;
    if (!control.errors) return '';
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
    if (!control.errors) return '';
    if (control.errors['required']) {
      return isFr ? 'Confirmation obligatoire' : 'Confirmation is required';
    }
    if (control.errors['mismatch']) {
      return isFr ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match';
    }
    return isFr ? 'Confirmation invalide' : 'Invalid confirmation';
  }

  private shouldShowError(controlName: keyof typeof this.controls): boolean {
    const control = this.controls[controlName];
    return control.invalid && (control.touched || this.submitAttempted());
  }
}
