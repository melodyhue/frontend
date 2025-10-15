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
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_TICKET_STORAGE_KEY,
} from '../../../../core/constants/storage-keys';
import { LocaleService } from '../../../../core/services/locale.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { RealtimeService } from '../../../../core/services/realtime.service';

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
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly localeService = inject(LocaleService);
  private readonly authService = inject(AuthService);
  private readonly realtime = inject(RealtimeService);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);
  readonly errorMessage = signal<string>('');
  readonly noticeMessage = signal<string>('');

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

  constructor() {
    // Afficher un message si redirigé avec motif "banned"
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'banned') {
      const isFr = this.localeService.locale() === 'fr';
      this.noticeMessage.set(isFr ? 'Compte banni' : 'Account banned');
    }
  }

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
          // S'assurer qu'aucun ticket n'est conservé (pas de 2FA à suivre)
          this.authService.storeTicket(null);
          this.authService.storeLoginTokens({
            access_token: maybeAny.access_token,
            refresh_token: maybeAny.refresh_token,
            token_type: maybeAny.token_type,
            requires_2fa: maybeAny.requires_2fa,
            ticket: maybeAny.ticket,
            user_id: maybeAny.user_id,
          });
          this.submissionInProgress.set(false);
          // WS après login
          this.realtime.start();
          this.router.navigateByUrl('/profile');
          return;
        }

        // Sinon, flux historique avec ticket/2FA
        const requires2fa = Boolean(
          maybeAny?.requires_2fa ||
            maybeAny?.two_factor_required ||
            maybeAny?.twofa_required ||
            maybeAny?.otp_required ||
            maybeAny?.['2fa_required']
        );
        const ticket =
          (typeof maybeAny?.ticket === 'string' && maybeAny.ticket) ||
          (typeof maybeAny?.twofa_ticket === 'string' && maybeAny.twofa_ticket) ||
          (typeof maybeAny?.otp_ticket === 'string' && maybeAny.otp_ticket) ||
          (typeof maybeAny?.['2fa_ticket'] === 'string' && maybeAny['2fa_ticket']) ||
          (typeof maybeAny?.login_ticket === 'string' && maybeAny.login_ticket) ||
          (typeof maybeAny?.session_ticket === 'string' && maybeAny.session_ticket) ||
          (typeof maybeAny?.data?.ticket === 'string' && maybeAny.data.ticket) ||
          null;
        this.authService.storeTicket(ticket);
        if (requires2fa) {
          this.submissionInProgress.set(false);
          // Passer aussi le ticket dans l'URL et dans l'état de navigation pour plus de robustesse
          if (ticket) {
            this.router.navigate(['/auth/login/otp'], {
              queryParams: { ticket },
              state: { ticket },
            });
          } else {
            this.router.navigateByUrl('/auth/login/otp');
          }
        } else {
          // Aucun 2FA requis: s'assurer qu'aucun ticket n'est stocké
          this.authService.storeTicket(null);
          // Cas sans 2FA et sans tokens dans la réponse: on force un refresh via cookie
          // pour récupérer un access_token en mémoire AVANT de router, afin d'éviter
          // la redirection immédiate du guard vers /login.
          this.authService.refreshWithCookie().subscribe({
            next: (tokens) => {
              this.authService.storeTokenPair(tokens);
              this.submissionInProgress.set(false);
              // WS après login
              this.realtime.start();
              this.router.navigateByUrl('/profile');
            },
            error: () => {
              // Si le refresh échoue, on affiche une erreur au lieu de boucler
              this.submissionInProgress.set(false);
              this.errorMessage.set(
                'Impossible de terminer la connexion. Veuillez réessayer ou vérifier les cookies.'
              );
            },
          });
        }
      },
      error: (err) => {
        this.submissionInProgress.set(false);
        this.form.markAllAsTouched();
        const status = Number((err as any)?.status) || 0;
        let apiMsg: string | undefined;
        if (err instanceof HttpErrorResponse) {
          const body: any = err.error;
          // Cas classique JSON
          const pickFromObject = (obj: any): string | undefined => {
            const detail =
              typeof obj === 'object' ? (obj?.detail as string | undefined) : undefined;
            const message =
              typeof obj === 'object' ? (obj?.message as string | undefined) : undefined;
            const errorText =
              typeof obj === 'object' ? (obj?.error as string | undefined) : undefined;
            return [detail, message, errorText].find(
              (v) => typeof v === 'string' && v.trim().length > 0
            ) as string | undefined;
          };

          apiMsg = pickFromObject(body);
          if (!apiMsg && typeof body === 'string') {
            apiMsg = body;
          }

          // Si le serveur renvoie un Blob (mauvais content-type, CORS), tenter une lecture texte
          if (!apiMsg && body instanceof Blob) {
            try {
              // Lecture asynchrone; on mettra à jour le message ensuite
              new Response(body)
                .text()
                .then((txt) => {
                  let parsed: any = null;
                  try {
                    parsed = JSON.parse(txt);
                  } catch {
                    // pas du JSON, on garde le texte brut
                  }
                  const fromParsed = parsed ? pickFromObject(parsed) : undefined;
                  const finalMsg = (fromParsed && fromParsed.trim()) || (txt && txt.trim()) || '';
                  // Ne pas écraser le message standardisé 400/401/422
                  if (finalMsg && status !== 400 && status !== 401 && status !== 422) {
                    this.errorMessage.set(finalMsg);
                  }
                })
                .catch(() => {});
            } catch {}
          }
        }
        const isFr = this.localeService.locale() === 'fr';
        let msg: string | undefined;
        // 400/401/422: toujours un message standardisé (ne pas afficher le detail brut)
        if (status === 400 || status === 401 || status === 422) {
          msg = isFr ? 'Email ou mot de passe incorrect' : 'Incorrect email or password';
        } else if (!apiMsg) {
          if (status === 0) {
            msg = isFr
              ? 'Impossible de joindre le serveur. Vérifiez votre connexion.'
              : 'Cannot reach server. Check your connection.';
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
        } else {
          // Pour les autres statuts, si l'API fournit un message, on le réutilise
          msg = apiMsg;
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
