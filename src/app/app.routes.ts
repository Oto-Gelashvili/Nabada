import { Routes } from '@angular/router';
import { Sessions } from './features/sessions/sessions';
import { Products } from './features/products/products';
import { Analytics } from './features/analytics/analytics';
import { Settings } from './features/settings/settings';
import { PageNotFoundComponent } from './features/page-not-found-component/page-not-found-component';
import { BlankLayout } from './layouts/blank-layout/blank-layout';
import { SignIn } from './features/auth/pages/sign-in/sign-in';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { LandingHome } from './features/landing/pages/landing-home/landing-home';

export const routes: Routes = [
  {
    path: 'signups',
    component: BlankLayout,
    children: [{ path: '', component: SignIn, title: 'Sign In' }],
  },
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        component: LandingHome,
        pathMatch: 'full',
        title: 'Landing page',
      },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    canActivate: [],
    children: [
      {
        path: 'sessions',
        component: Sessions,
        title: 'Sessions Page',
      },
      {
        path: 'products',
        component: Products,
        title: 'Products Page',
      },
      {
        path: 'analytics',
        component: Analytics,
        title: 'Analytics Page',
      },
      {
        path: 'settings',
        component: Settings,
        title: 'Settings Page',
      },
    ],
  },
  { path: '**', component: PageNotFoundComponent, title: 'Page Not Found' },
];
