import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkWithHref } from '@angular/router';
import { ModerationService, ModoUsersListOut } from '../../../../core/services/moderation.service';
import { LocaleService } from '../../../../core/services/locale.service';
import { UsersService } from '../../../../core/services/users.service';

@Component({
  selector: 'app-modo-users',
  imports: [CommonModule, RouterLink, RouterLinkWithHref],
  templateUrl: './modo-users.component.html',
  styleUrl: './modo-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModoUsersComponent {
  private readonly modo = inject(ModerationService);
  private readonly localeService = inject(LocaleService);
  private readonly usersService = inject(UsersService);
  readonly locale = this.localeService.locale;

  readonly list = signal<ModoUsersListOut | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly search = signal('');
  // Tri
  readonly sortKey = signal<'username' | 'email' | 'role'>('username');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  // Texte brut saisi dans l'input; appliqué via bouton/Entrée seulement
  readonly searchText = signal('');

  readonly totalPages = computed(() => {
    const u = this.list();
    if (!u || !u.page_size) return 1;
    return Math.max(1, Math.ceil((u.total || 0) / u.page_size));
  });

  // Libellés localisés FR/EN
  readonly labels = computed(() =>
    this.locale() === 'fr'
      ? {
          title: 'Modération - Utilisateurs',
          description: 'Rechercher, consulter et agir sur les comptes.',
          searchPlaceholder: 'Recherche…',
          searchButtonTitle: 'Rechercher',
          searchButtonAria: 'Rechercher',
          loading: 'Chargement…',
          error: 'Impossible de charger les utilisateurs.',
          emptyTitle: 'Aucun utilisateur',
          emptyMessage: 'Aucun résultat pour cette recherche.',
          tableHeaders: {
            username: 'Username',
            email: 'Email',
            role: 'Rôle',
            actions: 'Actions',
          },
          roles: { user: 'Utilisateur', moderator: 'Modérateur', admin: 'Administrateur' },
          actions: { view: 'Voir', edit: 'Éditer', warn: 'Avertir', ban: 'Bannir', unban: 'Unban' },
          pager: { prev: 'Précédent', next: 'Suivant', page: 'Page' },
        }
      : {
          title: 'Moderation - Users',
          description: 'Search, view and act on accounts.',
          searchPlaceholder: 'Search…',
          searchButtonTitle: 'Search',
          searchButtonAria: 'Search',
          loading: 'Loading…',
          error: 'Unable to load users.',
          emptyTitle: 'No user',
          emptyMessage: 'No results for this search.',
          tableHeaders: {
            username: 'Username',
            email: 'Email',
            role: 'Role',
            actions: 'Actions',
          },
          roles: { user: 'User', moderator: 'Moderator', admin: 'Administrator' },
          actions: { view: 'View', edit: 'Edit', warn: 'Warn', ban: 'Ban', unban: 'Unban' },
          pager: { prev: 'Previous', next: 'Next', page: 'Page' },
        }
  );

  constructor() {
    // Init champ de recherche avec la valeur effective
    this.searchText.set(this.search());
    // Charger le rôle courant pour l'affichage conditionnel des actions
    this.usersService.me().subscribe({
      next: (me) => {
        const role = (me as any)?.role ? String((me as any).role).toLowerCase() : null;
        this.isAdmin.set(role === 'admin');
      },
      error: () => {
        this.isAdmin.set(false);
      },
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.modo
      .listUsers({ page: this.page(), page_size: this.pageSize(), search: this.search() || null })
      .subscribe({
        next: (u) => {
          this.list.set(u);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('modo users error', err);
          this.error.set('failed');
          this.loading.set(false);
        },
      });
  }

  onSearchInput(ev: Event): void {
    const value = (ev.target as HTMLInputElement | null)?.value ?? '';
    this.searchText.set(value);
  }

  applySearch(): void {
    this.search.set((this.searchText() || '').trim());
    this.page.set(1);
    this.load();
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
    const items = this.list()?.items ?? [];
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

  // Droit admin (pour afficher/cacher le bouton Ban)
  readonly isAdmin = signal<boolean>(false);

  onUnban(userId: string): void {
    if (!this.isAdmin()) return;
    this.modo.revokeBan(userId).subscribe({
      next: () => {
        this.load();
      },
      error: (err) => {
        console.error('unban failed', err);
        // Optionnel: vous pouvez ajouter un signal d'erreur locale si besoin
      },
    });
  }

  // Libellé localisé pour un rôle donné
  roleLabel(role: string): string {
    const r = this.labels().roles;
    switch (role) {
      case 'admin':
        return r.admin;
      case 'moderator':
        return r.moderator;
      default:
        return r.user;
    }
  }
}
