import {
  Component,
  signal,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  DOCUMENT,
  OnInit,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeSwitcher } from '../../../../shared/components/theme-switcher/theme-switcher';
import { SupabaseService } from '../../../../core/services/supabase';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import { UserProfile } from '../../../../models/userProfile';
import { NotificationService } from '../../../../core/services/Notification';
@Component({
  selector: 'app-nav-menu',
  imports: [RouterLink, RouterLinkActive, ThemeSwitcher, Spinner],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.css',
})
export class NavMenu implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);
  readonly userProfile = signal<UserProfile | null>(null);
  private readonly elementRef = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  readonly open = signal(false);
  readonly loading = signal(false);
  private readonly notify = inject(NotificationService);
  constructor() {
    effect(() => {
      if (this.open()) {
        this.document.addEventListener('click', this.clickChecker);
      } else {
        this.document.removeEventListener('click', this.clickChecker);
      }
    });
  }

  async ngOnInit() {
    this.fetchProfile();
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
        this.notify.showError(error.message);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async fetchProfile() {
    try {
      const profile = await this.supabase.getCurrentProfile();

      if (profile) {
        this.userProfile.set(profile as UserProfile);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    }
  }

  ngOnDestroy() {
    this.document.removeEventListener('click', this.clickChecker);
  }
}
