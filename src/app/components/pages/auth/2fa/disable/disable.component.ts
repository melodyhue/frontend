import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-disable',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  templateUrl: './disable.component.html',
  styleUrl: './disable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisableComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  readonly emailToken = signal<string | null>(null);
  readonly tokenFromUrl = signal(false);

  readonly formTotp = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  readonly formEmail = this.fb.nonNullable.group({
    token: [''],
  });

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.tokenFromUrl.set(true);
      this.emailToken.set(token);
      this.formEmail.controls.token.setValue(token);
      this.info.set('Ce lien te permet de désactiver la 2FA sans code. Confirme pour continuer.');
    }
  }

  disableWithCode() {
    if (this.formTotp.invalid || this.loading()) {
      this.formTotp.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const code = this.formTotp.controls.code.value;
    this.auth.twoFADisableWithCode(code).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/profile/security');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Code TOTP invalide.');
      },
    });
  }

  requestEmail() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.info.set('');
    this.auth.twoFADisableRequest().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.token) {
          // Mode debug: l’API renvoie le token directement
          this.emailToken.set(res.token);
          this.info.set('EMAIL_DEBUG actif: token reçu. Vous pouvez confirmer ci-dessous.');
        } else {
          this.info.set('Email envoyé. Consulte ta boîte mail pour confirmer.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Impossible d'envoyer l'email.");
      },
    });
  }

  confirmEmail() {
    if (this.loading()) return;
    const token = this.formEmail.controls.token.value || this.emailToken();
    if (!token) {
      this.error.set('Token manquant.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.twoFADisableConfirm(token).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/profile/security');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Token invalide ou expiré.');
      },
    });
  }
}
