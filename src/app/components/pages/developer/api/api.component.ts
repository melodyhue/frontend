import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocaleService } from '../../../../core/services/locale.service';
import { PublicService } from '../../../../core/services/public.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-api',
  imports: [],
  templateUrl: './api.component.html',
  styleUrl: './api.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'api-page',
  },
})
export class ApiComponent {
  private readonly localeService = inject(LocaleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly publicService = inject(PublicService);
  private readonly authService = inject(AuthService);

  // Essayer de prendre l'ID utilisateur depuis l'état d’auth, sinon laisser vide
  readonly userId = signal<string>('');

  private readonly origin = signal<string>('#');

  constructor() {
    if (this.isBrowser) {
      // Eviter les erreurs SSR
      this.origin.set(window.location.origin);
      const state = this.authService.readAuthState();
      if (state?.user_id) {
        this.userId.set(state.user_id);
      }
    }
  }

  readonly labels = computed(() => {
    const locale = this.localeService.locale();
    return {
      title: locale === 'fr' ? 'API pour vos overlays' : 'API for your overlays',
      description:
        locale === 'fr'
          ? 'Utilisez ces URLs dans vos propres overlays pour récupérer les informations en temps réel.'
          : 'Use these URLs in your own overlays to fetch real-time information.',
      infosTitle: locale === 'fr' ? 'Informations' : 'Informations',
      infosDescription:
        locale === 'fr'
          ? 'Retourne les informations de lecture et les métadonnées complètes du morceau en cours, ainsi que la couleur dominante.'
          : 'Returns playback information and complete metadata of the current track, plus the dominant color.',
      colorTitle: locale === 'fr' ? 'Couleur' : 'Color',
      colorDescription:
        locale === 'fr'
          ? 'Retourne uniquement la couleur dominante avec les composantes RGB et le code hexadécimal.'
          : 'Returns only the dominant color with RGB components and hexadecimal code.',
      copy: locale === 'fr' ? 'Copier' : 'Copy',
      copied: locale === 'fr' ? 'Copié !' : 'Copied!',
      absoluteUrl: locale === 'fr' ? 'URL absolue' : 'Absolute URL',
      exampleTitle: locale === 'fr' ? 'Exemple de réponse' : 'Response example',
    } as const;
  });

  readonly absoluteUrls = computed(() => {
    const base = this.origin();
    return {
      infos: base === '#' ? '#' : `${base}/developer/api/${this.userId()}/infos`,
      color: base === '#' ? '#' : `${base}/developer/api/${this.userId()}/color`,
    } as const;
  });

  readonly infoSampleJson = computed(
    () => `{
  "color": {
    "r": 79,
    "g": 109,
    "b": 120,
    "hex": "#4f6d78"
  },
  "processing_time_ms": 69,
  "source": "album",
  "status": "success",
  "timestamp": 1759838521,
  "track": {
    "album": "Thriller",
    "artist": "Michael Jackson",
    "duration_ms": 294226,
    "id": "7J1uxwnxfQLu4APicE5Rnj",
    "image_url": "https://i.scdn.co/image/ab67616d0000b273de437d960dda1ac0a3586d97",
    "is_playing": true,
    "name": "Billie Jean",
    "progress_ms": 15517,
    "timestamp": 1759838521.30534
  },
  "user": "${this.userId()}"
}`
  );

  readonly colorSampleJson = computed(
    () => `{
  "color": {
    "r": 79,
    "g": 109,
    "b": 120,
    "hex": "#4f6d78"
  },
  "processing_time_ms": 69,
  "source": "album",
  "status": "success",
  "timestamp": 1759838521,
  "user": "${this.userId()}"
}`
  );

  readonly copyState = signal<'idle' | 'done'>('idle');

  async copyToClipboard(text: string): Promise<void> {
    if (!this.isBrowser) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copyState.set('done');
      setTimeout(() => this.copyState.set('idle'), 1200);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  }
}
