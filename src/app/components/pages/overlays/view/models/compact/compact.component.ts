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
  selector: 'app-compact',
  imports: [],
  templateUrl: './compact.component.html',
  styleUrl: './compact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactComponent implements OnInit, OnChanges, OnDestroy {
  private readonly publicService = inject(PublicService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @Input() userId: string | null | undefined = null;
  @Input() defaultColor = '#25d865';

  readonly color = signal<string>(this.defaultColor);
  readonly track = signal<PublicTrackInfo | null>(null);
  readonly isVisible = signal<boolean>(false);
  @ViewChild('cover', { static: false }) cover?: ElementRef<HTMLImageElement>;
  @ViewChild('card', { static: false }) card?: ElementRef<HTMLElement>;
  // Refs pour marquee
  @ViewChild('titleContainer', { static: false }) titleContainer?: ElementRef<HTMLElement>;
  @ViewChild('titleInner', { static: false }) titleInner?: ElementRef<HTMLElement>;
  @ViewChild('title1', { static: false }) title1?: ElementRef<HTMLElement>;
  @ViewChild('artistContainer', { static: false }) artistContainer?: ElementRef<HTMLElement>;
  @ViewChild('artistInner', { static: false }) artistInner?: ElementRef<HTMLElement>;
  @ViewChild('artist1', { static: false }) artist1?: ElementRef<HTMLElement>;

  private timerId: any = null;
  private inFlight = false;
  runMarquee = false; // contrôle le démarrage de l'animation de défilement

  ngOnInit(): void {
    if (!this.isBrowser) return;
    window.addEventListener('resize', this.onResize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;
    if (changes['userId']) this.tryStartPolling(true);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this.inFlight = false;
    if (this.isBrowser) window.removeEventListener('resize', this.onResize);
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
          const t = d?.track || null;
          this.track.set(t);
          const nextVisible = !!t?.is_playing;
          const prevVisible = this.isVisible();
          this.isVisible.set(nextVisible);
          // Contrôle du marquee: ne pas démarrer tout de suite, attendre la stabilisation visuelle
          if (nextVisible && !prevVisible) {
            this.runMarquee = false;
            setTimeout(() => {
              this.runMarquee = true;
              this.recomputeMarquee();
            }, 700); // attendre la fin des entrées (slide + ouverture)
          } else if (!nextVisible && prevVisible) {
            this.runMarquee = false;
          }
          // Recompute scroll si contenu change
          setTimeout(() => this.recomputeMarquee(), 150);
          // Recalcule la largeur de cover -> CSS var
          setTimeout(() => this.updateCoverWidthVar(), 50);
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

  private recomputeMarquee() {
    if (!this.isBrowser) return;
    const apply = (container?: HTMLElement, inner?: HTMLElement, first?: HTMLElement) => {
      if (!container || !inner || !first) return;
      const tol = 2;
      const styles = getComputedStyle(container);
      const padL = parseFloat(styles.paddingLeft || '0') || 0;
      const padR = parseFloat(styles.paddingRight || '0') || 0;
      const available = container.clientWidth - padL - padR;
      const content = first.scrollWidth;
      const should = content > available + tol;
      container.classList.toggle('no-scroll', !should);
    };
    apply(
      this.titleContainer?.nativeElement,
      this.titleInner?.nativeElement,
      this.title1?.nativeElement
    );
    apply(
      this.artistContainer?.nativeElement,
      this.artistInner?.nativeElement,
      this.artist1?.nativeElement
    );
  }

  private updateCoverWidthVar() {
    if (!this.isBrowser) return;
    const img = this.cover?.nativeElement;
    const root = this.card?.nativeElement;
    if (!img || !root) return;
    const w = img.getBoundingClientRect().width;
    root.style.setProperty('--cover-w', `${Math.round(w)}px`);
  }

  private onResize = () => this.updateCoverWidthVar();
}
