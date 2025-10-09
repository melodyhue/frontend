import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OverlaysService } from '../../../../core/services/overlays.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { LocaleService } from '../../../../core/services/locale.service';

@Component({
  selector: 'app-create',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly overlaysService = inject(OverlaysService);
  private readonly localeService = inject(LocaleService);

  readonly saving = signal(false);
  readonly availableTemplates = [
    { id: 'classic', name: 'Classic', type: 'widget' },
    { id: 'color', name: 'Color', type: 'color' },
  ] as const;
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    template: ['classic', [Validators.required]],
  });

  get selectedTemplateType(): string {
    const id = this.form.controls.template.value;
    const t = this.availableTemplates.find((x) => x.id === id);
    return t ? t.type : '-';
  }

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const payload = {
      name: this.form.controls.name.value,
      template: this.mapTemplateForBackend(this.form.controls.template.value),
    };
    this.overlaysService.create(payload).subscribe({
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
    if (v === 'now-playing') return 'classic';
    if (v === 'color-fullscreen') return 'color';
    return v; // classic / color (nouveau format)
  }

  cancel(): void {
    this.router.navigate(['/overlays']);
  }

  readonly content = computed(() => {
    const l = this.localeService.locale();
    return {
      header: {
        title: l === 'fr' ? 'Créer un overlay' : 'Create overlay',
        desc:
          l === 'fr'
            ? 'Renseignez un nom et choisissez un template.'
            : 'Enter a name and choose a template.',
      },
      fields: {
        name: l === 'fr' ? 'Nom' : 'Name',
        template: l === 'fr' ? 'Template' : 'Template',
        required: l === 'fr' ? 'obligatoire' : 'required',
        detectedType: l === 'fr' ? 'Type détecté' : 'Detected type',
      },
      actions: {
        create: l === 'fr' ? 'Créer' : 'Create',
        cancel: l === 'fr' ? 'Annuler' : 'Cancel',
      },
    } as const;
  });

  getTemplateName(id: string): string {
    const l = this.localeService.locale();
    if (id === 'classic') return l === 'fr' ? 'Classique' : 'Classic';
    if (id === 'color') return l === 'fr' ? 'Couleur' : 'Color';
    return id;
  }
}
