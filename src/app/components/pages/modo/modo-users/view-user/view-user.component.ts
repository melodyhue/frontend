import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ModerationService, ModoUserOut } from '../../../../../core/services/moderation.service';
import { LocaleService } from '../../../../../core/services/locale.service';

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
  private readonly locale = inject(LocaleService);

  readonly user = signal<ModoUserOut | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Formateur de date/heure selon la locale
  readonly dateFormatter = computed(() => {
    const loc = this.locale.locale() === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(loc, { dateStyle: 'short', timeStyle: 'medium' });
  });

  formatDate(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return this.dateFormatter().format(d);
  }

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

  // Libellé localisé pour un rôle
  roleLabel(role: string | null | undefined): string {
    const lang = this.locale.locale();
    const fr = { user: 'Utilisateur', moderator: 'Modérateur', admin: 'Administrateur' } as const;
    const en = { user: 'User', moderator: 'Moderator', admin: 'Administrator' } as const;
    const dict = lang === 'fr' ? fr : en;
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return dict.admin;
      case 'moderator':
        return dict.moderator;
      default:
        return dict.user;
    }
  }
}
