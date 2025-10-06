import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-terms',
  imports: [],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
  private readonly localeService = inject(LocaleService);
  private readonly location = inject(Location);

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? "Conditions d'utilisation" : 'Terms of Service';
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
            title: '1. Acceptation des conditions',
            content:
              "En accédant et en utilisant MelodyHue, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.",
          },
          {
            title: '2. Description du service',
            content:
              "MelodyHue est une application d'overlays temps réel pour OBS, XSplit et tout logiciel de streaming acceptant les sources web. Elle affiche en direct la musique Spotify en cours de lecture ainsi que la couleur dominante extraite de la pochette, via deux overlays séparés et complémentaires.",
          },
          {
            title: '3. Projet Open Source',
            content:
              'MelodyHue est un projet open source. Le code source est disponible publiquement et peut être consulté, modifié et redistribué conformément à la licence du projet. Les contributions de la communauté sont bienvenues.',
          },
          {
            title: '4. Compte utilisateur et Spotify',
            content:
              "Pour utiliser MelodyHue, vous devez connecter votre compte Spotify. Vous êtes responsable de maintenir la confidentialité de vos identifiants. L'utilisation de MelodyHue nécessite un compte Spotify actif (gratuit ou premium).",
          },
          {
            title: '5. Utilisation acceptable',
            content:
              "MelodyHue est destiné à un usage personnel pour le streaming et la création de contenu. Vous vous engagez à respecter les conditions d'utilisation de Spotify et à ne pas utiliser le service à des fins commerciales sans autorisation.",
          },
          {
            title: '6. Propriété intellectuelle',
            content:
              "Le code source de MelodyHue est sous licence open source. Les pochettes d'albums et données musicales affichées appartiennent à leurs propriétaires respectifs et sont fournies via l'API Spotify.",
          },
          {
            title: '7. Intégration Spotify',
            content:
              "MelodyHue utilise l'API Spotify pour récupérer les informations de lecture en temps réel. Nous ne stockons pas vos données d'écoute. La disponibilité du service dépend de la disponibilité de l'API Spotify.",
          },
          {
            title: '8. Limitation de responsabilité',
            content:
              'MelodyHue est fourni "tel quel" sans garantie d\'aucune sorte. Nous ne serons pas responsables des interruptions de service, des problèmes de compatibilité avec votre logiciel de streaming, ou de tout dommage résultant de l\'utilisation du service.',
          },
          {
            title: '9. Modifications',
            content:
              "Nous nous réservons le droit de modifier ces conditions, les fonctionnalités du service ou d'interrompre MelodyHue à tout moment. Les modifications majeures vous seront notifiées.",
          },
          {
            title: '10. Contact',
            content:
              'Pour toute question concernant ces conditions, veuillez nous contacter à legal@melodyhue.com',
          },
        ],
      };
    } else {
      return {
        sections: [
          {
            title: '1. Acceptance of Terms',
            content:
              'By accessing and using MelodyHue, you agree to be bound by these terms of service. If you do not accept these terms, please do not use our service.',
          },
          {
            title: '2. Service Description',
            content:
              'MelodyHue is a real-time overlay application for OBS, XSplit and any streaming software that accepts web sources. It displays live Spotify playback information and the dominant color extracted from album artwork through two separate, complementary overlays.',
          },
          {
            title: '3. Open Source Project',
            content:
              'MelodyHue is an open source project. The source code is publicly available and can be viewed, modified and redistributed in accordance with the project license. Community contributions are welcome.',
          },
          {
            title: '4. User Account and Spotify',
            content:
              'To use MelodyHue, you must connect your Spotify account. You are responsible for maintaining the confidentiality of your credentials. Using MelodyHue requires an active Spotify account (free or premium).',
          },
          {
            title: '5. Acceptable Use',
            content:
              "MelodyHue is intended for personal use in streaming and content creation. You agree to comply with Spotify's terms of service and not to use the service for commercial purposes without authorization.",
          },
          {
            title: '6. Intellectual Property',
            content:
              'MelodyHue source code is under open source license. Album artwork and music data displayed belong to their respective owners and are provided through the Spotify API.',
          },
          {
            title: '7. Spotify Integration',
            content:
              'MelodyHue uses the Spotify API to retrieve real-time playback information. We do not store your listening data. Service availability depends on Spotify API availability.',
          },
          {
            title: '8. Limitation of Liability',
            content:
              'MelodyHue is provided "as is" without warranty of any kind. We will not be liable for service interruptions, compatibility issues with your streaming software, or any damages resulting from use of the service.',
          },
          {
            title: '9. Modifications',
            content:
              'We reserve the right to modify these terms, service features or discontinue MelodyHue at any time. You will be notified of major changes.',
          },
          {
            title: '10. Contact',
            content:
              'For any questions regarding these terms, please contact us at legal@melodyhue.com',
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
