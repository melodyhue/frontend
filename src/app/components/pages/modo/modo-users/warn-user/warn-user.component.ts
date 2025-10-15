import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModerationService } from '../../../../../core/services/moderation.service';

@Component({
  selector: 'app-warn-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './warn-user.component.html',
  styleUrl: './warn-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarnUserComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modo = inject(ModerationService);

  readonly reason = signal('');
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
    this.modo.warnUser(id, this.reason()).subscribe({
      next: () => {
        this.sending.set(false);
        // Redirige vers la liste des utilisateurs modo après succès
        this.router.navigate(['/modo/users']);
      },
      error: (err) => {
        console.error('warn failed', err);
        this.error.set('failed');
        this.sending.set(false);
      },
    });
  }
}
