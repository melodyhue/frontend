import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkWithHref } from '@angular/router';
import {
  ModerationService,
  ModoOverlaysListOut,
} from '../../../../core/services/moderation.service';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-modo-overlays',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkWithHref],
  templateUrl: './modo-overlays.component.html',
  styleUrl: './modo-overlays.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModoOverlaysComponent {
  private readonly modo = inject(ModerationService);
  private readonly localeService = inject(LocaleService);
  readonly locale = this.localeService.locale;

  readonly list = signal<ModoOverlaysListOut | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  // Recherche contrôlée (appliquée via bouton)
  readonly search = signal(''); // valeur appliquée
  readonly searchText = signal(''); // saisie courante

  // Lignes normalisées pour le rendu (évite le any dans le template)
  readonly rows = computed<
    ReadonlyArray<{
      id: string;
      name?: string;
      owner_username?: string;
      owner_id?: string;
      template?: string;
      updated_at?: string;
    }>
  >(() => {
    const data = this.list() as any;
    const items = data && Array.isArray(data.items) ? (data.items as any[]) : [];
    return items.map((o) => {
      const rawOwner =
        (o as any).owner_username ??
        (o as any).ownerUsername ??
        (o as any).owner_user_name ??
        (o as any).ownerUserName ??
        (o as any).ownerName ??
        (o as any).username ??
        (o as any).user?.username ??
        (o as any).owner?.username;
      const owner_username = rawOwner != null && rawOwner !== '' ? String(rawOwner) : undefined;
      return {
        id: String((o as any).id ?? ''),
        name: typeof (o as any).name === 'string' ? (o as any).name : undefined,
        owner_username,
        owner_id: typeof (o as any).owner_id === 'string' ? (o as any).owner_id : undefined,
        template: typeof (o as any).template === 'string' ? (o as any).template : undefined,
        updated_at: typeof (o as any).updated_at === 'string' ? (o as any).updated_at : undefined,
      };
    });
  });

  // Libellés UI FR/EN (pattern basé sur LocaleService comme les autres pages)
  readonly labels = computed(() =>
    this.locale() === 'fr'
      ? {
          title: 'Modération - Overlays',
          description: 'Rechercher et gérer tous les overlays de la plateforme.',
          searchPlaceholder: 'Recherche…',
          searchButtonTitle: 'Rechercher',
          searchButtonAria: 'Rechercher',
          loading: 'Chargement…',
          error: 'Impossible de charger les overlays.',
          emptyTitle: 'Aucun overlay',
          emptyMessage: 'Aucun résultat pour ces filtres.',
          tableHeaders: {
            name: 'Nom',
            owner: 'Utilisateur',
            template: 'Template',
            updated: 'Modifié',
            actions: 'Actions',
          },
          actions: { view: 'Voir', edit: 'Éditer', delete: 'Supprimer' },
          pager: { prev: 'Précédent', next: 'Suivant', page: 'Page' },
        }
      : {
          title: 'Moderation - Overlays',
          description: 'Search and manage all overlays on the platform.',
          searchPlaceholder: 'Search…',
          searchButtonTitle: 'Search',
          searchButtonAria: 'Search',
          loading: 'Loading…',
          error: 'Unable to load overlays.',
          emptyTitle: 'No overlay',
          emptyMessage: 'No results for these filters.',
          tableHeaders: {
            name: 'Name',
            owner: 'User',
            template: 'Template',
            updated: 'Updated',
            actions: 'Actions',
          },
          actions: { view: 'View', edit: 'Edit', delete: 'Delete' },
          pager: { prev: 'Previous', next: 'Next', page: 'Page' },
        }
  );

  // Tri client similaire à /overlays
  readonly sortKey = signal<'name' | 'template' | 'owner' | 'updated_at'>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  sortBy(col: 'name' | 'template' | 'owner' | 'updated_at'): void {
    if (this.sortKey() === col) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(col);
      this.sortDir.set('asc');
    }
  }
  getSortIcon(col: 'name' | 'template' | 'owner' | 'updated_at'): string {
    if (this.sortKey() !== col) return 'fa-sort';
    return this.sortDir() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  readonly sortedRows = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const arr = [...this.rows()];
    arr.sort((a, b) => {
      const av =
        (key === 'owner'
          ? a.owner_username ?? a.owner_id
          : key === 'template'
          ? a.template
          : key === 'updated_at'
          ? a.updated_at
          : a.name) || '';
      const bv =
        (key === 'owner'
          ? b.owner_username ?? b.owner_id
          : key === 'template'
          ? b.template
          : key === 'updated_at'
          ? b.updated_at
          : b.name) || '';
      return dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  });

  readonly totalPages = computed(() => {
    const d: any = this.list();
    const size = d && typeof d.page_size === 'number' ? d.page_size : 0;
    const tot = d && typeof d.total === 'number' ? d.total : 0;
    if (!size) return 1;
    return Math.max(1, Math.ceil(tot / size));
  });

  // Aligner l'affichage des dates avec la page Overlays utilisateur
  formatDateString(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const locale = this.locale();
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  }

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.modo
      .listOverlays({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.search() || null,
      })
      .subscribe({
        next: (d) => {
          this.list.set(d);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('modo overlays error', err);
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
    this.search.set(this.searchText().trim());
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
}
