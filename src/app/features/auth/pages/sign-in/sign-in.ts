import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase';
import { Spinner } from '../../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-sign-ing',
  imports: [FormsModule, Spinner],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  readonly email = signal('');
  readonly isShaking = signal(false);
  readonly isLoading = signal(false);
  readonly isSignInMode = signal(false);
  readonly notification = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  private readonly supabase = inject(SupabaseService);
  async submit(form: NgForm) {
    if (form.invalid) {
      this.triggerShake();
      return;
    }
    this.isLoading.set(true);
    try {
      const { error } = await this.supabase.signIn(this.email());
      if (error) throw error;
      this.showNotification('Check your email for the login link!', 'success');
      form.resetForm();
    } catch (error) {
      if (error instanceof Error) {
        this.showNotification(error.message, 'error');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    try {
      const { error } = await this.supabase.signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        this.showNotification(error.message, 'error');
      }
    }
  }
  private triggerShake() {
    this.isShaking.set(true);
    setTimeout(() => {
      this.isShaking.set(false);
    }, 400);
  }

  toggleSignInMode() {
    this.isSignInMode.update((mode) => !mode);
  }
  private showNotification(message: string, type: 'success' | 'error') {
    this.notification.set({ message, type });
    setTimeout(() => {
      this.notification.set(null);
    }, 4000);
  }
}
