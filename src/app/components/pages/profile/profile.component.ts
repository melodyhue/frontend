import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { LocaleService } from '../../../core/services/locale.service';
import { md5 } from '../../../core/utils/md5.util';
import { ButtonComponent } from '../../shared/button/button.component';
import { UsersService } from '../../../core/services/users.service';
import { SettingsService } from '../../../core/services/settings.service';
import { SpotifyService } from '../../../core/services/spotify.service';

type AvatarType = 'gravatar' | 'initials';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  spotifyConnected: boolean;
  avatarType: AvatarType;
  avatarColor: string;
}

@Component({
  selector: 'app-profile',
  imports: [ButtonComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly usersService = inject(UsersService);
  private readonly spotifyService = inject(SpotifyService);
  private normalizeHexColor(input: unknown, fallback = '#0a3228'): string {
    const v = typeof input === 'string' ? input.trim() : '';
    if (!v) return fallback;
    const hex = v.startsWith('#') ? v : `#${v}`;
    return /^#?[0-9a-fA-F]{6}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(hex)
      ? hex.toLowerCase()
      : fallback;
  }
  private readonly settingsService = inject(SettingsService);

  // État utilisateur (chargé depuis l'API)
  readonly user = signal<UserProfile>({
    id: '',
    username: '',
    email: '',
    createdAt: new Date(),
    spotifyConnected: false,
    avatarType: 'gravatar',
    avatarColor: '#0a3228',
  });
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly gravatarAvailable = signal<boolean>(false);
  readonly gravatarLoading = signal<boolean>(true);
  readonly settingsLoading = signal<boolean>(true);

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Mon Profil' : 'My Profile';
  });

  readonly editButtonLabel = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Modifier le profil' : 'Edit profile';
  });

  readonly securityButtonLabel = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Sécurité' : 'Security';
  });

  readonly labels = computed(() => {
    const locale = this.localeService.locale();
    return {
      username: locale === 'fr' ? "Nom d'utilisateur" : 'Username',
      email: locale === 'fr' ? 'Email' : 'Email',
      memberSince: locale === 'fr' ? 'Membre depuis' : 'Member since',
      spotifyStatus: locale === 'fr' ? 'Compte Spotify' : 'Spotify Account',
      connected: locale === 'fr' ? 'Connecté' : 'Connected',
      notConnected: locale === 'fr' ? 'Non connecté' : 'Not connected',
    };
  });

  readonly gravatarUrl = computed(() => {
    const email = (this.user().email || '').toLowerCase().trim();
    if (!email) return '';
    const hash = md5(email).toLowerCase();
    return `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
  });

  readonly initials = computed(() => {
    const username = this.user().username;
    return username.charAt(0).toUpperCase();
  });

  constructor() {
    // Charger l'utilisateur depuis l'API puis, une fois authentifié, charger le statut Spotify
    this.usersService.me().subscribe({
      next: (u) => {
        const prev = this.user();
        this.user.set({
          ...prev,
          id: u.id,
          username: u.username,
          email: u.email,
          createdAt: new Date(u.created_at),
          spotifyConnected: false,
        });
        this.loading.set(false);

        // Appeler le statut Spotify après que l'auth soit confirmée (éventuel refresh déjà fait)
        this.spotifyService.getCredentialsStatus().subscribe({
          next: (s) => {
            this.user.update((ux) => ({ ...ux, spotifyConnected: !!s.has_refresh_token }));
          },
          error: () => {
            // Petit retry pour couvrir une course résiduelle
            setTimeout(() => {
              this.spotifyService.getCredentialsStatus().subscribe({
                next: (s2) => {
                  this.user.update((ux) => ({ ...ux, spotifyConnected: !!s2.has_refresh_token }));
                },
                error: () => {
                  this.user.update((ux) => ({ ...ux, spotifyConnected: false }));
                },
              });
            }, 400);
          },
        });
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });

    // Charger les paramètres d'avatar
    this.settingsService.getSettings().subscribe({
      next: (s: any) => {
        const rawMode =
          typeof s?.avatar_mode === 'string' ? (s.avatar_mode as string).toLowerCase() : '';
        const mode: AvatarType = rawMode === 'initials' ? 'initials' : 'gravatar';
        const color: string = this.normalizeHexColor(s?.avatar_color);
        this.user.update((u) => ({ ...u, avatarType: mode, avatarColor: color }));
        this.settingsLoading.set(false);
      },
      error: () => {
        this.settingsLoading.set(false);
      },
    });

    // (appel déplacé après usersService.me())

    // Vérifier si Gravatar est disponible lorsque mode=gravatar
    effect(() => {
      if (this.user().avatarType !== 'gravatar') {
        this.gravatarAvailable.set(false);
        this.gravatarLoading.set(false);
        return;
      }
      const url = this.gravatarUrl();
      if (!url) {
        // Email vide/invalide → pas de vérification, pas d'image
        this.gravatarAvailable.set(false);
        this.gravatarLoading.set(false);
        return;
      }
      this.checkGravatarAvailability(url);
    });
  }

  private checkGravatarAvailability(url: string): void {
    // Ne vérifier que côté navigateur
    if (!this.isBrowser) {
      this.gravatarLoading.set(false);
      return;
    }

    this.gravatarLoading.set(true);
    const img = new Image();
    const expectedMode = this.user().avatarType;
    img.onload = () => {
      // Ne pas écraser si l'utilisateur a changé de préférence entre-temps
      if (this.user().avatarType !== expectedMode) return;
      this.gravatarAvailable.set(true);
      this.gravatarLoading.set(false);
    };
    img.onerror = () => {
      if (this.user().avatarType !== expectedMode) return;
      this.gravatarAvailable.set(false);
      this.gravatarLoading.set(false);
      // Ne plus forcer le basculement en "initiales" ici
    };
    img.src = url;
  }

  formatDate(date: Date): string {
    const locale = this.localeService.locale();
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  editProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  goToSecurity(): void {
    this.router.navigate(['/profile/security']);
  }
}
