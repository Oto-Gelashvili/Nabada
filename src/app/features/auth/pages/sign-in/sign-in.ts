import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase';

@Component({
  selector: 'app-sign-ing',
  imports: [FormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  email = signal('');
  isShaking = signal(false);
  isLoading = signal(false);
  isSignInMode = signal(false);
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
      alert('Check your email for the login link!');
      form.resetForm();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
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
      console.error(error);
    }
  }
  triggerShake() {
    this.isShaking.set(true);
    setTimeout(() => {
      this.isShaking.set(false);
    }, 400);
  }

  toggleSignInMode() {
    this.isSignInMode.update((mode) => !mode);
  }
}
