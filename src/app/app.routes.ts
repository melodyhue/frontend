import { Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { AboutComponent } from './components/pages/about/about.component';
import { MainLayoutComponent } from './components/layouts/main-layout/main-layout.component';
import { PrivateLayoutComponent } from './components/layouts/private-layout/private-layout.component';
import { LoginComponent } from './components/pages/auth/login/login.component';
import { RegisterComponent } from './components/pages/auth/register/register.component';
import { ProfileComponent } from './components/pages/profile/profile.component';
import { EditComponent } from './components/pages/profile/edit/edit.component';
import { SecurityComponent } from './components/pages/profile/security/security.component';
import { GeneralComponent } from './components/pages/settings/general/general.component';
import { AppearanceComponent } from './components/pages/settings/appearance/appearance.component';
import { LanguageComponent } from './components/pages/settings/language/language.component';
import { LogoutComponent } from './components/pages/auth/logout/logout.component';
import { ForgotPasswordComponent } from './components/pages/auth/forgot-password/forgot-password.component';
import { TermsComponent } from './components/pages/legal/terms/terms.component';
import { PrivacyComponent } from './components/pages/legal/privacy/privacy.component';
import { OverlaysComponent } from './components/pages/overlays/overlays.component';
import { EditComponent as OverlayEditComponent } from './components/pages/overlays/edit/edit.component';
import { CreateComponent } from './components/pages/overlays/create/create.component';
import { CopyComponent } from './components/pages/overlays/copy/copy.component';
import { DeleteComponent } from './components/pages/overlays/delete/delete.component';
import { ViewComponent } from './components/pages/overlays/view/view.component';
import { ApiComponent } from './components/pages/developer/api/api.component';
import { InfosComponent } from './components/pages/developer/api/infos/infos.component';
import { ColorComponent } from './components/pages/developer/api/color/color.component';
import { OtpComponent } from './components/pages/auth/login/otp/otp.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'about',
        component: AboutComponent,
      },
    ],
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: LoginComponent,
          },
          {
            path: 'otp',
            component: OtpComponent,
          },
        ],
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
      {
        path: 'logout',
        component: LogoutComponent,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },
    ],
  },
  {
    path: 'overlay/:userId/:overlayId',
    component: ViewComponent,
  },
  {
    path: '',
    component: PrivateLayoutComponent,
    children: [
      {
        path: 'profile',
        children: [
          {
            path: '',
            component: ProfileComponent,
          },
          {
            path: 'edit',
            component: EditComponent,
          },
          {
            path: 'security',
            component: SecurityComponent,
          },
        ],
      },
      {
        path: 'overlays',
        children: [
          {
            path: '',
            component: OverlaysComponent,
          },
          {
            path: 'create',
            component: CreateComponent,
          },
          {
            path: 'edit/:id',
            component: OverlayEditComponent,
          },
          {
            path: 'copy/:id',
            component: CopyComponent,
          },
          {
            path: 'delete/:id',
            component: DeleteComponent,
          },
        ],
      },
      {
        path: 'developer',
        children: [
          {
            path: 'api',
            component: ApiComponent,
          },
          {
            path: 'api/:userId/infos',
            component: InfosComponent,
          },
          {
            path: 'api/:userId/color',
            component: ColorComponent,
          },
        ],
      },
      {
        path: 'settings',
        children: [
          {
            path: 'general',
            component: GeneralComponent,
          },
          {
            path: 'appearance',
            component: AppearanceComponent,
          },
          {
            path: 'language',
            component: LanguageComponent,
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
        component: TermsComponent,
      },
      {
        path: 'privacy',
        component: PrivacyComponent,
      },
    ],
  },
];
