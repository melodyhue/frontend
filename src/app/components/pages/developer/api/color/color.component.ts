import { Component, ChangeDetectionStrategy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { API_BASE_URL } from '../../../../../core/tokens/api-base-url.token';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-color',
  imports: [JsonPipe],
  templateUrl: './color.component.html',
  styleUrl: './color.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBase = (inject(API_BASE_URL, { optional: true }) || '').replace(/\/$/, '');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<unknown>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.route.paramMap.subscribe({
      next: (pm) => {
        const userId = pm.get('userId') || '';
        if (!userId) {
          this.error.set('missing-user-id');
          this.loading.set(false);
          return;
        }
        this.fetchColor(userId);
      },
    });
  }

  private fetchColor(userId: string): void {
    this.loading.set(true);
    const url = `${this.apiBase}/color/${encodeURIComponent(userId)}`;
    console.info('[ColorComponent] GET', url);
    this.http.get<unknown>(url, { headers: { accept: 'application/json' } }).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[ColorComponent] color fetch failed', err);
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
