# Sidebar Component

Composant de navigation latérale pour les pages privées (profil, paramètres, compte).

## Utilisation

La sidebar est utilisée dans le `PrivateLayoutComponent` et affiche automatiquement les sections de navigation.

### Dans un layout

```typescript
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  imports: [SidebarComponent],
  // ...
})
```

```html
<app-sidebar></app-sidebar>
<main>
  <router-outlet></router-outlet>
</main>
```

## Structure

La sidebar contient 3 sections principales :

### 1. Profil
- Mon profil (`/profile`)
- Modifier (`/profile/edit`)
- Sécurité (`/profile/security`)

### 2. Paramètres
- Général (`/settings/general`)
- Apparence (`/settings/appearance`)
- Notifications (`/settings/notifications`)

### 3. Compte
- Abonnement (`/account/subscription`)
- Facturation (`/account/billing`)

## Personnalisation

Pour modifier les sections et items, éditer la propriété `sections` dans `sidebar.component.ts` :

```typescript
readonly sections: readonly SidebarSection[] = [
  {
    title: 'Ma Section',
    items: [
      { path: '/mon-chemin', label: 'Mon Item', icon: '🎯', exact: true },
    ],
  },
];
```

## Responsive

- **Desktop** : Sidebar verticale à gauche (280px)
- **Mobile** : Sidebar horizontale en haut, scrollable

## Features

- ✅ Navigation active avec indicateur visuel
- ✅ Icons émojis personnalisables
- ✅ Hover states et focus states
- ✅ Responsive design
- ✅ Scrollbar custom
- ✅ Support routerLink Angular
