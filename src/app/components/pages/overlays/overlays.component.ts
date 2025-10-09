import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocaleService } from '../../../core/services/locale.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { OverlaysService } from '../../../core/services/overlays.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';

interface ViewOverlay {
  id: string;
  name: string;
  type: string; // widget | color (affichage)
  template: string; // Classic | Color (affichage)
  createdAt: Date;
  lastModified: Date;
}

@Component({
  selector: 'app-overlays',
  imports: [ButtonComponent],
  templateUrl: './overlays.component.html',
  styleUrl: './overlays.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaysComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly overlaysService = inject(OverlaysService);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  private readonly overlaysData = signal<ViewOverlay[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  private readonly currentUserId = signal<string | null>(null);

  readonly sortColumn = signal<'name' | 'type' | 'template' | 'lastModified'>('lastModified');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly overlays = computed(() => {
    const data = [...this.overlaysData()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    data.sort((a, b) => {
      let comparison = 0;

      if (column === 'name' || column === 'template' || column === 'type') {
        comparison = a[column].localeCompare(b[column]);
      } else if (column === 'lastModified') {
        comparison = a.lastModified.getTime() - b.lastModified.getTime();
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return data;
  });

  readonly title = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Mes Overlays' : 'My Overlays';
  });

  readonly description = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? 'Créez et gérez vos overlays pour OBS, XSplit et autres logiciels de streaming.'
      : 'Create and manage your overlays for OBS, XSplit and other streaming software.';
  });

  readonly createButtonLabel = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Créer un overlay' : 'Create overlay';
  });

  readonly emptyStateTitle = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr' ? 'Aucun overlay' : 'No overlays';
  });

  readonly emptyStateMessage = computed(() => {
    const locale = this.localeService.locale();
    return locale === 'fr'
      ? 'Commencez par créer votre premier overlay.'
      : 'Start by creating your first overlay.';
  });

  readonly tableHeaders = computed(() => {
    const locale = this.localeService.locale();
    return {
      name: locale === 'fr' ? 'Nom' : 'Name',
      type: 'Type',
      template: locale === 'fr' ? 'Template' : 'Template',
      created: locale === 'fr' ? 'Créé le' : 'Created',
      modified: locale === 'fr' ? 'Modifié le' : 'Modified',
      actions: locale === 'fr' ? 'Actions' : 'Actions',
    };
  });

  readonly actionLabels = computed(() => {
    const locale = this.localeService.locale();
    return {
      view: locale === 'fr' ? 'Voir' : 'View',
      edit: locale === 'fr' ? 'Modifier' : 'Edit',
      delete: locale === 'fr' ? 'Supprimer' : 'Delete',
      duplicate: locale === 'fr' ? 'Dupliquer' : 'Duplicate',
    };
  });

  formatDate(date: Date): string {
    const locale = this.localeService.locale();
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  sortBy(column: 'name' | 'type' | 'template' | 'lastModified'): void {
    if (this.sortColumn() === column) {
      // Toggle direction if same column
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: 'name' | 'type' | 'template' | 'lastModified'): string {
    if (this.sortColumn() !== column) {
      return 'fa-sort';
    }
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  createOverlay(): void {
    this.router.navigate(['/overlays/create']);
  }

  viewOverlay(id: string): void {
    const uid = this.currentUserId();
    if (uid) {
      window.open(`/overlay/${uid}/${id}`, '_blank');
    } else {
      window.open(`/overlay/${id}`, '_blank');
    }
  }

  editOverlay(id: string): void {
    this.router.navigate(['/overlays/edit', id]);
  }

  duplicateOverlay(id: string): void {
    this.router.navigate(['/overlays/copy', id]);
  }

  deleteOverlay(id: string): void {
    this.router.navigate(['/overlays/delete', id]);
  }

  constructor() {
    // Récupérer l'ID utilisateur pour construire les URLs publiques
    this.usersService.me().subscribe({
      next: (u) => this.currentUserId.set(u.id),
      error: () => this.currentUserId.set(null),
    });
    // Charger depuis l'API
    this.overlaysService.list().subscribe({
      next: (items) => {
        const mapped = items.map((o) => {
          const key = (o.template || '').toLowerCase();
          const template =
            key === 'classic' || key === 'now-playing'
              ? 'Classic'
              : key === 'color' || key === 'color-fullscreen'
              ? 'Color'
              : o.template;
          const type =
            key === 'classic' || key === 'now-playing'
              ? 'widget'
              : key === 'color' || key === 'color-fullscreen'
              ? 'color'
              : '-';
          return {
            id: o.id,
            name: o.name,
            type,
            template,
            createdAt: new Date(o.created_at),
            lastModified: new Date(o.updated_at),
          } as ViewOverlay;
        });
        this.overlaysData.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
