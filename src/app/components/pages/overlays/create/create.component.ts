import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OverlaysService } from '../../../../core/services/overlays.service';

@Component({
  selector: 'app-create',
  imports: [ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly overlaysService = inject(OverlaysService);

  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    color_hex: ['#25d865', [Validators.required, Validators.pattern(/^#?[0-9a-fA-F]{6}$/)]],
  });

  create(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const payload = {
      name: this.form.controls.name.value,
      color_hex: this.form.controls.color_hex.value.startsWith('#')
        ? this.form.controls.color_hex.value
        : `#${this.form.controls.color_hex.value}`,
    };
    this.overlaysService.create(payload).subscribe({
      next: (overlay) => {
        this.saving.set(false);
        this.router.navigate(['/overlays/edit', overlay.id]);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
