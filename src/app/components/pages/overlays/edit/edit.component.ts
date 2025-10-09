import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlaysService } from '../../../../core/services/overlays.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-edit',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly overlaysService = inject(OverlaysService);
  private readonly localeService = inject(LocaleService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly availableTemplates = [
    { id: 'default', name: 'Default', type: 'widget' },
    { id: 'minimal', name: 'Minimal', type: 'widget' },
    { id: 'compact', name: 'Compact', type: 'widget' },
    { id: 'focus', name: 'Focus', type: 'widget' },
    { id: 'color', name: 'Color', type: 'color' },
  ] as const;
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    template: ['default', [Validators.required]],
  });

  get selectedTemplateType(): string {
    const id = this.form.controls.template.value ?? '';
    const t = this.availableTemplates.find((x) => x.id === id);
    return t ? t.type : '-';
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.overlaysService.getById(id).subscribe({
      next: (o) => {
        // Compat desc: migrer anciens ids ('now-playing' -> 'default', 'classic' -> 'default', 'color-fullscreen' -> 'color')
        const tpl = (o.template || '').toLowerCase();
        const migrated =
          tpl === 'now-playing' || tpl === 'classic'
            ? 'default'
            : tpl === 'color-fullscreen'
            ? 'color'
            : tpl;
        this.form.patchValue({
          name: o.name,
          template: migrated as any,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const payload = {
      name: this.form.controls.name.value,
      template: this.mapTemplateForBackend(this.form.controls.template.value || ''),
    };
    this.overlaysService.update(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/overlays']);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private mapTemplateForBackend(tpl: string): string {
    const v = (tpl || '').toLowerCase();
    // Envoyer les nouveaux ids côté back
    if (v === 'now-playing' || v === 'classic') return 'default';
    if (v === 'color-fullscreen') return 'color';
    return v; // default / color (nouveau format)
  }

  goBack(): void {
    this.router.navigate(['/overlays']);
  }

  readonly content = computed(() => {
    const l = this.localeService.locale();
    return {
      header: {
        title: l === 'fr' ? "Modifier l'overlay" : 'Edit overlay',
        desc:
          l === 'fr'
            ? 'Mettez à jour le nom et le template de votre overlay.'
            : 'Update the name and template of your overlay.',
      },
      fields: {
        name: l === 'fr' ? 'Nom' : 'Name',
        template: l === 'fr' ? 'Template' : 'Template',
        detectedType: l === 'fr' ? 'Type détecté' : 'Detected type',
      },
      actions: {
        save: l === 'fr' ? 'Enregistrer' : 'Save',
        cancel: l === 'fr' ? 'Annuler' : 'Cancel',
      },
    } as const;
  });

  getTemplateName(id: string): string {
    const l = this.localeService.locale();
    if (id === 'default') return l === 'fr' ? 'Défaut' : 'Default';
    if (id === 'minimal') return 'Minimal';
    if (id === 'compact') return 'Compact';
    if (id === 'focus') return 'Focus';
    if (id === 'color') return l === 'fr' ? 'Couleur' : 'Color';
    return id;
  }
}
