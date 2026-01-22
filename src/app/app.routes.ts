import { Routes } from '@angular/router';
import { Sessions } from './features/sessions/sessions';
import { Products } from './features/products/products';
import { Analytics } from './features/analytics/analytics';
import { Settings } from './features/settings/settings';
import { PageNotFoundComponent } from './features/page-not-found-component/page-not-found-component';

export const routes: Routes = [
  {
    path: '',
    component: Sessions,
    pathMatch: 'full',
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
  { path: '**', component: PageNotFoundComponent, title: 'Page Not Found' },
];
