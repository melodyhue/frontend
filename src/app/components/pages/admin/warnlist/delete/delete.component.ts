import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { AdminService } from '../../../../../core/services/admin.service';
import { LocaleService } from '../../../../../core/services/locale.service';

@Component({
  selector: 'app-delete',
  imports: [ButtonComponent],
  templateUrl: './delete.component.html',
  styleUrl: './delete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly admin = inject(AdminService);
  private readonly locale = inject(LocaleService);

  // State
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirming = signal(true);
  readonly warningId = signal<string | null>(null);
  readonly userId = signal<string | null>(null);

  constructor() {
    const wid = this.route.snapshot.paramMap.get('warning_id') ?? null;
    const uid = this.route.snapshot.paramMap.get('user_id') ?? null;
    // Autoriser un placeholder explicite 'none' pour marquer l'absence
    this.warningId.set(wid && wid !== 'none' ? wid : null);
    this.userId.set(uid && uid !== 'none' ? uid : null);
  }

  cancel(): void {
    this.router.navigate(['/admin/warnlist']);
  }

  private handleError(prefix: string, err: unknown) {
    console.error(prefix, err);
    this.error.set('failed');
    this.working.set(false);
    this.confirming.set(true);
  }

  deleteSingle(): void {
    if (this.working()) return;
    const id = this.warningId();
    if (!id) return;
    this.confirming.set(false);
    this.working.set(true);
    this.admin.deleteWarning(id).subscribe({
      next: () => {
        this.working.set(false);
        this.router.navigate(['/admin/warnlist']);
      },
      error: (err) => this.handleError('delete warning failed', err),
    });
  }

  deleteAllForUser(): void {
    if (this.working()) return;
    const id = this.userId();
    if (!id) return;
    this.confirming.set(false);
    this.working.set(true);
    this.admin.deleteUserWarnings(id).subscribe({
      next: () => {
        this.working.set(false);
        this.router.navigate(['/admin/warnlist']);
      },
      error: (err) => this.handleError('delete all user warnings failed', err),
    });
  }

  readonly content = computed(() => {
    const fr = this.locale.locale() === 'fr';
    return {
      title: fr ? 'Supprimer des avertissements ?' : 'Delete warnings?',
      desc: fr
        ? 'Action irréversible. Supprimer cet avertissement ou tous ceux de l’utilisateur ?'
        : 'Irreversible action. Delete this warning or all warnings of the user?',
      deleting: fr ? 'Suppression en cours…' : 'Deleting…',
      error: fr ? 'Une erreur est survenue. Réessayez.' : 'An error occurred. Try again.',
      actions: {
        deleteOne: fr ? 'Supprimer cet avertissement' : 'Delete this warning',
        deleteAll: fr ? 'Supprimer tous (utilisateur)' : 'Delete all (user)',
        retry: fr ? 'Réessayer' : 'Retry',
        cancel: fr ? 'Annuler' : 'Cancel',
      },
      hints: {},
    } as const;
  });
}
