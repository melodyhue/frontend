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
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_TICKET_STORAGE_KEY,
} from '../../../../core/constants/storage-keys';
import { LocaleService } from '../../../../core/services/locale.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

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
  private readonly authService = inject(AuthService);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);
  readonly errorMessage = signal<string>('');

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
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.submissionInProgress()) {
      return;
    }

    this.submissionInProgress.set(true);

    // Préférences de session
    const sessionPref = this.controls.rememberMe.value ? 'persistent' : 'session';
    if (this.isBrowser) {
      try {
        window.localStorage.setItem(AUTH_TICKET_STORAGE_KEY, '');
      } catch {}
    }
    this.authService.storeSessionPreference(sessionPref);

    // Appel API: login step 1
    const payload = {
      username_or_email: this.controls.email.value,
      password: this.controls.password.value,
    } as const;

    this.authService.loginStep1(payload).subscribe({
      next: (res) => {
        this.errorMessage.set('');
        const maybeAny = res as any;
        // Si des tokens sont déjà présents (nouveau backend), on les stocke et on va au profil
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
          this.submissionInProgress.set(false);
          this.router.navigateByUrl('/profile');
          return;
        }

        // Sinon, flux historique avec ticket/2FA
        const requires2fa = !!maybeAny?.requires_2fa;
        const ticket = maybeAny?.ticket ?? null;
        this.authService.storeTicket(ticket);
        this.submissionInProgress.set(false);
        if (requires2fa) {
          this.router.navigateByUrl('/auth/login/otp');
        } else {
          this.router.navigateByUrl('/profile');
        }
      },
      error: (err) => {
        this.submissionInProgress.set(false);
        this.form.markAllAsTouched();
        const status = err?.status ?? 0;
        const apiMsg: string | undefined =
          typeof err?.error === 'string'
            ? err.error
            : typeof err?.error?.message === 'string'
            ? err.error.message
            : undefined;
        const isFr = this.localeService.locale() === 'fr';
        let msg = apiMsg;
        if (!msg) {
          if (status === 0) {
            msg = isFr
              ? 'Impossible de joindre le serveur. Vérifiez votre connexion.'
              : 'Cannot reach server. Check your connection.';
          } else if (status === 400 || status === 401) {
            msg = isFr ? 'Email ou mot de passe incorrect.' : 'Incorrect email or password.';
          } else if (status === 403) {
            msg = isFr ? 'Accès refusé.' : 'Access denied.';
          } else if (status === 429) {
            msg = isFr
              ? 'Trop de tentatives, réessayez plus tard.'
              : 'Too many attempts, try later.';
          } else if (status >= 500) {
            msg = isFr ? 'Erreur serveur. Réessayez plus tard.' : 'Server error. Please try later.';
          } else {
            msg = isFr ? 'Une erreur est survenue.' : 'An error occurred.';
          }
        }
        this.errorMessage.set(msg);
      },
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
