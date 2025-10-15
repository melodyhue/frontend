import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ModerationService, ModoUserOut } from '../../../../../core/services/moderation.service';

@Component({
  selector: 'app-view-user',
  imports: [CommonModule],
  templateUrl: './view-user.component.html',
  styleUrl: './view-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUserComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly modo = inject(ModerationService);

  readonly user = signal<ModoUserOut | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('missing id');
      this.loading.set(false);
      return;
    }
    this.modo.viewUser(id).subscribe({
      next: (u) => {
        this.user.set(u);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('view user error', err);
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
