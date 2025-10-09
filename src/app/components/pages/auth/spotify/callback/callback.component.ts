import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyService } from '../../../../../core/services/spotify.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly spotify = inject(SpotifyService);

  readonly loading = signal(true);
  readonly success = signal<boolean | null>(null);
  readonly message = signal('');

  readonly code = computed(() => this.route.snapshot.queryParamMap.get('code') || '');
  readonly redirectUri = computed(
    () => this.route.snapshot.queryParamMap.get('redirect_uri') || ''
  );

  constructor() {
    const code = this.code();
    const redirectUri = this.redirectUri() || undefined;
    if (!code) {
      this.success.set(false);
      this.message.set('Missing authorization code');
      this.loading.set(false);
      return;
    }

    this.spotify.handleCallback(code, redirectUri).subscribe({
      next: () => {
        this.success.set(true);
        this.message.set('Spotify authorized successfully.');
        this.loading.set(false);
        // Optionnel: rediriger après un court délai
        setTimeout(() => this.router.navigate(['/settings/general']), 1200);
      },
      error: (err) => {
        console.error(err);
        this.success.set(false);
        this.message.set('Spotify authorization failed.');
        this.loading.set(false);
      },
    });
  }
}
