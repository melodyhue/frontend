import { Component, ChangeDetectionStrategy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicService } from '../../../../../core/services';

@Component({
  selector: 'app-infos',
  imports: [JsonPipe],
  templateUrl: './infos.component.html',
  styleUrl: './infos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfosComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly publicService = inject(PublicService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<unknown>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      // éviter l'appel SSR; le client fera l'appel lors de l'hydratation
      return;
    }
    const pm = this.route.snapshot.paramMap;
    const userId = pm.get('userId') || '';
    if (!userId) {
      this.error.set('missing-user-id');
      this.loading.set(false);
      return;
    }
    this.fetchInfos(userId);
  }

  private fetchInfos(userId: string): void {
    this.loading.set(true);
    this.publicService.infos(userId).subscribe({
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
