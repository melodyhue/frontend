import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocaleService } from '../../../core/services/locale.service';

interface Overlay {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  lastModified: Date;
}

@Component({
  selector: 'app-overlays',
  imports: [],
  templateUrl: './overlays.component.html',
  styleUrl: './overlays.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaysComponent {
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);

  // Mock data - à remplacer par un service
  readonly overlays = signal<Overlay[]>([
    {
      id: '1',
      name: 'Overlay principal',
      type: 'Default',
      createdAt: new Date('2025-01-15'),
      lastModified: new Date('2025-09-20'),
    },
    {
      id: '2',
      name: 'Overlay vinyle',
      type: 'Vinyle',
      createdAt: new Date('2025-03-10'),
      lastModified: new Date('2025-08-05'),
    },
    {
      id: '3',
      name: 'Overlay couleur',
      type: 'Color',
      createdAt: new Date('2025-05-20'),
      lastModified: new Date('2025-09-15'),
    },
  ]);

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
      type: locale === 'fr' ? 'Type' : 'Type',
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

  createOverlay(): void {
    this.router.navigate(['/overlays/create']);
  }

  viewOverlay(id: string): void {
    // TODO: Remplacer 'USER_ID' par l'ID réel de l'utilisateur connecté
    const userId = 'USER_ID';
    window.open(`/overlay/${userId}/${id}`, '_blank');
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
}
