import { Component, signal, effect, ElementRef, inject, OnDestroy, DOCUMENT } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-profile-btn',
  imports: [RouterLink],
  templateUrl: './profile-btn.html',
  styleUrl: './profile-btn.css',
})
export class ProfileBtn implements OnDestroy {
  // injecting for SSR in future if needed
  private elementRef = inject(ElementRef);
  private document = inject(DOCUMENT);

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
      this.setTheme(savedTheme);
    } else {
      // data theme systme doesnt actually exist, but when data theme has any other value than light and dark, it defaults to system value
      this.setTheme('system');
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
  setTheme(theme: 'light' | 'dark' | 'system') {
    const html = this.document.documentElement;

    html.classList.add('disable-transitions');

    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    requestAnimationFrame(() => {
      html.classList.remove('disable-transitions');
    });
  }

  ngOnDestroy() {
    this.document.removeEventListener('click', this.clickChecker);
  }
}
