import { Component, DOCUMENT, inject, signal } from '@angular/core';

@Component({
  selector: 'app-theme-switcher',
  imports: [],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.css',
})
export class ThemeSwitcher {
  private document = inject(DOCUMENT);
  readonly isAnimating = signal<'sun' | 'moon' | null>(null);

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
