import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlaysService } from '../../../../core/services/overlays.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { OverlayOut } from '../../../../core/models/overlay.model';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-copy',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './copy.component.html',
  styleUrl: './copy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly overlaysService = inject(OverlaysService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly localeService = inject(LocaleService);

  readonly loading = signal(true);
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly source = signal<OverlayOut | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) {
      this.error.set('invalid');
      this.loading.set(false);
      return;
    }
    this.overlaysService.getById(id).subscribe({
      next: (o) => {
        this.source.set(o);
        const suggested = this.suggestName(o.name);
        this.form.patchValue({ name: suggested });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }

  private suggestName(base: string): string {
    const suffix = ' (copy)';
    const max = 120;
    let name = `${base}${suffix}`;
    if (name.length <= max) return name;
    const trimTo = Math.max(0, max - suffix.length);
    return `${base.slice(0, trimTo)}${suffix}`;
  }

  cancel(): void {
    this.router.navigate(['/overlays']);
  }

  submit(): void {
    if (this.form.invalid || this.working()) return;
    const src = this.source();
    if (!src) return;
    this.working.set(true);
    // Compat desc: migrer anciens ids ('now-playing' -> 'default', 'classic' -> 'default', 'color-fullscreen' -> 'color')
    const tpl = (src.template || '').toLowerCase();
    const migrated =
      tpl === 'now-playing' || tpl === 'classic'
        ? 'default'
        : tpl === 'color-fullscreen'
        ? 'color'
        : tpl;
    const payload = {
      name: this.form.controls.name.value || undefined,
      template: migrated,
    };
    this.overlaysService.create(payload).subscribe({
      next: () => {
        this.working.set(false);
        this.router.navigate(['/overlays']);
      },
      error: () => {
        this.error.set('failed');
        this.working.set(false);
      },
    });
  }

  readonly content = computed(() => {
    const l = this.localeService.locale();
    return {
      loading: l === 'fr' ? 'Chargement…' : 'Loading…',
      error: l === 'fr' ? 'Une erreur est survenue.' : 'An error occurred.',
      back: l === 'fr' ? 'Retour' : 'Back',
      header: {
        title: l === 'fr' ? "Copier l'overlay" : 'Copy overlay',
        desc:
          l === 'fr'
            ? 'Créez une copie de votre overlay existant.'
            : 'Create a copy of your existing overlay.',
      },
      fields: {
        name: l === 'fr' ? 'Nom de la copie' : 'Copy name',
      },
      actions: {
        create: l === 'fr' ? 'Créer' : 'Create',
        cancel: l === 'fr' ? 'Annuler' : 'Cancel',
      },
    } as const;
  });
}
