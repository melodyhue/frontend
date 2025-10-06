# Button Component

Composant bouton réutilisable avec plusieurs variantes et tailles.

## Utilisation

```typescript
import { ButtonComponent } from './components/shared/button/button.component';

@Component({
  imports: [ButtonComponent],
  // ...
})
```

```html
<!-- Basique -->
<app-button>Click me</app-button>

<!-- Avec variante -->
<app-button variant="secondary">Secondary</app-button>
<app-button variant="outline">Outline</app-button>
<app-button variant="ghost">Ghost</app-button>

<!-- Avec taille -->
<app-button size="sm">Small</app-button>
<app-button size="lg">Large</app-button>

<!-- Full width -->
<app-button [fullWidth]="true">Full Width</app-button>

<!-- Disabled -->
<app-button [disabled]="true">Disabled</app-button>

<!-- Type submit -->
<app-button type="submit">Submit</app-button>

<!-- Avec événement -->
<app-button (clicked)="handleClick()">Click me</app-button>

<!-- Avec aria-label -->
<app-button [ariaLabel]="'Ouvrir le menu'">☰</app-button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Style du bouton |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille du bouton |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Type HTML du bouton |
| `disabled` | `boolean` | `false` | Active/désactive le bouton |
| `fullWidth` | `boolean` | `false` | Le bouton prend toute la largeur |
| `ariaLabel` | `string` | `undefined` | Label d'accessibilité |

## Events

| Event | Description |
|-------|-------------|
| `clicked` | Émis lors du clic (uniquement si non désactivé) |

## Variantes

### Primary
Bouton principal avec dégradé vert/cyan - à utiliser pour les actions principales.

### Secondary
Bouton secondaire avec fond semi-transparent blanc - pour les actions secondaires.

### Outline
Bouton avec bordure colorée et fond transparent - pour les actions tertiaires.

### Ghost
Bouton minimaliste sans bordure - pour les actions discrètes.
