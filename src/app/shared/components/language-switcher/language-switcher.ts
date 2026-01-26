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
    const pathname = window.location.pathname;
    this.loading.set(true);

    if (this.currentLocale === 'ka') {
      window.location.href = pathname.replace('/ka', '/en');
    } else {
      window.location.href = pathname.replace('/en', '/ka');
    }
  }
}
