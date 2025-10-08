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
import { AUTH_TOKEN_STORAGE_KEY } from '../../../../../core/constants/storage-keys';
import { LocaleService } from '../../../../../core/services/locale.service';

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

  readonly submissionInProgress = signal(false);
  private readonly submitAttempted = signal(false);

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

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.submissionInProgress()) {
      return;
    }

    this.submissionInProgress.set(true);

    // Simulation de la vérification OTP côté serveur
    queueMicrotask(() => {
      if (this.isBrowser) {
        const code = this.codeValue();
        if (!/^\d{6}$/.test(code)) {
          this.submissionInProgress.set(false);
          this.form.markAllAsTouched();
          return;
        }
        try {
          const existing = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
          const now = new Date().toISOString();
          const parsed = existing ? JSON.parse(existing) : {};

          const updated = {
            ...parsed,
            twoFactorVerified: true,
            twoFactorVerifiedAt: now,
            twoFactorCodePreview: code,
          } as Record<string, unknown>;

          window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // En cas d’erreur de parsing, on repart sur un objet propre
          window.localStorage.setItem(
            AUTH_TOKEN_STORAGE_KEY,
            JSON.stringify({
              twoFactorVerified: true,
              twoFactorVerifiedAt: new Date().toISOString(),
            })
          );
        }
      }

      this.submissionInProgress.set(false);
      this.router.navigateByUrl('/profile');
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
