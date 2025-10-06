# Locale Service - Gestion de la langue pour toute l'application

Le `LocaleService` gère la langue de l'application de manière centralisée et est disponible dans **toute l'application**.

## Utilisation

### 1. Dans un composant

```typescript
import { Component, inject, computed } from '@angular/core';
import { LocaleService } from '@app/core/services';

@Component({
  selector: 'app-my-component',
  template: `
    <h1>{{ title() }}</h1>
    <button (click)="localeService.toggleLocale()">
      {{ switchLanguageLabel() }}
    </button>
  `
})
export class MyComponent {
  readonly localeService = inject(LocaleService);

  readonly title = computed(() =>
    this.localeService.locale() === 'fr' 
      ? 'Bienvenue' 
      : 'Welcome'
  );

  readonly switchLanguageLabel = computed(() =>
    this.localeService.locale() === 'fr'
      ? 'Switch to English'
      : 'Passer en français'
  );
}
```

### 2. Accéder à la langue courante

```typescript
const currentLocale = this.localeService.locale(); // 'fr' ou 'en'
```

### 3. Changer la langue

```typescript
// Basculer entre fr et en
this.localeService.toggleLocale();

// Ou sélectionner une langue spécifique
this.localeService.selectLocale('en');
```

### 4. Réagir aux changements de langue

Le signal `locale` est réactif, utilisez `computed()` ou `effect()` :

```typescript
readonly message = computed(() => {
  const locale = this.localeService.locale();
  return locale === 'fr' 
    ? 'Bonjour le monde' 
    : 'Hello world';
});
```

## Fonctionnalités

- ✅ **Persistance automatique** : La langue sélectionnée est sauvegardée dans `localStorage` (`melodyhue:locale`)
- ✅ **Synchronisation HTML** : L'attribut `lang` du document HTML est automatiquement mis à jour
- ✅ **SSR-safe** : Fonctionne correctement avec le rendu côté serveur
- ✅ **Réactif** : Utilise les signals Angular pour une réactivité optimale
- ✅ **Global** : Service singleton disponible dans toute l'application

## Langues supportées

- `fr` : Français (langue par défaut)
- `en` : English

## Storage Key

La clé utilisée dans localStorage est définie dans `core/constants/storage-keys.ts` :

```typescript
export const LOCALE_STORAGE_KEY = 'melodyhue:locale';
```

## Architecture

```
src/app/core/
├── constants/
│   └── storage-keys.ts          # LOCALE_STORAGE_KEY
├── services/
│   ├── locale.service.ts        # Service principal
│   ├── locale.service.spec.ts   # Tests
│   └── index.ts                 # Export centralisé
└── index.ts                     # Export du module core
```

## Exemples d'utilisation dans l'app

### Navigation Component
Le composant de navigation utilise déjà le service pour gérer le sélecteur de langue.

### Pages d'authentification
Vous pouvez l'utiliser pour internationaliser les messages d'erreur, les labels, etc.

```typescript
readonly emailLabel = computed(() =>
  this.localeService.locale() === 'fr' ? 'E-mail' : 'Email'
);

readonly passwordLabel = computed(() =>
  this.localeService.locale() === 'fr' ? 'Mot de passe' : 'Password'
);
```

## Tests

Le service inclut des tests unitaires complets. Pour les exécuter :

```bash
npm test
```
