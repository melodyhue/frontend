import { RenderMode, ServerRoute } from '@angular/ssr';

// Définir explicitement les routes avec paramètres pour ne PAS être prerender,
// afin d'éviter l'exigence getPrerenderParams.
export const serverRoutes: ServerRoute[] = [
  // Routes statiques à prerender
  { path: '', renderMode: RenderMode.Prerender }, // Home
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'auth/login', renderMode: RenderMode.Prerender },
  // OTP implique souvent un flux temporaire; éviter le prerender.
  { path: 'auth/login/otp', renderMode: RenderMode.Server },
  { path: 'auth/register', renderMode: RenderMode.Prerender },
  { path: 'auth/forgot-password', renderMode: RenderMode.Prerender },
  // Page de reset (avec token en query) — ne pas prerender.
  { path: 'auth/reset', renderMode: RenderMode.Server },
  { path: 'legal/terms', renderMode: RenderMode.Prerender },
  { path: 'legal/privacy', renderMode: RenderMode.Prerender },

  // Groupes Auth additionnels
  { path: 'auth/logout', renderMode: RenderMode.Server },
  { path: 'auth/spotify', renderMode: RenderMode.Server },
  { path: 'auth/2fa/setup', renderMode: RenderMode.Server },
  { path: 'auth/2fa/verify', renderMode: RenderMode.Server },
  { path: 'auth/2fa/disable', renderMode: RenderMode.Server },
  { path: 'auth/2fa', renderMode: RenderMode.Server },
  { path: 'auth/spotify/callback', renderMode: RenderMode.Server },

  // Routes dynamiques API développeur
  { path: 'developer/api', renderMode: RenderMode.Server },
  { path: 'developer/api/:userId/infos', renderMode: RenderMode.Server },
  { path: 'developer/api/:userId/color', renderMode: RenderMode.Server },

  // Routes d'overlay dynamiques
  { path: 'overlays', renderMode: RenderMode.Server },
  { path: 'overlays/create', renderMode: RenderMode.Server },
  { path: 'overlay/:userId/:overlayId', renderMode: RenderMode.Server },
  { path: 'overlay/:overlayId', renderMode: RenderMode.Server },

  // Routes d'édition/copie/suppression avec params
  { path: 'overlays/edit/:id', renderMode: RenderMode.Server },
  { path: 'overlays/copy/:id', renderMode: RenderMode.Server },
  { path: 'overlays/delete/:id', renderMode: RenderMode.Server },

  // Routes profil
  { path: 'profile', renderMode: RenderMode.Server },
  { path: 'profile/edit', renderMode: RenderMode.Server },
  { path: 'profile/security', renderMode: RenderMode.Server },

  // Settings
  { path: 'settings/general', renderMode: RenderMode.Server },
  { path: 'settings/appearance', renderMode: RenderMode.Server },
  { path: 'settings/language', renderMode: RenderMode.Server },

  // Routes Modo - users (toutes dynamiques => Server)
  { path: 'modo/users', renderMode: RenderMode.Server },
  { path: 'modo/users/view/:id', renderMode: RenderMode.Server },
  { path: 'modo/users/edit/:id', renderMode: RenderMode.Server },
  { path: 'modo/users/warn/:id', renderMode: RenderMode.Server },
  { path: 'modo/users/ban/:id', renderMode: RenderMode.Server },

  // Routes Modo - overlays (dynamiques)
  { path: 'modo/overlays', renderMode: RenderMode.Server },
  { path: 'modo/overlays/edit/:id', renderMode: RenderMode.Server },
  { path: 'modo/overlays/delete/:id', renderMode: RenderMode.Server },

  // Route Admin warnlist delete (dynamiques)
  { path: 'admin', renderMode: RenderMode.Server },
  { path: 'admin/roles', renderMode: RenderMode.Server },
  { path: 'admin/warnlist', renderMode: RenderMode.Server },
  { path: 'admin/warnlist/delete/:warning_id/:user_id', renderMode: RenderMode.Server },

  // Toutes les autres routes (404, routes authentifiées, etc.) en mode Server
  { path: ':path(.*)', renderMode: RenderMode.Server },
];
