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
    password: ['', [Validators.required]],
    rememberMe: [true],
  });

  readonly controls = this.form.controls;

  readonly canShowFormError = computed(() => this.shouldShowFormError());

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

        // Simuler la réponse d'authentification avec le rôle utilisateur
        // En production, ces données viendraient du serveur d'authentification
        const userRole = this.getUserRole(this.controls.email.value);

        // TODO: Récupérer ces infos depuis le backend après authentification
        // Placeholder 2FA: on suppose que l'utilisateur a activé la 2FA côté serveur.
        const twoFactorEnabled = true; // placeholder à remplacer par la valeur serveur
        const tokenPayload = {
          session: expiration,
          createdAt: new Date().toISOString(),
          role: userRole,
          email: this.controls.email.value,
          twoFactorEnabled,
          twoFactorVerified: false, // sera mis à true après OTP
        } as const;

        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(tokenPayload));
      }

      // Redirection conditionnelle selon la 2FA
      const stored = this.isBrowser ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
      let goToOtp = false;
      try {
        const parsed = stored ? JSON.parse(stored) : null;
        goToOtp = !!(parsed?.twoFactorEnabled && !parsed?.twoFactorVerified);
      } catch {
        // ignore: si parsing échoue, on considère pas de 2FA
      }

      this.submissionInProgress.set(false);
      if (goToOtp) {
        this.router.navigateByUrl('/auth/login/otp');
      } else {
        this.router.navigateByUrl('/profile');
      }
    });
  }

  private shouldShowFormError(): boolean {
    const emailControl = this.controls.email;
    const passwordControl = this.controls.password;
    return (
      (emailControl.invalid || passwordControl.invalid) &&
      (emailControl.touched || passwordControl.touched || this.submitAttempted())
    );
  }

  getFormErrorMessage(): string {
    const isFr = this.localeService.locale() === 'fr';
    return isFr ? 'Email ou mot de passe invalide' : 'Invalid email or password';
  }

  private getUserRole(email: string): 'admin' | 'user' | 'moderator' {
    // TODO: Récupérer le rôle depuis le backend après authentification
    // Placeholder temporaire - en attente de l'intégration backend
    return 'user'; // Par défaut, tous les utilisateurs auront le rôle 'user'
  }
}
