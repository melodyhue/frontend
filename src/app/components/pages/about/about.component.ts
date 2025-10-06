import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { LocaleService } from '../../../core/services/locale.service';

interface Feature {
  icon: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
}

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  private readonly localeService = inject(LocaleService);

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'À propos' : 'About';
  });

  readonly content = computed(() => {
    const locale = this.localeService.locale();
    return {
      hero: {
        title: locale === 'fr' ? 'MelodyHue' : 'MelodyHue',
        subtitle:
          locale === 'fr'
            ? 'Overlays musicaux temps réel pour streamers'
            : 'Real-time music overlays for streamers',
        description:
          locale === 'fr'
            ? "MelodyHue est une application d'overlays temps réel pensée pour les streamers, créateurs de contenu et setups audiovisuels. Elle affiche votre musique Spotify en cours avec la couleur dominante de la pochette, à travers plusieurs styles d'overlays élégants et personnalisables, compatibles OBS, XSplit et toute source web."
            : 'MelodyHue is a real-time overlay application designed for streamers, content creators and audiovisual setups. It displays your current Spotify music with the dominant color from the album art, through multiple elegant and customizable overlay styles, compatible with OBS, XSplit and any web source.',
      },
      features: {
        title: locale === 'fr' ? 'Fonctionnalités' : 'Features',
      },
      howItWorks: {
        title: locale === 'fr' ? 'Comment ça fonctionne' : 'How it works',
        steps: [
          {
            number: '1',
            title: locale === 'fr' ? 'Connectez Spotify' : 'Connect Spotify',
            description:
              locale === 'fr'
                ? 'MelodyHue interroge en temps réel la musique Spotify en cours'
                : 'MelodyHue queries Spotify in real-time for the current playing track',
          },
          {
            number: '2',
            title: locale === 'fr' ? 'Analyse des couleurs' : 'Color Analysis',
            description:
              locale === 'fr'
                ? 'La pochette est analysée pour extraire sa couleur dominante'
                : 'The album art is analyzed to extract its dominant color',
          },
          {
            number: '3',
            title: locale === 'fr' ? 'Intégration OBS/XSplit' : 'OBS/XSplit Integration',
            description:
              locale === 'fr'
                ? 'Ajoutez vos overlays comme Browser Source pour une intégration fluide et réactive'
                : 'Add your overlays as Browser Source for smooth and responsive integration',
          },
        ],
      },
    };
  });

  readonly features: Feature[] = [
    {
      icon: 'fa-music',
      titleFr: 'Mise à jour instantanée',
      titleEn: 'Instant Updates',
      descriptionFr:
        'Mise à jour en temps réel à chaque changement de titre avec synchronisation automatique',
      descriptionEn: 'Real-time updates on every track change with automatic synchronization',
    },
    {
      icon: 'fa-palette',
      titleFr: 'Couleur dominante',
      titleEn: 'Dominant Color',
      descriptionFr:
        "Extraction et synchronisation fidèle de la couleur dominante de chaque pochette d'album",
      descriptionEn:
        'Extraction and faithful synchronization of the dominant color from each album cover',
    },
    {
      icon: 'fa-paintbrush',
      titleFr: 'Styles multiples',
      titleEn: 'Multiple Styles',
      descriptionFr:
        'Plusieurs styles visuels modernes et minimalistes, entièrement personnalisables',
      descriptionEn: 'Multiple modern and minimalist visual styles, fully customizable',
    },
    {
      icon: 'fa-layer-group',
      titleFr: "Types d'overlays",
      titleEn: 'Overlay Types',
      descriptionFr:
        'Now Playing (infos de lecture), Dominant Color (couleur dominante), et Combo (fusion des deux)',
      descriptionEn:
        'Now Playing (track info), Dominant Color (dominant color), and Combo (fusion of both)',
    },
    {
      icon: 'fa-sliders',
      titleFr: 'Personnalisation totale',
      titleEn: 'Full Customization',
      descriptionFr:
        'Couleurs, arrondis, polices, marges, ombres, animations... Tout est configurable',
      descriptionEn:
        'Colors, rounded corners, fonts, margins, shadows, animations... Everything is configurable',
    },
    {
      icon: 'fa-video',
      titleFr: 'Compatible OBS/XSplit',
      titleEn: 'OBS/XSplit Compatible',
      descriptionFr: 'Intégration native comme Browser Source pour Windows, macOS et Linux',
      descriptionEn: 'Native integration as Browser Source for Windows, macOS and Linux',
    },
  ];

  getFeatureTitle(feature: Feature): string {
    const locale = this.localeService.locale();
    return locale === 'fr' ? feature.titleFr : feature.titleEn;
  }

  getFeatureDescription(feature: Feature): string {
    const locale = this.localeService.locale();
    return locale === 'fr' ? feature.descriptionFr : feature.descriptionEn;
  }
}
