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
import { LogoutComponent } from './components/pages/auth/logout/logout.component';

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
        component: LoginComponent,
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
      {
        path: 'logout',
        component: LogoutComponent,
      },
    ],
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
        ],
      },
    ],
  },
];
