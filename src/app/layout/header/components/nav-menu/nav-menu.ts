import { Component, signal, effect, ElementRef, inject, OnDestroy, DOCUMENT } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeSwitcher } from './theme-switcher/theme-switcher';
@Component({
  selector: 'app-nav-menu',
  imports: [RouterLink, RouterLinkActive, ThemeSwitcher],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.css',
})
export class NavMenu implements OnDestroy {
  private elementRef = inject(ElementRef);
  private document = inject(DOCUMENT);
  readonly open = signal(false);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.document.addEventListener('click', this.clickChecker);
      } else {
        this.document.removeEventListener('click', this.clickChecker);
      }
    });
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

  ngOnDestroy() {
    this.document.removeEventListener('click', this.clickChecker);
  }
}
