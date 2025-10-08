import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OverlaysService } from '../../../../core/services/overlays.service';

@Component({
  selector: 'app-delete',
  imports: [],
  templateUrl: './delete.component.html',
  styleUrl: './delete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly overlaysService = inject(OverlaysService);
  readonly working = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.overlaysService.delete(id).subscribe({
      next: () => {
        this.working.set(false);
        this.router.navigate(['/overlays']);
      },
      error: () => {
        this.error.set('failed');
        this.working.set(false);
      },
    });
  }
}
