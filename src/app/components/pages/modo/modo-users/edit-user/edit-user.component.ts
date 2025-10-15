import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModerationService, ModoUserOut } from '../../../../../core/services/moderation.service';

@Component({
  selector: 'app-edit-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modo = inject(ModerationService);

  readonly user = signal<ModoUserOut | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly form = signal<{ username: string; email: string }>({ username: '', email: '' });
  readonly saving = signal(false);

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
        this.form.set({ username: u.username, email: u.email });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('load user error', err);
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }

  onSave(): void {
    const id = this.user()?.id;
    if (!id || this.saving()) return;
    this.saving.set(true);
    const payload: Record<string, unknown> = { ...this.form() };
    this.modo.editUser(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        // Redirection vers modo/users après sauvegarde
        this.router.navigate(['/modo/users']);
      },
      error: (err) => {
        console.error('edit user failed', err);
        this.saving.set(false);
      },
    });
  }

  onUsernameChange(value: string): void {
    this.form.update((f) => ({ ...f, username: value ?? '' }));
  }

  onEmailChange(value: string): void {
    this.form.update((f) => ({ ...f, email: value ?? '' }));
  }
}
