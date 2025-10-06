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

@Component({
  selector: 'app-general',
  imports: [],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralComponent {
  private readonly localeService = inject(LocaleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly hexInputRef = viewChild<ElementRef<HTMLInputElement>>('hexInput');
  readonly isSpotifyConfigured = signal(false);
  readonly isSpotifyConnected = signal(false);
  readonly defaultColor = signal('#0a3228');
  readonly savedColor = signal('#0a3228');
  readonly initialDefaultColor = '#0a3228';
  readonly spotifyClientId = signal('');
  readonly spotifyClientSecret = signal('');
  readonly showClientSecret = signal(false);
  readonly redirectUri = 'https://melodyhue.com/auth/spotify/callback';
  readonly hexInputError = signal<string | null>(null);

  readonly hasColorChanges = computed(() => this.defaultColor() !== this.savedColor());

  constructor() {
    // Synchronize input value when defaultColor changes (only in browser)
    if (this.isBrowser) {
      effect(() => {
        const hexInput = this.hexInputRef()?.nativeElement;
        const currentColor = this.defaultColor();
        if (hexInput && hexInput !== document.activeElement) {
          hexInput.value = currentColor.substring(1);
        }
      });
    }
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
        delete: locale === 'fr' ? 'Supprimer' : 'Delete',
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
    // TODO: Valider et sauvegarder la config Spotify
    console.log('Save Spotify config', {
      clientId: this.spotifyClientId(),
      clientSecret: this.spotifyClientSecret(),
    });
    this.isSpotifyConfigured.set(true);
  }

  connectSpotify(): void {
    // TODO: Rediriger vers Spotify OAuth
    const clientId = this.spotifyClientId();
    const redirectUri = encodeURIComponent(this.redirectUri);
    const scopes = encodeURIComponent('user-read-currently-playing user-read-playback-state');
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;

    window.location.href = spotifyAuthUrl;
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
    this.savedColor.set(this.defaultColor());
    // TODO: Sauvegarder la couleur sur le serveur
    console.log('Save color:', this.defaultColor());
  }

  resetDefaultColor(): void {
    this.defaultColor.set(this.initialDefaultColor);
    this.savedColor.set(this.initialDefaultColor);
    // TODO: Réinitialiser la couleur sur le serveur
    console.log('Reset color to default');
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
