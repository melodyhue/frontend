import { Component, ChangeDetectionStrategy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicService } from '../../../../../core/services';

@Component({
  selector: 'app-color',
  imports: [JsonPipe],
  templateUrl: './color.component.html',
  styleUrl: './color.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly publicService = inject(PublicService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<unknown>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const pm = this.route.snapshot.paramMap;
    const userId = pm.get('userId') || '';
    if (!userId) {
      this.error.set('missing-user-id');
      this.loading.set(false);
      return;
    }
    this.fetchColor(userId);
  }

  private fetchColor(userId: string): void {
    this.loading.set(true);
    this.publicService.color(userId).subscribe({
      next: (d) => {
        this.data.set(d as unknown);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
