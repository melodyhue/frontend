import { Component, ChangeDetectionStrategy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { API_BASE_URL } from '../../../../../core/tokens/api-base-url.token';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-infos',
  imports: [JsonPipe],
  templateUrl: './infos.component.html',
  styleUrl: './infos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfosComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBase = (inject(API_BASE_URL, { optional: true }) || '').replace(/\/$/, '');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<unknown>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      // éviter l'appel SSR; le client fera l'appel lors de l'hydratation
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
        this.fetchInfos(userId);
      },
    });
  }

  private fetchInfos(userId: string): void {
    this.loading.set(true);
    const url = `${this.apiBase}/infos/${encodeURIComponent(userId)}`;
    console.info('[InfosComponent] GET', url);
    this.http.get<unknown>(url, { headers: { accept: 'application/json' } }).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[InfosComponent] infos fetch failed', err);
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
