import { Component, signal, effect, ElementRef, inject, OnDestroy, DOCUMENT } from '@angular/core';

@Component({
  selector: 'app-profile-btn',
  imports: [],
  templateUrl: './profile-btn.html',
  styleUrl: './profile-btn.css',
})
export class ProfileBtn implements OnDestroy {
  // injecting for SSR in future if needed
  private elementRef = inject(ElementRef);
  private document = inject(DOCUMENT);
  activeTheme = signal<'light' | 'dark'>('dark');

  open = signal(false);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.document.addEventListener('click', this.clickChecker);
      } else {
        this.document.removeEventListener('click', this.clickChecker);
      }
    });
    let firstLoad = true;

    effect(() => {
      const theme = this.activeTheme();
      const html = this.document.documentElement;

      if (!firstLoad) {
        html.classList.add('disable-transitions');
      }
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);

      if (!firstLoad) {
        requestAnimationFrame(() => {
          html.classList.remove('disable-transitions');
        });
      }
      firstLoad = false;
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.activeTheme.set(savedTheme);
    }
  }

  private clickChecker = (event: MouseEvent) => {
    // Check if click is outside the profileBtn
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  };

  toggleState() {
    this.open.update((v) => !v);
  }
  setTheme(theme: 'light' | 'dark') {
    this.activeTheme.set(theme);
  }

  ngOnDestroy() {
    this.document.removeEventListener('click', this.clickChecker);
  }
}
