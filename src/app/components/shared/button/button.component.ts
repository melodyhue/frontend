import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { Router } from '@angular/router';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'cancel'
  | 'success'
  | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"app-button app-button--" + variant() + " app-button--" + size()',
    '[class.app-button--disabled]': 'disabled()',
    '[class.app-button--full-width]': 'fullWidth()',
  },
})
export class ButtonComponent {
  private readonly router = inject(Router);
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly disabled = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly ariaLabel = input<string>();
  // Navigation helpers (optional)
  readonly routerLink = input<string | any[]>();
  readonly href = input<string>();
  readonly target = input<string>();
  readonly rel = input<string>();

  readonly clicked = output<void>();

  handleClick(event?: Event): void {
    if (this.disabled()) {
      // Empêcher navigation si lien désactivé
      if (event) event.preventDefault();
      return;
    }
    // Émettre l'événement utilisateur
    this.clicked.emit();
    // Navigation interne si routerLink fourni
    const link = this.routerLink();
    if (link) {
      if (event) event.preventDefault();
      if (typeof link === 'string') {
        void this.router.navigateByUrl(link);
      } else if (Array.isArray(link)) {
        void this.router.navigate(link);
      }
      return;
    }
    // Navigation externe si href fourni
    const url = this.href();
    if (url) {
      if (event) event.preventDefault();
      const tgt = this.target();
      const rel = this.rel();
      if (tgt) {
        window.open(url, tgt, rel ? `rel=${rel}` : undefined);
      } else {
        window.location.href = url;
      }
    }
  }
}
