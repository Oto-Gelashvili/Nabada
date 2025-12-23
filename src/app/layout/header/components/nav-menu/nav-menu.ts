import { Component, signal, effect, ElementRef, inject, OnDestroy, DOCUMENT } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
@Component({
  selector: 'app-profile-btn',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.css',
})
export class ProfileBtn implements OnDestroy {
  // injecting for SSR in future if needed
  private elementRef = inject(ElementRef);
  private document = inject(DOCUMENT);
  isAnimating = signal<'sun' | 'moon' | null>(null);
  open = signal(false);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.document.addEventListener('click', this.clickChecker);
      } else {
        this.document.removeEventListener('click', this.clickChecker);
      }
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.setTheme(savedTheme, null);
    } else {
      // data theme systme doesnt actually exist, but when data theme has any other value than light and dark, it defaults to system value
      this.setTheme('system', null);
    }
  }

  private clickChecker = (event: MouseEvent) => {
    // Check if click is outside the profileBtn
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  };

  toggleState() {
    this.isAnimating.set(null);
    this.open.update((v) => !v);
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

  ngOnDestroy() {
    this.document.removeEventListener('click', this.clickChecker);
  }
}
