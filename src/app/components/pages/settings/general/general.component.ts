import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocaleService } from '../../../../core/services/locale.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { SettingsService } from '../../../../core/services/settings.service';
import { SpotifyService } from '../../../../core/services/spotify.service';

@Component({
  selector: 'app-general',
  imports: [ButtonComponent],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralComponent {
  private readonly localeService = inject(LocaleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly settingsService = inject(SettingsService);
  private readonly spotifyService = inject(SpotifyService);

  readonly hexInputRef = viewChild<ElementRef<HTMLInputElement>>('hexInput');
  readonly isSpotifyConfigured = signal(false);
  readonly isSpotifyConnected = signal(false);
  readonly defaultColor = signal('#25d865');
  readonly savedColor = signal('#25d865');
  readonly initialDefaultColor = '#25d865';
  readonly spotifyClientId = signal('');
  readonly spotifyClientSecret = signal('');
  readonly showClientSecret = signal(false);
  readonly isSavingSpotify = signal(false);
  readonly saveSpotifyError = signal<string | null>(null);
  readonly saveSpotifySuccess = signal<boolean | null>(null);
  private readonly origin = signal<string>('#');
  readonly redirectUri = computed(() => {
    const base = this.origin();
    // Fallback à l'URL publique si rendu SSR
    return base === '#'
      ? 'https://melodyhue.com/auth/spotify/callback'
      : `${base}/auth/spotify/callback`;
  });
  readonly hexInputError = signal<string | null>(null);

  readonly hasColorChanges = computed(() => this.defaultColor() !== this.savedColor());

  constructor() {
    // Synchronize input value when defaultColor changes (only in browser)
    if (this.isBrowser) {
      // Initialiser la base comme dans API
      this.origin.set(window.location.origin);
      effect(() => {
        const hexInput = this.hexInputRef()?.nativeElement;
        const currentColor = this.defaultColor();
        if (hexInput && hexInput !== document.activeElement) {
          hexInput.value = currentColor.substring(1);
        }
      });
    }

    // Charger l'état Spotify (présence des credentials)
    this.spotifyService.getCredentialsStatus().subscribe({
      next: (s) => {
        // Configuré si au moins client_id + client_secret sont présents
        this.isSpotifyConfigured.set(!!(s.has_client_id && s.has_client_secret));
        // Connecté si un refresh_token est présent côté backend
        this.isSpotifyConnected.set(!!s.has_refresh_token);
      },
      error: () => {
        // En cas d'erreur d'auth (401/403), ne pas faire planter la page et considérer non configuré/non connecté
        this.isSpotifyConfigured.set(false);
        this.isSpotifyConnected.set(false);
      },
    });

    // Charger les settings depuis l'API
    this.settingsService.getSettings().subscribe({
      next: (s: any) => {
        // Priorité: default_overlay_color (#hex). Compat: overlay_default_color (#hex) ou overlay_default_color_hex (sans #)
        const raw =
          typeof s?.default_overlay_color === 'string'
            ? (s.default_overlay_color as string)
            : typeof s?.overlay_default_color === 'string'
            ? (s.overlay_default_color as string)
            : typeof s?.overlay_default_color_hex === 'string'
            ? (s.overlay_default_color_hex as string)
            : '';
        const normalized = this.normalizeHexColor(raw, this.initialDefaultColor);
        this.defaultColor.set(normalized);
        this.savedColor.set(normalized);
      },
      error: () => {
        // fallback: garder la valeur par défaut
      },
    });
  }

  private normalizeHexColor(input: string, fallback: string): string {
    if (!input) return fallback;
    const v = input.trim();
    const hex = v.startsWith('#') ? v.slice(1) : v;
    return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : fallback;
  }

  private toRawHex(colorWithHash: string): string {
    const v = (colorWithHash || '').trim();
    return (v.startsWith('#') ? v.slice(1) : v).toLowerCase();
  }

  readonly content = computed(() => {
    const locale = this.localeService.locale();
    return {
      title: locale === 'fr' ? 'Paramètres généraux' : 'General Settings',
      spotify: {
        title: locale === 'fr' ? 'Connexion Spotify' : 'Spotify Connection',
        description:
          locale === 'fr'
            ? 'Configurez votre application Spotify Developer pour afficher votre musique en temps réel'
            : 'Configure your Spotify Developer app to display your music in real-time',
        setupGuide:
          locale === 'fr'
            ? 'Pour configurer, créez une application sur'
            : 'To configure, create an app on',
        dashboardLink: 'Spotify Developer Dashboard',
        clientIdLabel: locale === 'fr' ? 'Client ID' : 'Client ID',
        clientSecretLabel: locale === 'fr' ? 'Client Secret' : 'Client Secret',
        redirectUriLabel:
          locale === 'fr'
            ? 'Redirect URI (à copier dans votre dashboard Spotify)'
            : 'Redirect URI (copy to your Spotify dashboard)',
        show: locale === 'fr' ? 'Afficher' : 'Show',
        hide: locale === 'fr' ? 'Masquer' : 'Hide',
        copy: locale === 'fr' ? 'Copier' : 'Copy',
        copied: locale === 'fr' ? 'Copié !' : 'Copied!',
        save: locale === 'fr' ? 'Enregistrer la configuration' : 'Save Configuration',
        connect: locale === 'fr' ? 'Connecter à Spotify' : 'Connect to Spotify',
        disconnect: locale === 'fr' ? 'Déconnecter' : 'Disconnect',
        reconfigure: locale === 'fr' ? 'Reconfigurer' : 'Reconfigure',
        connected: locale === 'fr' ? 'Connecté' : 'Connected',
        configured: locale === 'fr' ? 'Configuré' : 'Configured',
        notConfigured: locale === 'fr' ? 'Non configuré' : 'Not configured',
      },
      overlay: {
        title: locale === 'fr' ? 'Couleur par défaut des overlays' : 'Default Overlay Color',
        description:
          locale === 'fr'
            ? "Choisissez la couleur utilisée quand aucune musique n'est en lecture"
            : 'Choose the color used when no music is playing',
        label: locale === 'fr' ? 'Couleur' : 'Color',
        save: locale === 'fr' ? 'Enregistrer' : 'Save',
        reset: locale === 'fr' ? 'Réinitialiser' : 'Reset to Default',
        cancel: locale === 'fr' ? 'Annuler' : 'Cancel',
        invalidHex:
          locale === 'fr'
            ? 'Code couleur invalide. Utilisez exactement 6 caractères hexadécimaux (0-9, A-F)'
            : 'Invalid color code. Use exactly 6 hexadecimal characters (0-9, A-F)',
      },
    };
  });

  toggleClientSecretVisibility(): void {
    this.showClientSecret.update((v) => !v);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    // TODO: Afficher un toast "Copié !"
  }

  saveSpotifyConfig(): void {
    this.saveSpotifyError.set(null);
    this.saveSpotifySuccess.set(null);
    const payload: { client_id?: string; client_secret?: string } = {};
    const id = (this.spotifyClientId() || '').trim();
    const secret = (this.spotifyClientSecret() || '').trim();
    if (id) payload.client_id = id;
    if (secret) payload.client_secret = secret;
    if (!payload.client_id && !payload.client_secret) return;

    this.isSavingSpotify.set(true);
    this.spotifyService.updateCredentials(payload).subscribe({
      next: () => {
        // Marquer comme configuré si on a bien les deux ou si ils étaient déjà présents (un refresh status le confirmera)
        this.spotifyService.getCredentialsStatus().subscribe({
          next: (s) => {
            this.isSpotifyConfigured.set(!!(s.has_client_id && s.has_client_secret));
            this.saveSpotifySuccess.set(true);
            this.isSavingSpotify.set(false);
          },
          error: () => {
            // Même si la sauvegarde a réussi, si le status échoue on ne bloque pas l'UX
            this.saveSpotifySuccess.set(true);
            this.isSavingSpotify.set(false);
          },
        });
        // Nettoyer le champ secret de l'UI par sécurité
        this.spotifyClientSecret.set('');
      },
      error: (err) => {
        const msg =
          (err?.error && (err.error.message || err.error.error || err.error.detail)) ||
          err?.message ||
          'Impossible d’enregistrer la configuration Spotify.';
        this.saveSpotifyError.set(String(msg));
        this.isSavingSpotify.set(false);
      },
    });
  }

  connectSpotify(): void {
    // Récupérer l'URL d'auth côté backend (qui met à jour le redirect_uri si fourni)
    const redirectUri = this.redirectUri();
    this.spotifyService.getAuthUrl(redirectUri).subscribe({
      next: (res: { url: string }) => {
        if (res?.url) {
          window.location.href = res.url;
        }
      },
    });
  }

  disconnectSpotify(): void {
    // TODO: Déconnecter et supprimer la config
    this.isSpotifyConnected.set(false);
    this.isSpotifyConfigured.set(false);
    this.spotifyClientId.set('');
    this.spotifyClientSecret.set('');
  }

  reconfigureSpotify(): void {
    this.isSpotifyConfigured.set(false);
    this.isSpotifyConnected.set(false);
  }

  updateDefaultColor(color: string): void {
    this.defaultColor.set(color);
  }

  saveDefaultColor(): void {
    // Normaliser la valeur (#rrggbb en minuscule)
    const normalized = this.normalizeHexColor(this.defaultColor(), this.initialDefaultColor);
    // Envoyer uniquement la clé attendue par le backend
    this.settingsService.updateSettings({ default_overlay_color: normalized }).subscribe({
      next: () => {
        // Ne mettre à jour l'état "sauvé" qu'après succès API
        this.savedColor.set(normalized);
        // S'assurer que l'affichage reflète la normalisation
        this.defaultColor.set(normalized);
      },
    });
  }

  resetDefaultColor(): void {
    // Mettre à jour l'UI tout de suite, mais ne valider "sauvé" qu'après succès
    this.defaultColor.set(this.initialDefaultColor);
    this.settingsService
      .updateSettings({ default_overlay_color: this.initialDefaultColor })
      .subscribe({
        next: () => this.savedColor.set(this.initialDefaultColor),
      });
  }

  deleteDefaultColor(): void {
    // Revenir à la couleur sauvegardée (annuler les changements non sauvegardés)
    this.defaultColor.set(this.savedColor());
  }

  onHexKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    // Allow control keys (backspace, delete, arrows, tab, etc.)
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'Tab' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Home' ||
      key === 'End' ||
      key === 'Enter' ||
      key === 'Escape'
    ) {
      return;
    }

    // Convert to uppercase for comparison
    const upperKey = key.toUpperCase();

    // Only allow 0-9 and A-F (single character)
    if (key.length === 1) {
      const isValid = /^[0-9A-F]$/.test(upperKey);
      if (!isValid) {
        event.preventDefault();
        return;
      }
    }
  }

  onHexBeforeInput(event: InputEvent): void {
    const data = event.data;

    // If there's data being inserted, validate it
    if (data) {
      const upperData = data.toUpperCase();
      const isValid = /^[0-9A-F]+$/.test(upperData);

      if (!isValid) {
        event.preventDefault();
        return;
      }
    }
  }

  onHexPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const cleanHex = pastedText.replace('#', '').toUpperCase();

    // Only paste if it's valid hex
    if (/^[0-9A-F]{1,6}$/.test(cleanHex)) {
      const input = event.target as HTMLInputElement;
      const finalHex = cleanHex.substring(0, 6);
      input.value = finalHex;
      this.updateDefaultColorFromHex(finalHex, input);
    }
  }

  updateDefaultColorFromHex(hex: string, inputElement?: HTMLInputElement): void {
    // Remove # if present and convert to uppercase
    let cleanHex = hex.replace('#', '').toUpperCase();

    // Filter out any invalid characters
    cleanHex = cleanHex.replace(/[^0-9A-F]/g, '');

    // Limit to 6 characters
    cleanHex = cleanHex.substring(0, 6);

    // Update the input value to the cleaned version
    if (inputElement && inputElement.value !== cleanHex) {
      inputElement.value = cleanHex;
    }

    // Check if it's a valid hex
    if (/^[0-9A-F]{0,6}$/.test(cleanHex)) {
      // Clear error if valid characters
      this.hexInputError.set(null);

      // Only update the color if it's a complete 6-character hex
      if (cleanHex.length === 6) {
        this.defaultColor.set(`#${cleanHex}`);
      }
    } else {
      // Invalid characters
      this.hexInputError.set(this.content().overlay.invalidHex);
    }
  }

  validateHexColor(hex: string): void {
    const cleanHex = hex.replace('#', '').toUpperCase();

    // Only accept 6-character hex on blur
    if (!/^[0-9A-F]{6}$/.test(cleanHex)) {
      this.hexInputError.set(this.content().overlay.invalidHex);
      // Keep current color
      const currentHex = this.defaultColor().substring(1);
      // Force re-render by updating the input value
      const input = document.querySelector('.general__input--hex') as HTMLInputElement;
      if (input) {
        input.value = currentHex;
      }
    } else {
      this.hexInputError.set(null);
      // Apply the valid color
      this.defaultColor.set(`#${cleanHex}`);
    }
  }
}
