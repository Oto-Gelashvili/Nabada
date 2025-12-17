import { Routes } from '@angular/router';
import { Sessions } from './features/sessions/sessions';
import { Products } from './features/products/products';
import { Analytics } from './features/analytics/analytics';
import { Settings } from './features/settingsPage/settings';

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
  //when page not found redirected to sessions
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
