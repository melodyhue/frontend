import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as QRCode from 'qrcode';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-setup',
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupComponent {
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly secret = signal<string | null>(null);
  readonly otpauthUrl = signal<string | null>(null);
  readonly qrDataUrl = signal<string | null>(null);

  readonly hasData = computed(() => !!this.secret() && !!this.otpauthUrl());

  ngOnInit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.twoFASetup().subscribe({
      next: (data) => {
        this.secret.set(data.secret);
        this.otpauthUrl.set(data.otpauth_url);
        // Génération du QR code côté client uniquement
        if (isPlatformBrowser(this.platformId) && data.otpauth_url) {
          QRCode.toDataURL(data.otpauth_url, { errorCorrectionLevel: 'M', margin: 1 })
            .then((url: string) => this.qrDataUrl.set(url))
            .catch(() => this.error.set('Impossible de générer le QR code'));
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de récupérer la configuration 2FA');
        this.loading.set(false);
      },
    });
  }
}
