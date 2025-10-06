import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-privacy',
  imports: [],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  private readonly localeService = inject(LocaleService);
  private readonly location = inject(Location);

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy';
  });

  readonly lastUpdated = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? 'Dernière mise à jour : 6 octobre 2025'
      : 'Last updated: October 6, 2025';
  });

  readonly content = computed(() => {
    const locale = this.localeService.locale();

    if (locale === 'fr') {
      return {
        sections: [
          {
            title: '1. Collecte des informations',
            content:
              "MelodyHue collecte uniquement les informations nécessaires à son fonctionnement : votre identifiant Spotify, les informations de lecture en cours (titre, artiste, pochette) et vos préférences d'overlay. Vos préférences d'overlay (thème, position, animations, etc.) sont stockées dans notre base de données pour être accessibles depuis OBS, XSplit et autres logiciels de streaming. Nous récupérons également la couleur dominante des pochettes d'albums pour l'affichage.",
          },
          {
            title: '2. Utilisation des informations',
            content:
              "Vos informations sont utilisées exclusivement pour afficher vos overlays en temps réel dans votre logiciel de streaming. Nous ne stockons pas votre historique d'écoute. Les données de lecture sont traitées en temps réel et ne sont pas conservées après la fin de votre session. Seules vos préférences d'overlay sont conservées dans notre base de données.",
          },
          {
            title: '3. Intégration Spotify',
            content:
              "MelodyHue se connecte à l'API Spotify pour récupérer vos informations de lecture en temps réel. Nous ne partageons jamais vos données Spotify avec des tiers. Vos tokens d'authentification Spotify et votre identifiant Spotify sont stockés de manière chiffrée dans notre base de données et ne sont jamais exposés.",
          },
          {
            title: '4. Partage des informations',
            content:
              'Nous ne vendons, ne louons ni ne partageons vos informations personnelles avec des tiers. Les données affichées dans vos overlays sont visibles uniquement dans votre logiciel de streaming (OBS, XSplit, etc.).',
          },
          {
            title: '5. Cookies et stockage local',
            content:
              "MelodyHue utilise le stockage local de votre navigateur pour mémoriser votre session utilisateur. Votre mot de passe, vos tokens d'authentification Spotify, votre identifiant Spotify et vos préférences d'overlay sont stockés de manière chiffrée dans notre base de données afin d'être accessibles depuis OBS, XSplit et autres logiciels de streaming.",
          },
          {
            title: '6. Sécurité des données',
            content:
              "Nous utilisons des protocoles de sécurité avancés pour protéger vos informations. Toutes les communications avec l'API Spotify sont chiffrées via HTTPS. Vos mots de passe, tokens d'authentification Spotify et identifiants Spotify sont stockés de manière chiffrée dans notre base de données. Nous utilisons des algorithmes de chiffrement robustes pour garantir la sécurité de vos données sensibles.",
          },
          {
            title: '7. Conservation des données',
            content:
              "MelodyHue conserve vos préférences d'overlay, vos tokens Spotify chiffrés et votre mot de passe chiffré dans notre base de données tant que votre compte est actif. Les informations de lecture sont traitées en temps réel et ne sont pas stockées. Vous pouvez supprimer votre compte et toutes vos données à tout moment, ce qui effacera définitivement toutes vos informations de nos serveurs.",
          },
          {
            title: '8. Vos droits',
            content:
              "Vous pouvez à tout moment déconnecter votre compte Spotify, supprimer vos préférences d'overlay de notre base de données, supprimer votre compte, ou cesser d'utiliser MelodyHue. La déconnexion révoque immédiatement tous les accès à vos données Spotify. La suppression de compte efface définitivement toutes vos données de nos serveurs.",
          },
          {
            title: '9. Données tierces',
            content:
              "Les pochettes d'albums, titres et noms d'artistes affichés proviennent de Spotify et sont soumis à leur politique de confidentialité. MelodyHue ne modifie ni ne stocke ces données.",
          },
          {
            title: '10. Contact',
            content:
              'Pour toute question concernant cette politique de confidentialité, contactez-nous à privacy@melodyhue.com',
          },
        ],
      };
    } else {
      return {
        sections: [
          {
            title: '1. Information Collection',
            content:
              'MelodyHue collects only the information necessary for operation: your Spotify identifier, current playback information (title, artist, artwork) and your overlay preferences. Your overlay preferences (theme, position, animations, etc.) are stored in our database to be accessible from OBS, XSplit and other streaming software. We also extract dominant colors from album artwork for display.',
          },
          {
            title: '2. Use of Information',
            content:
              'Your information is used exclusively to display your overlays in real-time in your streaming software. We do not store your listening history. Playback data is processed in real-time and is not retained after your session ends. Only your overlay preferences are stored in our database.',
          },
          {
            title: '3. Spotify Integration',
            content:
              'MelodyHue connects to the Spotify API to retrieve your real-time playback information. We never share your Spotify data with third parties. Your Spotify authentication tokens and Spotify identifier are stored encrypted in our database and never exposed.',
          },
          {
            title: '4. Information Sharing',
            content:
              'We do not sell, rent or share your personal information with third parties. Data displayed in your overlays is visible only in your streaming software (OBS, XSplit, etc.).',
          },
          {
            title: '5. Cookies and Local Storage',
            content:
              "MelodyHue uses your browser's local storage to remember your user session. Your password, Spotify authentication tokens, Spotify identifier and overlay preferences are stored encrypted in our database to be accessible from OBS, XSplit and other streaming software.",
          },
          {
            title: '6. Data Security',
            content:
              'We use advanced security protocols to protect your information. All communications with the Spotify API are encrypted via HTTPS. Your passwords, Spotify authentication tokens and Spotify identifiers are stored encrypted in our database. We use robust encryption algorithms to ensure the security of your sensitive data.',
          },
          {
            title: '7. Data Retention',
            content:
              'MelodyHue retains your overlay preferences, encrypted Spotify tokens and encrypted password in our database as long as your account is active. Playback information is processed in real-time and not stored. You can delete your account and all your data at any time, which will permanently erase all your information from our servers.',
          },
          {
            title: '8. Your Rights',
            content:
              'You can disconnect your Spotify account, delete your overlay preferences from our database, delete your account, or stop using MelodyHue at any time. Disconnection immediately revokes all access to your Spotify data. Account deletion permanently erases all your data from our servers.',
          },
          {
            title: '9. Third-Party Data',
            content:
              'Album artwork, titles and artist names displayed come from Spotify and are subject to their privacy policy. MelodyHue does not modify or store this data.',
          },
          {
            title: '10. Contact',
            content:
              'For any questions regarding this privacy policy, contact us at privacy@melodyhue.com',
          },
        ],
      };
    }
  });

  readonly backLink = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Retour' : 'Back';
  });

  goBack(): void {
    this.location.back();
  }
}
