import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicService } from '../../../../../core/services/public.service';

@Component({
  selector: 'app-color',
  imports: [JsonPipe],
  templateUrl: './color.component.html',
  styleUrl: './color.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<unknown>(null);

  constructor() {
    const userId = this.route.snapshot.paramMap.get('userId') ?? '';
    this.publicService.color(userId).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
