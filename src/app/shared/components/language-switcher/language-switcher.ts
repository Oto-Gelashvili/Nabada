import { Component, inject, LOCALE_ID, signal } from '@angular/core';
import { Loader } from '../loader/loader';

@Component({
  selector: 'app-language-switcher',
  imports: [Loader],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  private readonly currentLocale = inject(LOCALE_ID);
  readonly loading = signal(false);

  switchLang() {
    this.loading.set(true);
    const pathname = window.location.pathname;

    if (this.currentLocale === 'ka') {
      localStorage.setItem('preferred-locale', 'en');
      const newPath = pathname.replace('/ka', '') || '/';
      window.location.href = newPath;
    } else {
      localStorage.setItem('preferred-locale', 'ka');
      window.location.href = pathname.replace('/en', '/ka');
    }
  }
}
