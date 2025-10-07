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

  // Mock data - à remplacer par un service
  readonly user = signal<UserProfile>({
    id: '1',
    username: 'Laxe4k',
    email: 'Laxe4k@hotmail.com',
    createdAt: new Date('2025-10-06'),
    spotifyConnected: false,
    avatarType: 'gravatar',
    avatarColor: '#0a3228',
  });

  readonly gravatarAvailable = signal<boolean>(false);
  readonly gravatarLoading = signal<boolean>(true);

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
    const email = this.user().email.toLowerCase().trim();
    const hash = md5(email);
    return `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
  });

  readonly initials = computed(() => {
    const username = this.user().username;
    return username.charAt(0).toUpperCase();
  });

  constructor() {
    // Vérifier si Gravatar est disponible
    effect(() => {
      const url = this.gravatarUrl();
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
    img.onload = () => {
      this.gravatarAvailable.set(true);
      this.gravatarLoading.set(false);
    };
    img.onerror = () => {
      this.gravatarAvailable.set(false);
      this.gravatarLoading.set(false);
      // Si Gravatar n'est pas disponible, forcer le type initials
      if (this.user().avatarType === 'gravatar') {
        this.user.update((u) => ({ ...u, avatarType: 'initials' }));
      }
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
