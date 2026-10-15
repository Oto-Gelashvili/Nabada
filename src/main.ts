/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}
const savedLocale = localStorage.getItem('preferred-locale');
const pathname = window.location.pathname;

if (savedLocale === 'ka' && !pathname.startsWith('/ka') && !pathname.startsWith('/en')) {
  const targetPath = pathname === '/' ? '' : pathname;
  window.location.replace(`/ka${targetPath}`);
}
