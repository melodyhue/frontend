import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AdminRole,
  AdminUsersListOut,
} from '../../../../core/services/admin.service';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-roles',
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesComponent {
  private readonly admin = inject(AdminService);
  private readonly localeService = inject(LocaleService);
  readonly locale = this.localeService.locale;

  readonly users = signal<AdminUsersListOut | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly search = signal('');
  // Tri
  readonly sortKey = signal<'username' | 'email' | 'role'>('role');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly totalPages = computed(() => {
    const u = this.users();
    if (!u || !u.page_size) return 1;
    return Math.max(1, Math.ceil((u.total || 0) / u.page_size));
  });

  readonly labels = computed(() =>
    this.locale() === 'fr'
      ? {
          title: 'Gestion des rôles',
          description: 'Rechercher des utilisateurs et gérer leurs rôles.',
          searchPlaceholder: 'Recherche…',
          searchButtonTitle: 'Rechercher',
          searchButtonAria: 'Rechercher',
          loading: 'Chargement…',
          error: 'Impossible de charger les utilisateurs.',
          tableHeaders: { username: 'Username', email: 'Email', role: 'Rôle', actions: 'Actions' },
          pager: { prev: 'Précédent', next: 'Suivant', page: 'Page' },
          actions: { changeRole: 'Changer de rôle' },
          roles: { user: 'User', moderator: 'Moderator', admin: 'Admin' },
        }
      : {
          title: 'Roles management',
          description: 'Search users and manage their roles.',
          searchPlaceholder: 'Search…',
          searchButtonTitle: 'Search',
          searchButtonAria: 'Search',
          loading: 'Loading…',
          error: 'Unable to load users.',
          tableHeaders: { username: 'Username', email: 'Email', role: 'Role', actions: 'Actions' },
          pager: { prev: 'Previous', next: 'Next', page: 'Page' },
          actions: { changeRole: 'Change role' },
          roles: { user: 'User', moderator: 'Moderator', admin: 'Admin' },
        }
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin
      .listUsers({ page: this.page(), page_size: this.pageSize(), search: this.search() || null })
      .subscribe({
        next: (u) => {
          this.users.set(u);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('roles list error', err);
          this.error.set('failed');
          this.loading.set(false);
        },
      });
  }

  onSearch(ev: Event): void {
    const value = (ev.target as HTMLInputElement | null)?.value ?? '';
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  changeRole(userId: string, ev: Event): void {
    const value = (ev.target as HTMLSelectElement | null)?.value as AdminRole | undefined;
    if (!value) return;
    this.admin.updateUserRole(userId, value).subscribe({
      next: () => this.load(),
      error: (err) => console.error('update role failed', err),
    });
  }

  prev(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  next(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  // Lignes triées (dans la page courante)
  readonly sortedRows = computed(() => {
    const items = this.users()?.items ?? [];
    const key = this.sortKey();
    const dir = this.sortDir();
    const factor = dir === 'asc' ? 1 : -1;
    const val = (v: unknown) => (v ?? '').toString().toLowerCase();
    return [...items].sort((a, b) => {
      const av = val((a as any)[key]);
      const bv = val((b as any)[key]);
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  });

  sortBy(key: 'username' | 'email' | 'role'): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  getSortIcon(key: 'username' | 'email' | 'role'): string {
    if (this.sortKey() !== key) return 'fa-sort';
    return this.sortDir() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
}
