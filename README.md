# MelodyHue – Frontend (Angular 20 + SSR)

[![GitHub Release](https://img.shields.io/github/v/release/laxe4k/melodyhue-frontend)](https://github.com/laxe4k/melodyhue-frontend/releases)
[![GitHub Release Date](https://img.shields.io/github/release-date/laxe4k/melodyhue-frontend)](https://github.com/laxe4k/melodyhue-frontend/releases)
[![GitHub License](https://img.shields.io/github/license/laxe4k/melodyhue-frontend)](https://github.com/laxe4k/melodyhue-frontend/blob/main/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/laxe4k/melodyhue-frontend)](https://github.com/laxe4k/melodyhue-frontend/graphs/contributors)
[![GitHub Issues](https://img.shields.io/github/issues/laxe4k/melodyhue-frontend)](https://github.com/laxe4k/melodyhue-frontend/issues)

Interface web d’affichage et de gestion des overlays MelodyHue. Application Angular 20 (standalone, signals, OnPush) avec rendu SSR côté Node et un proxy intégré vers l’API publique/privée.

---

## ✨ Périmètre rapide

- Angular 20 (standalone components, Router, HttpClient)
- SSR via `@angular/ssr` + Express (fichier `src/server.ts`)
- Intercepteur API qui préfixe automatiquement les appels (`API_BASE_URL`) et gère `withCredentials`
- Pages publiques (home, about, legal, …) et pages privées (profile, overlays, settings, admin/modo)
- Endpoints développeur pour récupérer du JSON brut: `/developer/api/:userId/(infos|color)`

---

## 🧰 Prérequis

- Node.js 20 LTS recommandé (Angular 20)
- npm ≥ 10

---

## 🚀 Installation

Dans le dossier `melodyhue-frontend`:

```powershell
npm install
```

---

## ▶️ Démarrer en développement

Lance le serveur de dev (Angular CLI + SSR) sur http://localhost:4200 :

```powershell
npm start
```

Le hot-reload est activé. Le SSR côté Node est géré par Angular CLI en dev et utilise la configuration de `src/server.ts` (dont le proxy d’API).

---

## 🔧 Variables d’environnement

Un fichier `.env.example` est fourni. Copiez‑le si besoin vers `.env` à la racine du projet.

- `API_BASE_URL` (défaut: `https://api.melodyhue.com`) – Base de l’API FastAPI en amont. Utilisée par:
	- l’intercepteur HTTP (préfixe des URLs relatives non proxifiées)
	- le serveur SSR/Express pour les proxys `/infos`, `/color`, `/health`, mais aussi pour les routes authentifiées (`/auth`, `/users`, `/settings`, `/overlays`, `/overlay`, `/spotify`, `/admin`, `/modo`)
- `PORT` (défaut: `3000` quand vous servez le build SSR via Node)
- `NODE_ENV` (`development`/`production`)
- `PROXY_FORWARD` (`fetch` | `redirect`, défaut `fetch`) – Sur SSR, choisir redirection au lieu du fetch serveur si votre hébergeur bloque les requêtes sortantes.
- `DEBUG_PROXY` (`1` pour activer des logs proxy côté SSR)

Exemple (PowerShell):

```powershell
$env:API_BASE_URL = "https://api.melodyhue.com"
npm start
```

---

## 📜 Scripts npm utiles

- `npm start` → `ng serve` (dev + SSR)
- `npm run build` → build dev
- `npm run build:prod` → build de prod optimisé
- `npm run start:prod` → sert le build SSR via Node (`dist/melodyhue-frontend/server/server.mjs`)
- `npm run serve:ssr:melodyhue-frontend` → alias pour servir le SSR après build
- `npm test` → tests unitaires (Karma + Jasmine)

---

## 🏗️ Build et exécution en production

1) Construire:

```powershell
npm run build:prod
```

2) Lancer le serveur SSR Node (Express):

```powershell
npm run start:prod
```

Le serveur écoute sur le port `PORT` (défaut `3000`). Placez un reverse proxy (Nginx/Caddy/Traefik) en frontal si nécessaire. Le proxy interne réécrit les cookies `Set-Cookie` pour rester sur le même domaine et applique `Secure; SameSite=None` en HTTPS.

---

## 🌐 Intégration API & Réseau

- Intercepteur: `src/app/core/interceptors/api-prefix.interceptor.ts`
	- Préfixe les appels relatifs avec `API_BASE_URL` sauf pour les routes gérées en même origine par le SSR (`/auth`, `/users`, `/settings`, `/overlays`, `/overlay`, `/spotify`, `/admin`, `/modo`, `/developer/api/*`).
	- Force `withCredentials: true` pour envoyer/recevoir les cookies (auth HttpOnly).
	- N’ajoute pas d’Authorization pour les endpoints publics (`/infos`, `/color`, `/health`, `/auth/*`, `/overlay/*`).
- SSR/Proxy: `src/server.ts`
	- Proxifie en même origine les routes authentifiées afin d’émettre et consommer des cookies HttpOnly sans CORS.
	- Endpoints développeur JSON direct: `/developer/api/:userId/infos` et `/developer/api/:userId/color` (bypass Angular, renvoient le JSON de l’API amont).
	- Paramètres: `API_BASE_URL`, `PROXY_FORWARD` (`fetch` ou `redirect`).

---

## 📁 Structure principale

- `src/app/components/layouts` – gabarits `main-layout` et `private-layout`
- `src/app/components/pages` – pages (about, home, auth, profile, overlays, settings, admin, modo, …)
- `src/app/core/services` – services métier (auth, users, settings, overlays, public, spotify, …)
- `src/app/core/interceptors` – intercepteurs HTTP (`api-prefix`, `auth-refresh`)
- `src/app/core/tokens` – tokens d’injection (`API_BASE_URL`)
- `src/server.ts` – serveur SSR Express + proxy

Conventions Angular appliquées: standalone components, `ChangeDetectionStrategy.OnPush`, usage de signals pour l’état local.

---

## ✅ Tests unitaires

```powershell
npm test
```

Karma + Jasmine. Les tests résident aux côtés des fichiers (`*.spec.ts`).

---

## 🧪 Endpoints utiles (dev)

- Public: `GET /infos/:userId`, `GET /color/:userId`, `GET /health`
- Développeur (JSON brut):
	- `GET /developer/api/:userId/infos`
	- `GET /developer/api/:userId/color`

Ces routes sont servies par le SSR et reçoivent la réponse de l’API configurée par `API_BASE_URL`.

---

## 🩺 Dépannage rapide

- Cookies non conservés après login: vérifier que l’app est servie en HTTPS avec `SameSite=None; Secure` et que le domaine correspond. Le proxy SSR réécrit déjà `Domain` et ajoute `Secure/SameSite` en HTTPS.
- 401 sur pages privées au rechargement: assurez‑vous que le backend expose bien les endpoints `/auth/refresh` et que `API_BASE_URL` pointe vers le bon hôte.
- CORS: en dev, utilisez les routes proxifiées (même origine). Évitez d’appeler directement l’API amont depuis le navigateur si elle n’autorise pas l’origine de dev.
- Hébergement qui bloque les sorties HTTP: définissez `PROXY_FORWARD=redirect` pour rediriger plutôt que d’effectuer le fetch côté serveur.

---

## 📄 Licence

MIT – voir `LICENSE`.

