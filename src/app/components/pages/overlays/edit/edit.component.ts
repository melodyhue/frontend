import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlaysService } from '../../../../core/services/overlays.service';
import { ButtonComponent } from '../../../shared/button/button.component';

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

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly availableTemplates = [
    { id: 'classic', name: 'Classic', type: 'widget' },
    { id: 'color', name: 'Color', type: 'color' },
  ] as const;
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    template: ['classic', [Validators.required]],
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
        // Compat desc: migrer anciens ids ('now-playing' -> 'classic', 'color-fullscreen' -> 'color')
        const tpl = (o.template || '').toLowerCase();
        const migrated =
          tpl === 'now-playing' ? 'classic' : tpl === 'color-fullscreen' ? 'color' : tpl;
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
    if (v === 'now-playing') return 'classic';
    if (v === 'color-fullscreen') return 'color';
    return v; // classic / color (nouveau format)
  }

  goBack(): void {
    this.router.navigate(['/overlays']);
  }
}
