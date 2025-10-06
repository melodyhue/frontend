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

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);

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

    if (control.errors['required']) {
      return 'Adresse e-mail obligatoire';
    }

    if (control.errors['email']) {
      return 'Adresse e-mail invalide';
    }

    return 'Adresse e-mail invalide';
  }

  getPasswordErrorMessage(): string {
    const control = this.controls.password;
    if (!control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Mot de passe obligatoire';
    }

    if (control.errors['minlength']) {
      return 'Au moins 8 caractères requis';
    }

    return 'Mot de passe invalide';
  }
}
