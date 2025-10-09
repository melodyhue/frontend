import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PublicService } from '../../../../../../core/services';
import { PublicTrackInfo } from '../../../../../../core/services/public.service';

@Component({
  selector: 'app-minimal',
  imports: [],
  templateUrl: './minimal.component.html',
  styleUrl: './minimal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
  },
})
export class MinimalComponent implements OnInit, OnChanges, OnDestroy {
  private readonly publicService = inject(PublicService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @Input() userId: string | null | undefined = null;
  @Input() defaultColor = '#25d865';

  readonly color = signal<string>(this.defaultColor);
  readonly track = signal<PublicTrackInfo | null>(null);
  readonly isVisible = signal<boolean>(false);
  // Indique la phase de pause (transition sortante) pour piloter le timing des coins arrondis
  readonly isPausing = signal<boolean>(false);
  // Couleur d'icône lisible (noir ou blanc) selon la luminosité de l'accent
  readonly iconColor = signal<string>('#000');

  // Mémo pour éviter les resets d'animation inutiles
  private lastTextKey = '';

  private timerId: any = null;
  private inFlight = false;

  @ViewChild('lineContainer', { static: false }) lineContainer?: ElementRef<HTMLElement>;
  @ViewChild('lineText', { static: false }) lineText?: ElementRef<HTMLElement>;
  @ViewChild('text1', { static: false }) text1?: ElementRef<HTMLElement>;
  @ViewChild('text2', { static: false }) text2?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    // attendre userId via ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;
    if (changes['userId']) this.tryStartPolling(true);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this.inFlight = false;
  }

  private tryStartPolling(_restart = false) {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (!this.userId) return;
    const scheduleNext = () => (this.timerId = setTimeout(tick, 1000));
    const tick = () => {
      if (!this.userId) return;
      if (this.inFlight) {
        scheduleNext();
        return;
      }
      this.inFlight = true;
      const uid = this.userId!;
      this.publicService.infos(uid).subscribe({
        next: (d: any) => {
          const hex = (d?.color?.hex as string) || this.defaultColor;
          this.color.set(this.normalizeHex(hex, this.defaultColor));
          this.applyAccent(this.color());
          this.iconColor.set(this.getReadableTextColor(this.color()));
          const t = d?.track || null;
          this.track.set(t);
          const playing = !!t?.is_playing;
          // Détecte le passage playing -> pause pour activer la classe pausing
          const wasVisible = this.isVisible();
          if (wasVisible && !playing) {
            // démarre la phase de pause: coins restent carrés pendant le slide (0.6s)
            this.isPausing.set(true);
            // au bout de 0.6s, on autorise l'arrondi (via CSS)
            setTimeout(() => this.isPausing.set(false), 600);
          }
          this.isVisible.set(playing);
          // Quand on passe en lecture, la panel apparaît avec 1s de délai avant de sortir de la couleur.
          // On re-mesure après ~1.2s pour garantir des dimensions stables et relancer l'animation si besoin.
          if (!wasVisible && playing) {
            setTimeout(() => this.recomputeScrolling(), 1200);
          }
          // Recalcul uniquement si le contenu a changé (évite reset de la marquee à chaque tick)
          const key = `${t?.name || ''} - ${t?.artist || ''}`;
          if (key !== this.lastTextKey) {
            this.lastTextKey = key;
            setTimeout(() => this.recomputeScrolling(), 100);
          }
        },
        error: () => {
          this.isVisible.set(false);
        },
        complete: () => {
          this.inFlight = false;
          scheduleNext();
        },
      });
    };
    tick();
  }

  private normalizeHex(input: string | null | undefined, fallback: string): string {
    const raw = (input || '').trim();
    const v = raw.startsWith('#') ? raw.slice(1) : raw;
    return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : fallback;
  }

  private applyAccent(hex: string) {
    if (!this.isBrowser) return;
    document.documentElement.style.setProperty('--accent-color', hex);
  }

  private getReadableTextColor(hex: string): string {
    const v = (hex || '').replace('#', '');
    const r = parseInt(v.substring(0, 2), 16) || 0;
    const g = parseInt(v.substring(2, 4), 16) || 0;
    const b = parseInt(v.substring(4, 6), 16) || 0;
    // Perceived brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160 ? '#000' : '#fff';
  }

  private recomputeScrolling() {
    if (!this.isBrowser) return;
    const container = this.lineContainer?.nativeElement;
    const inner = this.lineText?.nativeElement;
    const t1 = this.text1?.nativeElement;
    if (!container || !inner || !t1) return;
    const tolerance = 2; // px de marge pour éviter les faux positifs
    const contentWidth = t1.scrollWidth; // mesurer la première occurrence uniquement
    // disponible = largeur intérieure du container - padding horizontal (nous mesurons le texte hors padding)
    const styles = getComputedStyle(container);
    const padL = parseFloat(styles.paddingLeft || '0') || 0;
    const padR = parseFloat(styles.paddingRight || '0') || 0;
    const available = container.clientWidth - padL - padR;
    const shouldScroll = contentWidth > available + tolerance;
    container.classList.toggle('no-scroll', !shouldScroll);
  }

  onResize() {
    setTimeout(() => this.recomputeScrolling(), 100);
  }
}
