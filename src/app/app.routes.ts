import { Routes } from '@angular/router';
import { BlankLayout } from './layouts/blank-layout/blank-layout';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'signups',
    component: BlankLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/auth/pages/sign-in/sign-in').then((m) => m.SignIn),
        title: 'Sign In',
      },
    ],
  },
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/landing/pages/landing-home/landing-home').then((m) => m.LandingHome),
        pathMatch: 'full',
        title: 'Landing page',
      },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'sessions',
        loadComponent: () => import('./features/sessions/sessions').then((m) => m.Sessions),
        title: 'Sessions Page',
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products').then((m) => m.Products),
        title: 'Products Page',
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics),
        title: 'Analytics Page',
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
        title: 'Settings Page',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/page-not-found-component/page-not-found-component').then(
        (m) => m.PageNotFoundComponent,
      ),
    title: 'Page Not Found',
  },
];
