import { Component, signal, effect, ElementRef, inject, OnDestroy, DOCUMENT } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeSwitcher } from '../../../../shared/components/theme-switcher/theme-switcher';
import { SupabaseService } from '../../../../core/services/supabase';
import { Spinner } from '../../../../shared/components/spinner/spinner';
@Component({
  selector: 'app-nav-menu',
  imports: [RouterLink, RouterLinkActive, ThemeSwitcher, Spinner],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.css',
})
export class NavMenu implements OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly elementRef = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.document.addEventListener('click', this.clickChecker);
      } else {
        this.document.removeEventListener('click', this.clickChecker);
      }
    });
  }

  private readonly clickChecker = (event: MouseEvent) => {
    // Check if click is outside the profileBtn
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  };

  toggleState() {
    this.open.update((v) => !v);
  }
  async signOut() {
    try {
      this.loading.set(true);
      await this.supabase.signOut();
      this.open.set(false);
    } catch (error) {
      if (error instanceof Error) {
        this.errorMsg.set(error.message);
        setTimeout(() => this.errorMsg.set(null), 4000);
      }
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.document.removeEventListener('click', this.clickChecker);
  }
}
