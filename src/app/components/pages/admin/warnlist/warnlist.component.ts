import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminUserWarningItem } from '../../../../core/services/admin.service';
import { LocaleService } from '../../../../core/services/locale.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-warnlist',
  imports: [CommonModule, RouterLink],
  templateUrl: './warnlist.component.html',
  styleUrl: './warnlist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarnlistComponent {
  private readonly admin = inject(AdminService);
  private readonly localeService = inject(LocaleService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<AdminUserWarningItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  // Filtre sélectionné (utilisateur) et recherche globale
  readonly selectedUserId = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly usersOptions = signal<Array<{ id: string; username: string; email: string }>>([]);
  // Etat suppression
  readonly deletingId = signal<string | null>(null);
  readonly deletingAll = signal(false);

  // Formateur de date/heure selon la locale
  readonly dateFormatter = computed(() => {
    const loc = this.localeService.locale() === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(loc, { dateStyle: 'short', timeStyle: 'medium' });
  });

  formatDate(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return this.dateFormatter().format(d);
  }

  readonly labels = computed(() => {
    const fr = this.localeService.locale() === 'fr';
    return {
      title: fr ? 'Avertissements utilisateurs' : 'User warnings',
      description: fr
        ? 'Liste tous les avertissements. Utilisez le sélecteur pour filtrer par utilisateur.'
        : 'List all warnings. Use the selector to filter by user.',
      searchPlaceholder: fr
        ? 'Rechercher (raison, utilisateur, modérateur)…'
        : 'Search (reason, user, moderator)…',
      selectLabel: fr ? 'Utilisateurs avertis' : 'Warned users',
      search: fr ? 'Rechercher' : 'Search',
      loading: fr ? 'Chargement…' : 'Loading…',
      error: fr ? 'Échec du chargement.' : 'Failed to load.',
      empty: fr ? 'Aucun avertissement.' : 'No warnings.',
      table: {
        createdAt: fr ? 'Date' : 'Date',
        user: fr ? 'Utilisateur' : 'User',
        moderator: fr ? 'Modérateur' : 'Moderator',
        reason: fr ? 'Raison' : 'Reason',
        actions: fr ? 'Actions' : 'Actions',
      },
      actions: {
        delete: fr ? 'Supprimer' : 'Delete',
        deleteAllForUser: fr
          ? "Supprimer tous les avertissements de l'utilisateur"
          : 'Delete all warnings for user',
        confirmOne: fr
          ? 'Confirmer la suppression de cet avertissement ?'
          : 'Confirm deletion of this warning?',
        confirmAll: fr
          ? 'Confirmer la suppression de tous les avertissements de cet utilisateur ?'
          : 'Confirm deletion of all warnings for this user?',
      },
      pager: {
        prev: fr ? 'Précédent' : 'Previous',
        next: fr ? 'Suivant' : 'Next',
        page: fr ? 'Page' : 'Page',
      },
    } as const;
  });

  constructor() {
    // Démarrage simple sans refléter l'état dans l'URL
    this.loadAllWarnings();
  }

  // Plus de synchronisation avec l'URL pour cette page (pas de query params)

  private loadAllWarnings(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.admin
      .listAllWarnings({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchTerm() || null,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items || []);
          this.total.set(res.total || 0);
          // Mettre à jour le sélecteur avec des utilisateurs présents dans le résultat courant
          const uniq = new Map<string, { id: string; username: string; email: string }>();
          for (const w of res.items || []) {
            if (!uniq.has(w.user_id)) {
              uniq.set(w.user_id, {
                id: w.user_id,
                username: w.user_username,
                email: w.user_email,
              });
            }
          }
          this.usersOptions.set(Array.from(uniq.values()));
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('admin warnlist list all error', err);
          this.error.set('failed');
          this.isLoading.set(false);
        },
      });
  }

  private loadUserWarnings(): void {
    const uid = this.selectedUserId();
    if (!uid) {
      this.loadAllWarnings();
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.admin.getUserWarnings(uid, { page: this.page(), page_size: this.pageSize() }).subscribe({
      next: (res) => {
        this.items.set(res.items || []);
        this.total.set(res.total || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('admin warnlist user error', err);
        this.error.set('failed');
        this.isLoading.set(false);
      },
    });
  }

  // Les options du select sont alimentées par les résultats de la vue globale

  onGlobalSearchInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement | null)?.value ?? '';
    this.searchTerm.set(v);
  }

  doGlobalSearch(): void {
    // Recherche globale désactivée si un utilisateur est sélectionné
    if (this.selectedUserId()) return;
    this.page.set(1);
    this.loadAllWarnings();
  }

  onSelectUser(ev: Event): void {
    const select = ev.target as HTMLSelectElement;
    const id = select.value || '';
    this.selectedUserId.set(id || null);
    this.page.set(1);
    this.selectedUserId() ? this.loadUserWarnings() : this.loadAllWarnings();
  }

  prev(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.selectedUserId() ? this.loadUserWarnings() : this.loadAllWarnings();
  }

  next(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.selectedUserId() ? this.loadUserWarnings() : this.loadAllWarnings();
  }

  // Les redirections se font via [routerLink] dans le template
}
