import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStatsOut } from '../../../core/services/admin.service';
import { LocaleService } from '../../../core/services/locale.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  private readonly admin = inject(AdminService);
  private readonly localeService = inject(LocaleService);
  readonly locale = this.localeService.locale;

  // Stats
  readonly stats = signal<AdminStatsOut | null>(null);
  readonly statsLoading = signal(true);
  readonly statsError = signal<string | null>(null);

  readonly labels = computed(() =>
    this.locale() === 'fr'
      ? {
          title: 'Admin',
          description: 'Statistiques globales et gestion.',
          loading: 'Chargement…',
          error: 'Impossible de charger les stats.',
          details: {
            users: 'Utilisateurs',
            overlays: 'Overlays',
            moderators: 'Modérateurs',
            admins: 'Admins',
            active2fa: '2FA actives',
            lastRegistered: 'Dernier inscrit',
          },
        }
      : {
          title: 'Admin',
          description: 'Global statistics and management.',
          loading: 'Loading…',
          error: 'Unable to load stats.',
          details: {
            users: 'Users',
            overlays: 'Overlays',
            moderators: 'Moderators',
            admins: 'Admins',
            active2fa: 'Active 2FA',
            lastRegistered: 'Last registered',
          },
        }
  );

  formatDateTime(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '-';
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return String(dateInput);
    const locale = this.locale();
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  constructor() {
    this.loadStats();
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.admin.getStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.statsLoading.set(false);
      },
      error: (err) => {
        console.error('admin stats error', err);
        this.statsError.set('failed');
        this.statsLoading.set(false);
      },
    });
  }
}
