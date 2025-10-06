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

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);

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

    if (control.errors['required']) {
      return 'Pseudo obligatoire';
    }

    if (control.errors['minlength']) {
      return 'Minimum 3 caractères';
    }

    if (control.errors['maxlength']) {
      return 'Maximum 30 caractères';
    }

    return 'Pseudo invalide';
  }

  getEmailError(): string {
    const control = this.controls.email;
    if (!control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Adresse e-mail obligatoire';
    }

    if (control.errors['email']) {
      return 'Adresse e-mail invalide';
    }

    return 'Adresse e-mail invalide';
  }

  getPasswordError(): string {
    const control = this.controls.password;
    if (!control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Mot de passe obligatoire';
    }

    if (control.errors['minlength']) {
      return 'Minimum 8 caractères requis';
    }

    return 'Mot de passe invalide';
  }

  getConfirmPasswordError(): string {
    const control = this.controls.confirmPassword;
    if (this.passwordMismatch()) {
      return 'Les mots de passe ne correspondent pas';
    }

    if (!control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Confirmation obligatoire';
    }

    if (control.errors['mismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }

    return 'Confirmation invalide';
  }

  private shouldShowError(controlName: keyof typeof this.controls): boolean {
    const control = this.controls[controlName];
    return control.invalid && (control.touched || this.submitAttempted());
  }
}
