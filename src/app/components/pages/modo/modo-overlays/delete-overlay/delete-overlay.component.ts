import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  ModerationService,
  type ModoOverlayOut,
} from '../../../../../core/services/moderation.service';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-delete-overlay',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './delete-overlay.component.html',
  styleUrl: './delete-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteOverlayComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly modo = inject(ModerationService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);
  readonly overlay = signal<ModoOverlayOut | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('missing id');
      return;
    }
    this.loading.set(true);
    this.modo.viewOverlay(id).subscribe({
      next: (ov) => {
        this.overlay.set(ov);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('load overlay failed', err);
        this.error.set('failed to load');
        this.loading.set(false);
      },
    });
  }

  confirmDelete(): void {
    if (this.loading()) return;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('missing id');
      return;
    }
    this.loading.set(true);
    this.modo.deleteOverlay(id).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err) => {
        console.error('delete overlay failed', err);
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
