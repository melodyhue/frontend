import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-verify',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  get controls() {
    return this.form.controls;
  }

  onSubmit() {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const code = this.controls.code.value;
    this.auth.twoFAVerify({ code }).subscribe({
      next: () => {
        // Après vérification, l'API devrait avoir activé 2FA pour le compte.
        // On force un refresh (priorité body si refresh_token dispo)
        const rt = this.auth.getRefreshToken();
        const refresh$ = rt
          ? this.auth.refresh({ refresh_token: rt })
          : this.auth.refreshWithCookie();
        refresh$.subscribe({
          next: (tokens) => {
            this.auth.storeTokenPair(tokens);
            this.loading.set(false);
            this.router.navigateByUrl('/profile');
          },
          error: (err) => {
            this.loading.set(false);
            this.error.set('Vérification OK mais impossible de récupérer de nouveaux jetons.');
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Code invalide, réessaie.');
      },
    });
  }
}
