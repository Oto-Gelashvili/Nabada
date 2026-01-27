import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import { ErrorModal } from '../../../../shared/components/error-modal/error-modal';
import { NotificationService } from '../../../../core/services/Notification';

@Component({
  selector: 'app-sign-ing',
  imports: [FormsModule, Spinner, ErrorModal],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  readonly email = signal('');
  readonly isShaking = signal(false);
  readonly isLoading = signal(false);
  readonly isSignInMode = signal(false);
  readonly notify = inject(NotificationService);
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
      this.notify.showSuccess('Check your email for the login link!');
      form.resetForm();
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
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
        this.notify.showError(error.message);
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
}
