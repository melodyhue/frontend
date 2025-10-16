import { RenderMode, ServerRoute } from '@angular/ssr';

// Définir explicitement les routes avec paramètres pour ne PAS être prerender,
// afin d'éviter l'exigence getPrerenderParams.
export const serverRoutes: ServerRoute[] = [
  // Routes statiques à prerender
  { path: '', renderMode: RenderMode.Prerender }, // Home
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'auth/login', renderMode: RenderMode.Prerender },
  { path: 'auth/signup', renderMode: RenderMode.Prerender },
  { path: 'auth/forgot-password', renderMode: RenderMode.Prerender },
  { path: 'legal/terms', renderMode: RenderMode.Prerender },
  { path: 'legal/privacy', renderMode: RenderMode.Prerender },

  // Routes dynamiques API développeur
  { path: 'developer/api/:userId/infos', renderMode: RenderMode.Server },
  { path: 'developer/api/:userId/color', renderMode: RenderMode.Server },

  // Routes d'overlay dynamiques
  { path: 'overlay/:userId/:overlayId', renderMode: RenderMode.Server },
  { path: 'overlay/:overlayId', renderMode: RenderMode.Server },

  // Routes d'édition/copie/suppression avec params
  { path: 'overlays/edit/:id', renderMode: RenderMode.Server },
  { path: 'overlays/copy/:id', renderMode: RenderMode.Server },
  { path: 'overlays/delete/:id', renderMode: RenderMode.Server },

  // Routes Modo - users (toutes dynamiques => Server)
  { path: 'modo/users/view/:id', renderMode: RenderMode.Server },
  { path: 'modo/users/edit/:id', renderMode: RenderMode.Server },
  { path: 'modo/users/warn/:id', renderMode: RenderMode.Server },
  { path: 'modo/users/ban/:id', renderMode: RenderMode.Server },

  // Routes Modo - overlays (dynamiques)
  { path: 'modo/overlays/edit/:id', renderMode: RenderMode.Server },
  { path: 'modo/overlays/delete/:id', renderMode: RenderMode.Server },

  // Route Admin warnlist delete (dynamiques)
  { path: 'admin/warnlist/delete/:warning_id/:user_id', renderMode: RenderMode.Server },

  // Eviter le prerender sur la page logout (déclenche des appels API)
  { path: 'auth/logout', renderMode: RenderMode.Server },

  // Toutes les autres routes (404, routes authentifiées, etc.) en mode Server
  { path: '*', renderMode: RenderMode.Server },
];
