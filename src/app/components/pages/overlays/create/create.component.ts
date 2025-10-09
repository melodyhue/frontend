import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OverlaysService } from '../../../../core/services/overlays.service';
import { ButtonComponent } from '../../../shared/button/button.component';

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
}
