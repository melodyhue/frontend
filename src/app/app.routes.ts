import { Routes } from '@angular/router';
import { adminOnlyCanMatch, moderatorOrAdminCanMatch } from './core/guards/role.guard';
import { authRequiredCanMatch, unauthOnlyCanMatch } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./components/pages/about/about.component').then((m) => m.AboutComponent),
      },
    ],
  },
  {
    path: 'developer/api/:userId/infos',
    loadComponent: () =>
      import('./components/pages/developer/api/infos/infos.component').then(
        (m) => m.InfosComponent
      ),
  },
  {
    path: 'developer/api/:userId/color',
    loadComponent: () =>
      import('./components/pages/developer/api/color/color.component').then(
        (m) => m.ColorComponent
      ),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canMatch: [unauthOnlyCanMatch],
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./components/pages/auth/login/login.component').then((m) => m.LoginComponent),
          },
          {
            path: 'otp',
            canMatch: [unauthOnlyCanMatch],
            loadComponent: () =>
              import('./components/pages/auth/login/otp/otp.component').then((m) => m.OtpComponent),
          },
        ],
      },
      {
        path: 'register',
        canMatch: [unauthOnlyCanMatch],
        loadComponent: () =>
          import('./components/pages/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
      },
      {
        path: 'logout',
        loadComponent: () =>
          import('./components/pages/auth/logout/logout.component').then((m) => m.LogoutComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./components/pages/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./components/pages/auth/reset/reset.component').then((m) => m.ResetComponent),
      },
      {
        path: 'spotify',
        children: [
          {
            path: 'callback',
            loadComponent: () =>
              import('./components/pages/auth/spotify/callback/callback.component').then(
                (m) => m.CallbackComponent
              ),
          },
        ],
      },
    ],
  },
  {
    path: 'overlay/:userId/:overlayId',
    loadComponent: () =>
      import('./components/pages/overlays/view/view.component').then((m) => m.ViewComponent),
  },
  {
    path: 'overlay/:overlayId',
    loadComponent: () =>
      import('./components/pages/overlays/view/view.component').then((m) => m.ViewComponent),
  },
  {
    path: '',
    canMatch: [authRequiredCanMatch],
    loadComponent: () =>
      import('./components/layouts/private-layout/private-layout.component').then(
        (m) => m.PrivateLayoutComponent
      ),
    children: [
      {
        path: 'profile',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/pages/profile/profile.component').then(
                (m) => m.ProfileComponent
              ),
          },
          {
            path: 'edit',
            loadComponent: () =>
              import('./components/pages/profile/edit/edit.component').then((m) => m.EditComponent),
          },
          {
            path: 'security',
            loadComponent: () =>
              import('./components/pages/profile/security/security.component').then(
                (m) => m.SecurityComponent
              ),
          },
        ],
      },
      {
        path: 'overlays',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/pages/overlays/overlays.component').then(
                (m) => m.OverlaysComponent
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./components/pages/overlays/create/create.component').then(
                (m) => m.CreateComponent
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./components/pages/overlays/edit/edit.component').then(
                (m) => m.EditComponent
              ),
          },
          {
            path: 'copy/:id',
            loadComponent: () =>
              import('./components/pages/overlays/copy/copy.component').then(
                (m) => m.CopyComponent
              ),
          },
          {
            path: 'delete/:id',
            loadComponent: () =>
              import('./components/pages/overlays/delete/delete.component').then(
                (m) => m.DeleteComponent
              ),
          },
        ],
      },
      {
        path: 'developer',
        children: [
          {
            path: 'api',
            pathMatch: 'full',
            loadComponent: () =>
              import('./components/pages/developer/api/api.component').then((m) => m.ApiComponent),
          },
        ],
      },
      {
        path: 'settings',
        children: [
          {
            path: 'general',
            loadComponent: () =>
              import('./components/pages/settings/general/general.component').then(
                (m) => m.GeneralComponent
              ),
          },
          {
            path: 'appearance',
            loadComponent: () =>
              import('./components/pages/settings/appearance/appearance.component').then(
                (m) => m.AppearanceComponent
              ),
          },
          {
            path: 'language',
            loadComponent: () =>
              import('./components/pages/settings/language/language.component').then(
                (m) => m.LanguageComponent
              ),
          },
        ],
      },
      {
        path: 'admin',
        canMatch: [adminOnlyCanMatch],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/pages/admin/admin.component').then((m) => m.AdminComponent),
          },
        ],
      },
      {
        path: 'modo',
        canMatch: [moderatorOrAdminCanMatch],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/pages/modo/modo.component').then((m) => m.ModoComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'legal',
    children: [
      {
        path: 'terms',
        loadComponent: () =>
          import('./components/pages/legal/terms/terms.component').then((m) => m.TermsComponent),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./components/pages/legal/privacy/privacy.component').then(
            (m) => m.PrivacyComponent
          ),
      },
    ],
  },
];
