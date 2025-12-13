import { Routes } from '@angular/router';
import { Sessions } from './sessions/sessions';
import { Products } from './products/products';
import { Analytics } from './analytics/analytics';

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
  //when page not found redirected to sessions
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
