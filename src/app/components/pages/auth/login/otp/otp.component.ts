import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ButtonComponent } from '../../../../shared/button/button.component';
import {
  AUTH_TICKET_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from '../../../../../core/constants/storage-keys';
import { LocaleService } from '../../../../../core/services/locale.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-otp',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly localeService = inject(LocaleService);
  private readonly authService = inject(AuthService);

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);
  readonly errorMessage = signal<string>('');

  // Texte/i18n
  readonly title = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Vérification en deux étapes'
      : 'Two‑factor authentication'
  );

  readonly subtitle = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Entrez le code de vérification à 6 chiffres.'
      : 'Enter the 6‑digit verification code.'
  );

  readonly codeLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Code de vérification' : 'Verification code'
  );

  readonly submitButtonLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Vérifier' : 'Verify'
  );

  readonly submittingLabel = computed(() =>
    this.localeService.locale() === 'fr' ? 'Vérification…' : 'Verifying…'
  );

  readonly formDescription = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Saisissez le code reçu. Tous les champs sont obligatoires.'
      : 'Enter the received code. All fields are required.'
  );

  // Index 0..5 pour les cases
  readonly slots = [0, 1, 2, 3, 4, 5] as const;

  // Formulaire: 6 champs d0..d5, chacun 1 chiffre
  readonly form = this.fb.nonNullable.group({
    d0: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    d5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
  });

  readonly controls = this.form.controls;

  readonly canShowFormError = computed(() => this.shouldShowFormError());

  // Références vers les inputs pour le focus
  @ViewChildren('otpInput') private otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Code composé
  readonly codeValue = computed(() =>
    [
      this.controls.d0.value,
      this.controls.d1.value,
      this.controls.d2.value,
      this.controls.d3.value,
      this.controls.d4.value,
      this.controls.d5.value,
    ].join('')
  );

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

    const code = this.codeValue();
    if (!/^\d{6}$/.test(code)) {
      this.submissionInProgress.set(false);
      this.form.markAllAsTouched();
      return;
    }

    const ticket = this.authService.readTicket();
    if (!ticket) {
      this.submissionInProgress.set(false);
      this.form.markAllAsTouched();
      return;
    }

    this.authService.loginStep2Totp({ ticket, totp: code }).subscribe({
      next: (tokens) => {
        this.errorMessage.set('');
        this.authService.storeTokenPair(tokens);
        // Nettoyer le ticket
        if (this.isBrowser) {
          try {
            window.localStorage.removeItem(AUTH_TICKET_STORAGE_KEY);
          } catch {}
        }
        this.submissionInProgress.set(false);
        this.router.navigateByUrl('/profile');
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
            msg = isFr ? 'Code de vérification invalide.' : 'Invalid verification code.';
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
    const c = this.controls as any;
    const ctrls = [c.d0, c.d1, c.d2, c.d3, c.d4, c.d5];
    const invalid = ctrls.some((ctrl: any) => ctrl.invalid);
    const touched = ctrls.some((ctrl: any) => ctrl.touched);
    return invalid && (touched || this.submitAttempted());
  }

  getFormErrorMessage(): string {
    const isFr = this.localeService.locale() === 'fr';
    return isFr ? 'Code de vérification invalide' : 'Invalid verification code';
  }

  // Gestion interactions
  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = (input.value || '').replace(/\D/g, '');
    const digit = value.slice(-1);
    const ctrl = (this.controls as any)[`d${index}`];
    ctrl.setValue(digit ?? '');
    if (digit && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    const key = event.key;
    const ctrl = (this.controls as any)[`d${index}`];
    if (key === 'Backspace') {
      if (!ctrl.value && index > 0) {
        event.preventDefault();
        this.focusInput(index - 1);
      }
      return;
    }
    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
      return;
    }
    if (key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusInput(index + 1);
      return;
    }
  }

  onDigitPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;
    event.preventDefault();
    digits.forEach((d, idx) => {
      const i = Math.min(idx, 5);
      const ctrl = (this.controls as any)[`d${i}`];
      ctrl.setValue(d);
    });
    const lastIndex = Math.min(digits.length, 6) - 1;
    this.focusInput(lastIndex);
  }

  private focusInput(index: number): void {
    const el = this.otpInputs?.get(index)?.nativeElement;
    el?.focus();
    el?.select();
  }
}
