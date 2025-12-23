import { Component, DOCUMENT, inject, signal } from '@angular/core';

@Component({
  selector: 'app-theme-switcher',
  imports: [],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.css',
})
export class ThemeSwitcher {
  private document = inject(DOCUMENT);
  isAnimating = signal<'sun' | 'moon' | null>(null);
  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.setTheme(savedTheme, null);
    } else {
      // data theme systme doesnt actually exist, but when data theme has any other value than light and dark, it defaults to system value
      this.setTheme('system', null);
    }
  }

  setTheme(theme: 'light' | 'dark' | 'system', icon: 'sun' | 'moon' | null) {
    const html = this.document.documentElement;

    //disable stransition so whole document doesnt transit/ looks weird
    html.classList.add('disable-transitions');

    html.setAttribute('data-theme', theme);

    //this applys animation to clicked buttons icon
    this.isAnimating.set(icon);

    localStorage.setItem('theme', theme);

    requestAnimationFrame(() => {
      html.classList.remove('disable-transitions');
    });
  }

  onAnimationEnd() {
    this.isAnimating.set(null);
  }
}
