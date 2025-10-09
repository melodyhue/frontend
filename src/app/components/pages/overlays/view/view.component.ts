import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OverlaysService } from '../../../../core/services';
import { ColorComponent } from './templates/color/color.component';
import { ClassicComponent } from './templates/classic/classic.component';

@Component({
  selector: 'app-view',
  imports: [ColorComponent, ClassicComponent],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'overlay-view',
  },
})
export class ViewComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly overlaysService = inject(OverlaysService);

  // Params
  readonly userId = signal<string>('');
  readonly overlayId = signal<string>('');
  // "mode" d'affichage de l'overlay (dérivé du template backend). On garde le query param pour override.
  readonly mode = signal<'color' | 'infos'>('color');
  readonly template = signal<string>('classic');

  // Data
  readonly defaultColor = signal<string>('#25d865');
  readonly currentColor = signal<string>('#25d865');
  readonly track = signal<{
    id?: string;
    name?: string;
    artist?: string;
    album?: string;
    image_url?: string;
    is_playing?: boolean;
    duration_ms?: number;
    progress_ms?: number;
  } | null>(null);
  readonly progressPct = signal<number>(0);

  private intervalId: any = null;

  constructor() {
    const params = this.route.snapshot.paramMap;
    const qp = this.route.snapshot.queryParamMap;
    const userId = params.get('userId') ?? '';
    const overlayId = params.get('overlayId') ?? '';
    const styleOverride = qp.get('style') as 'color' | 'infos' | null;
    const defaultParam = qp.get('default');
    if (userId) this.userId.set(userId);
    this.overlayId.set(overlayId);
    // route params loaded
    if (styleOverride) this.mode.set(styleOverride);
    if (defaultParam) {
      const hex = this.normalizeHex(defaultParam, this.defaultColor());
      this.defaultColor.set(hex);
      this.currentColor.set(hex);
    }

    // Charger l'overlay pour récupérer template/style et une couleur par défaut éventuelle
    if (overlayId) {
      this.overlaysService.getPublicById(overlayId).subscribe({
        next: (o) => {
          // Map backend fields
          this.template.set(o.template as string);
          // Déduire le mode de rendu depuis le template, sauf override via query param
          if (!styleOverride) {
            const t = (o.template || '').toLowerCase();
            // supporte anciens ids: 'classic'/'now-playing' => infos, sinon color
            const inferred = t === 'classic' || t === 'now-playing' ? 'infos' : 'color';
            this.mode.set(inferred);
          }
          // Défaut couleur si aucune donnée publique dispo
          const hex = '#25d865';
          this.defaultColor.set(hex);
          this.currentColor.set(hex);
        },
        error: (e) => {
          // Silencieux en prod; garder le log si nécessaire pour debug
          // console.error('[View] getPublicById failed', e);
        },
      });
    }

    // Démarrer la mise à jour périodique
    this.startLoop();

    // Si le style change (via navigation), redémarrer la boucle
    effect(() => {
      this.mode();
      this.restartLoop();
    });
  }

  ngOnDestroy(): void {
    this.stopLoop();
  }

  private normalizeHex(input: string | null | undefined, fallback: string): string {
    const raw = (input || '').trim();
    const v = raw.startsWith('#') ? raw.slice(1) : raw;
    return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : fallback;
  }

  private startLoop(): void {
    this.stopLoop();
    const run = () => {
      // Tant que l'endpoint public overlay/{overlay_id} ne renvoie pas l'owner, on ne peut pas appeler infos/color/{userId}.
      // On garde un affichage par défaut stable sans polling externe.
      this.progressPct.set(0);
    };
    run();
    this.intervalId = setInterval(run, 1000);
  }

  private stopLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private restartLoop(): void {
    this.startLoop();
  }
}
