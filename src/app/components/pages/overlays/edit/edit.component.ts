import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlaysService } from '../../../../core/services/overlays.service';

@Component({
  selector: 'app-edit',
  imports: [ReactiveFormsModule],
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
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    color_hex: ['#25d865', [Validators.required, Validators.pattern(/^#?[0-9a-fA-F]{6}$/)]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.overlaysService.getById(id).subscribe({
      next: (o) => {
        this.form.patchValue({
          name: o.name,
          color_hex: o.color_hex,
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
      color_hex: this.form.controls.color_hex.value?.startsWith('#')
        ? this.form.controls.color_hex.value
        : `#${this.form.controls.color_hex.value}`,
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
}
