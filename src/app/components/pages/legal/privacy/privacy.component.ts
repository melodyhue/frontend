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
      ? 'Dernière mise à jour : 15 octobre 2025'
      : 'Last updated: October 15, 2025';
  });

  readonly content = computed(() => {
    const locale = this.localeService.locale();

    if (locale === 'fr') {
      return {
        sections: [
          {
            title: '1. Collecte des informations',
            content:
              "Nous collectons uniquement ce qui est nécessaire au fonctionnement du service : vos informations de compte (email, nom d'utilisateur), un mot de passe haché, vos préférences d'overlay (thème, position, style), vos sessions (jetons de rafraîchissement), et, si vous connectez Spotify, vos identifiants d'application et/ou votre jeton d'actualisation Spotify. Les informations de lecture en cours (titre, artiste, pochette) sont récupérées en temps réel via l'API Spotify et traitées à la volée. Nous calculons une couleur dominante à partir des pochettes uniquement pour l'affichage.",
          },
          {
            title: '2. Utilisation des informations',
            content:
              "Vos données servent à vous authentifier, configurer vos overlays et les afficher dans vos outils de streaming (OBS, XSplit, etc.). Nous ne stockons pas votre historique d'écoute. Les données de lecture sont traitées en temps réel et ne sont pas conservées après utilisation. Nous pouvons conserver des informations de modération (avertissements/bannissements) si des actions sont prises sur votre compte.",
          },
          {
            title: '3. Intégration Spotify',
            content:
              "MelodyHue se connecte à l'API Spotify pour récupérer vos informations de lecture en temps réel. Le client_id (non secret) peut être stocké en clair. Le client_secret et/ou le refresh_token sont chiffrés en base de données. Vous pouvez à tout moment déconnecter Spotify : nous effaçons alors le refresh_token de la base et la session Spotify en mémoire.",
          },
          {
            title: '4. Partage des informations',
            content:
              'Nous ne vendons, ne louons ni ne partageons vos informations personnelles avec des tiers. Les données affichées dans vos overlays sont visibles uniquement dans votre logiciel de streaming (OBS, XSplit, etc.).',
          },
          {
            title: '5. Cookies et stockage local',
            content:
              "Nous utilisons des cookies HttpOnly pour la session : mh_access_token (court terme, env. 15 minutes) et mh_refresh_token (plus long terme, env. 30 jours). Ces cookies sont marqués HttpOnly (non lisibles par JavaScript) et configurés avec Secure/SameSite/Domain selon l'environnement. Nous n'utilisons pas le stockage local du navigateur pour l'authentification. Vos préférences d'overlay sont stockées côté serveur.",
          },
          {
            title: '6. Sécurité des données',
            content:
              "Les mots de passe sont hachés (Argon2). Les secrets Spotify (client_secret, refresh_token) sont chiffrés en base. Les jetons d'accès sont courts et transmis via cookie HttpOnly. Les communications sont chiffrées (HTTPS). Si vous activez la 2FA, un secret TOTP est stocké pour votre compte ; par sécurité, la 2FA est automatiquement désactivée lors d'une réinitialisation de mot de passe réussie (vous pouvez la reconfigurer ensuite).",
          },
          {
            title: '7. Conservation des données',
            content:
              "Nous conservons vos informations de compte, préférences d'overlay, sessions (jetons de rafraîchissement), paramètres et, si applicable, les secrets Spotify et le secret 2FA tant que votre compte est actif. Les données de lecture sont traitées à la volée et non stockées. En cas de suppression de compte, nous supprimons les données associées (overlays, sessions, 2FA, secrets Spotify, paramètres, avertissements/bannissements).",
          },
          {
            title: '8. Vos droits',
            content:
              "Vous pouvez : vous déconnecter (nous effaçons les cookies de session), révoquer Spotify (nous effaçons le refresh_token), reconfigurer/désactiver la 2FA, demander la suppression de votre compte (effacement définitif des données associées), ou cesser d'utiliser le service. Vous pouvez aussi demander l'accès ou la rectification de vos informations (email, nom d'utilisateur).",
          },
          {
            title: '9. Données tierces',
            content:
              "Les pochettes, titres et artistes proviennent de l'API Spotify et sont soumis à la politique de Spotify. Nous n'altérons pas ces données et ne les stockons pas. Des emails transactionnels (ex. réinitialisation de mot de passe) peuvent être envoyés via un prestataire dédié, agissant en sous-traitant.",
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
              "We collect only what's necessary to operate the service: your account info (email, username), a hashed password, your overlay preferences (theme, placement, style), your sessions (refresh tokens), and, if you connect Spotify, your app identifiers and/or Spotify refresh token. Now-playing data (title, artist, artwork) is fetched in real time from Spotify. We compute a dominant color from artwork for display purposes only.",
          },
          {
            title: '2. Use of Information',
            content:
              'Your data is used to authenticate you, configure overlays, and render them in your streaming tools (OBS, XSplit, etc.). We do not store your listening history. Playback data is processed on the fly and not retained. We may retain moderation data (warnings/bans) when actions are taken on your account.',
          },
          {
            title: '3. Spotify Integration',
            content:
              'MelodyHue connects to the Spotify API to retrieve real-time playback info. The client_id (not a secret) may be stored in plain text. The client_secret and/or refresh_token are encrypted at rest. You can disconnect Spotify at any time; we then clear the refresh_token from the database and reset any in-memory Spotify session.',
          },
          {
            title: '4. Information Sharing',
            content:
              'We do not sell, rent or share your personal information with third parties. Data displayed in your overlays is visible only in your streaming software (OBS, XSplit, etc.).',
          },
          {
            title: '5. Cookies and Local Storage',
            content:
              'We use HttpOnly cookies for session: mh_access_token (short-lived, ~15 minutes) and mh_refresh_token (longer-lived, ~30 days). These cookies are HttpOnly (not readable by JavaScript) and configured with Secure/SameSite/Domain depending on environment. We do not use browser local storage for authentication. Your overlay preferences are stored server-side.',
          },
          {
            title: '6. Data Security',
            content:
              'Passwords are hashed (Argon2). Spotify secrets (client_secret, refresh_token) are encrypted at rest. Access tokens are short-lived and sent via HttpOnly cookies. All communications use HTTPS. If you enable 2FA, a TOTP secret is stored; for safety, 2FA is automatically disabled after a successful password reset (you can re-enable it).',
          },
          {
            title: '7. Data Retention',
            content:
              'We retain your account info, overlay preferences, sessions (refresh tokens), settings, and, if applicable, Spotify secrets and 2FA secret while your account remains active. Playback data is processed transiently and not stored. When you delete your account, associated data (overlays, sessions, 2FA, Spotify secrets, settings, warnings/bans) is removed.',
          },
          {
            title: '8. Your Rights',
            content:
              'You can: log out (we clear session cookies), disconnect Spotify (we remove the refresh_token), reconfigure/disable 2FA, request account deletion (permanent data removal), or stop using the service. You may also request access to or correction of your info (email, username).',
          },
          {
            title: '9. Third-Party Data',
            content:
              'Artwork, titles and artists come from Spotify and are subject to Spotify’s privacy policy. We do not alter or store this data. Transactional emails (e.g., password reset) may be sent via an email delivery provider acting as a processor.',
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
