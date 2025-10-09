import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject, signal, PLATFORM_ID } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { PublicService } from '../../../../../../core/services';

@Component({
  selector: 'app-classic',
  imports: [DecimalPipe],
  templateUrl: './classic.component.html',
  styleUrl: './classic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()'
  },
})
export class ClassicComponent implements OnInit, OnChanges, OnDestroy {
  private readonly publicService = inject(PublicService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @Input() userId: string | null | undefined = null;
  @Input() defaultColor = '#00ff88';

  readonly isVisible = signal(false);
  readonly color = signal<string>(this.defaultColor);
  readonly track = signal<any>(null);
  readonly progressPct = signal<number>(0);
  readonly currentMs = signal<number>(0);
  readonly totalMs = signal<number>(0);

  private rafId: number | null = null;
  private timerId: any = null;
  private inFlight = false;
  private lastStart = 0; // ms since navigation start (performance.now)

  // Refs pour la logique de scroll des textes
  @ViewChild('titleContainer', { static: false }) titleContainer?: ElementRef<HTMLElement>;
  @ViewChild('titleText', { static: false }) titleText?: ElementRef<HTMLElement>;
  @ViewChild('artistContainer', { static: false }) artistContainer?: ElementRef<HTMLElement>;
  @ViewChild('artistText', { static: false }) artistText?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    if (!this.isBrowser) return; // Éviter SSR
    // ne pas forcer si userId pas encore injecté
    this.tryStartPolling();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;
    if (changes['userId']) {
      this.tryStartPolling(true);
    }
  }

  // plus de ngOnChanges: le setter @Input ci-dessus pilote le démarrage du polling

  ngOnDestroy(): void {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this.inFlight = false;
    this.stopRaf();
  }

  private tryStartPolling(_restart = false) {
    // Toujours dédupliquer pour éviter plusieurs timers
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    // Reset l'horodatage de départ pour garantir l'intervalle minimal après un restart
    this.lastStart = 0;
    if (!this.userId) return;
    const scheduleNext = (delay = 1000) => {
      this.timerId = setTimeout(tick, delay);
    };
    const tick = () => {
      if (!this.userId) return;
      // Appliquer un intervalle minimal de 1000ms entre démarrages de requêtes
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if (this.lastStart > 0) {
        const delta = now - this.lastStart;
        if (delta < 1000) {
          return scheduleNext(1000 - delta);
        }
      }
      if (this.inFlight) return scheduleNext(250);
      const uid = this.userId!;
      this.inFlight = true;
      this.lastStart = now;
      this.publicService.infos(uid).subscribe({
        next: (d: any) => {
          const hex = (d?.color?.hex as string) || this.defaultColor;
          this.color.set(hex);
          this.applyAccent(hex);
          const t = d?.track || null;
          this.track.set(t);
          const dur = Number(t?.duration_ms) || 0;
          const prog = Number(t?.progress_ms) || 0;
          this.totalMs.set(dur);
          this.currentMs.set(prog);
          this.progressPct.set(dur > 0 ? Math.min((prog / dur) * 100, 100) : 0);
          this.isVisible.set(!!t?.is_playing);
          this.startRaf();
          // recalcul du scroll après MAJ du DOM
          setTimeout(() => this.recomputeScrolling(), 100);
        },
        error: () => {
          console.warn('[Classic] /infos error, hiding overlay');
          this.isVisible.set(false);
          this.stopRaf();
        },
        complete: () => {
          this.inFlight = false;
          scheduleNext(1000);
        },
      });
    };
    // Démarrage: première requête 1s après le montage/assignation userId
    scheduleNext(1000);
  }

  private startRaf() {
    this.stopRaf();
    const start = performance.now();
    const base = this.currentMs();
    const total = this.totalMs();
    const step = (now: number) => {
      const elapsed = now - start;
      const cur = Math.min(base + elapsed, total);
      this.currentMs.set(cur);
      this.progressPct.set(total > 0 ? Math.min((cur / total) * 100, 100) : 0);
      if (cur < total) this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  private stopRaf() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private applyAccent(hex: string) {
    if (!this.isBrowser) return; // sécurité SSR
    const light = this.lightenColor(hex, 20);
    document.documentElement.style.setProperty('--accent-color', hex);
    document.documentElement.style.setProperty('--accent-color-light', light);
  }

  private lightenColor(hex: string, percent: number): string {
    const num = parseInt((hex || '#000000').replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const val = (clamp(R) << 16) + (clamp(G) << 8) + clamp(B);
    return '#' + val.toString(16).padStart(6, '0');
  }

  // Recalcule si le texte doit scroller, adapte la durée et toggle la classe no-scroll
  private recomputeScrolling() {
    if (!this.isBrowser) return;
    const apply = (container?: HTMLElement, text?: HTMLElement) => {
      if (!container || !text) return;
      const shouldScroll = text.scrollWidth > container.clientWidth;
      if (shouldScroll) {
        container.classList.remove('no-scroll');
        const screenWidth = window.innerWidth;
        let baseDuration = 20;
        if (screenWidth <= 400) baseDuration = 14;
        else if (screenWidth <= 600) baseDuration = 16;
        else if (screenWidth <= 900) baseDuration = 18;
        const ratio = text.scrollWidth / container.clientWidth;
        const duration = Math.max(baseDuration, ratio * baseDuration);
        (text.style as any).animationDuration = `${duration}s`;
      } else {
        container.classList.add('no-scroll');
        (text.style as any).animationDuration = '';
      }
    };
    apply(this.titleContainer?.nativeElement, this.titleText?.nativeElement);
    apply(this.artistContainer?.nativeElement, this.artistText?.nativeElement);
  }

  onResize() {
    // recalcul léger après resize
    setTimeout(() => this.recomputeScrolling(), 100);
  }
}
