import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { PublicService } from '../../../../../../core/services';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-color',
  imports: [],
  templateUrl: './color.component.html',
  styleUrl: './color.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorComponent implements OnInit, OnChanges, OnDestroy {
  private readonly publicService = inject(PublicService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @Input() userId: string | null | undefined = null;
  @Input() defaultColor = '#53ac6a';

  readonly currentColor = signal<string>(this.defaultColor);

  private timerId: any = null;
  private inFlight = false;

  ngOnInit(): void {
    this.currentColor.set(this.defaultColor);
    if (!this.isBrowser) return;
    // ne pas démarrer ici, attendre le premier userId via ngOnChanges
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
    // Toujours dédupliquer
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (!this.userId) return;
    const scheduleNext = () => {
      this.timerId = setTimeout(tick, 1000);
    };
    const tick = () => {
      if (!this.userId) return; // stop si plus d'user
      if (this.inFlight) return scheduleNext();
      this.inFlight = true;
      const uid = this.userId!;
      this.publicService.color(uid).subscribe({
        next: (d: any) => {
          const hex = (d as any)?.color?.hex;
          this.currentColor.set(this.normalizeHex(hex, this.defaultColor));
        },
        error: () => this.currentColor.set(this.defaultColor),
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
}
