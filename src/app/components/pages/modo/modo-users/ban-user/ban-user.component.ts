import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModerationService } from '../../../../../core/services/moderation.service';

@Component({
  selector: 'app-ban-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './ban-user.component.html',
  styleUrl: './ban-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BanUserComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly modo = inject(ModerationService);

  readonly reason = signal('');
  readonly until = signal<string | null>(null);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);

  submit(): void {
    if (this.sending()) return;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('missing id');
      return;
    }
    this.sending.set(true);
    const payload: { reason: string; until?: string } = { reason: this.reason() };
    const u = this.until();
    if (u) payload.until = u;
    this.modo.banUser(id, payload).subscribe({
      next: () => {
        this.sending.set(false);
        this.done.set(true);
      },
      error: (err) => {
        console.error('ban failed', err);
        this.error.set('failed');
        this.sending.set(false);
      },
    });
  }
}
