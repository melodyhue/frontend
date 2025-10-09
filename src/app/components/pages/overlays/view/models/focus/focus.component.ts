import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PublicService } from '../../../../../../core/services';
import { PublicTrackInfo } from '../../../../../../core/services/public.service';

@Component({
  selector: 'app-focus',
  imports: [],
  templateUrl: './focus.component.html',
  styleUrl: './focus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusComponent implements OnInit, OnChanges, OnDestroy {
  private readonly publicService = inject(PublicService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @Input() userId: string | null | undefined = null;
  @Input() defaultColor = '#25d865';

  readonly color = signal<string>(this.defaultColor);
  readonly track = signal<PublicTrackInfo | null>(null);
  readonly isVisible = signal<boolean>(false);
  readonly runMarquee = signal<boolean>(false);
  readonly titleScroll = signal<boolean>(false);
  readonly artistScroll = signal<boolean>(false);

  // Refs pour marquee
  @ViewChild('titleContainer', { static: false }) titleContainer?: ElementRef<HTMLElement>;
  @ViewChild('titleInner', { static: false }) titleInner?: ElementRef<HTMLElement>;
  @ViewChild('title1', { static: false }) title1?: ElementRef<HTMLElement>;
  @ViewChild('artistContainer', { static: false }) artistContainer?: ElementRef<HTMLElement>;
  @ViewChild('artistInner', { static: false }) artistInner?: ElementRef<HTMLElement>;
  @ViewChild('artist1', { static: false }) artist1?: ElementRef<HTMLElement>;
  @ViewChild('titleStatic', { static: false }) titleStatic?: ElementRef<HTMLElement>;
  @ViewChild('artistStatic', { static: false }) artistStatic?: ElementRef<HTMLElement>;
  @ViewChild('info', { static: false }) info?: ElementRef<HTMLElement>;

  private timerId: any = null;
  private inFlight = false;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    // observe mutations de track pour recompute après rendu
    queueMicrotask(() => this.recomputeMarquee());
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
      this.publicService.infos(this.userId!).subscribe({
        next: (d: any) => {
          const hex = (d?.color?.hex as string) || this.defaultColor;
          this.color.set(this.normalizeHex(hex, this.defaultColor));
          const t = d?.track || null;
          this.track.set(t);
          const nextVisible = !!t?.is_playing;
          const prevVisible = this.isVisible();
          this.isVisible.set(nextVisible);
          if (nextVisible && !prevVisible) {
            this.runMarquee.set(false);
            setTimeout(() => {
              this.runMarquee.set(true);
              this.recomputeMarquee();
            }, 700);
          } else if (!nextVisible && prevVisible) {
            this.runMarquee.set(false);
          }
          setTimeout(() => this.recomputeMarquee(), 150);
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
  private recomputeMarquee() {
    if (!this.isBrowser) return;
    const infoEl = this.info?.nativeElement as HTMLElement | undefined;
    const marqueeTitle = this.titleContainer?.nativeElement as HTMLElement | undefined;
    const marqueeArtist = this.artistContainer?.nativeElement as HTMLElement | undefined;
    const firstTitle = this.title1?.nativeElement as HTMLElement | undefined;
    const firstArtist = this.artist1?.nativeElement as HTMLElement | undefined;
    const staticTitle = this.titleStatic?.nativeElement as HTMLElement | undefined;
    const staticArtist = this.artistStatic?.nativeElement as HTMLElement | undefined;
    if (!infoEl) return;
    const tol = 2;
    const styles = getComputedStyle(infoEl);
    const padL = parseFloat(styles.paddingLeft || '0') || 0;
    const padR = parseFloat(styles.paddingRight || '0') || 0;
    const available = infoEl.clientWidth - padL - padR;
    if (marqueeTitle) {
      const content = Math.max(firstTitle?.scrollWidth ?? 0, staticTitle?.scrollWidth ?? 0);
      const should = content > available + tol;
      marqueeTitle.classList.toggle('no-scroll', !should);
      this.titleScroll.set(should);
    }
    if (marqueeArtist) {
      const content = Math.max(firstArtist?.scrollWidth ?? 0, staticArtist?.scrollWidth ?? 0);
      const should = content > available + tol;
      marqueeArtist.classList.toggle('no-scroll', !should);
      this.artistScroll.set(should);
    }
  }

  private normalizeHex(input: string | null | undefined, fallback: string): string {
    const raw = (input || '').trim();
    const v = raw.startsWith('#') ? raw.slice(1) : raw;
    return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : fallback;
  }
}
