import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ActivatedRoute, Router } from '@angular/router';
import { OverlaysService } from '../../../../core/services/overlays.service';

@Component({
  selector: 'app-delete',
  imports: [ButtonComponent],
  templateUrl: './delete.component.html',
  styleUrl: './delete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly overlaysService = inject(OverlaysService);
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirming = signal(true);
  readonly overlayId = signal<string>('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.overlayId.set(id);
  }

  cancel(): void {
    this.router.navigate(['/overlays']);
  }

  confirmDelete(): void {
    if (this.working()) return;
    const id = this.overlayId();
    if (!id) {
      this.error.set('invalid');
      return;
    }
    this.confirming.set(false);
    this.working.set(true);
    this.overlaysService.delete(id).subscribe({
      next: () => {
        this.working.set(false);
        this.router.navigate(['/overlays']);
      },
      error: () => {
        this.error.set('failed');
        this.working.set(false);
        this.confirming.set(true);
      },
    });
  }
}
