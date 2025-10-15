import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ModerationService,
  type ModoOverlayOut,
} from '../../../../../core/services/moderation.service';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-edit-overlay',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './edit-overlay.component.html',
  styleUrl: './edit-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditOverlayComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly modo = inject(ModerationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);
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

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.error.set('missing id');
      return;
    }
    this.modo.viewOverlay(id).subscribe({
      next: (ov: ModoOverlayOut) => {
        const tpl = (ov.template || '').toLowerCase();
        const migrated =
          tpl === 'now-playing' || tpl === 'classic'
            ? 'default'
            : tpl === 'color-fullscreen'
            ? 'color'
            : tpl;
        this.form.patchValue({
          name: ov.name,
          template: migrated as any,
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('load overlay failed', err);
        this.error.set('failed to load');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('missing id');
      return;
    }
    this.saving.set(true);
    const payload = {
      name: this.form.controls.name.value,
      template: this.mapTemplateForBackend(this.form.controls.template.value || ''),
    };
    this.modo.editOverlay(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/modo/overlays']);
      },
      error: (err) => {
        console.error('edit overlay failed', err);
        this.error.set('failed');
        this.saving.set(false);
      },
    });
  }

  get selectedTemplateType(): string {
    const id = this.form.controls.template.value ?? '';
    const t = this.availableTemplates.find((x) => x.id === id);
    return t ? t.type : '-';
  }

  private mapTemplateForBackend(tpl: string): string {
    const v = (tpl || '').toLowerCase();
    if (v === 'now-playing' || v === 'classic') return 'default';
    if (v === 'color-fullscreen') return 'color';
    return v;
  }

  goBack(): void {
    void this.router.navigate(['/modo/overlays']);
  }
}
