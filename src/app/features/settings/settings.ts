import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase';
import { NotificationService } from '../../core/services/Notification';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Loader } from '../../shared/components/loader/loader';
import { Spinner } from '../../shared/components/spinner/spinner';
import { UserProfile } from '../../models/userProfile';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, Loader, Spinner],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notify = inject(NotificationService);
  private userId: string | null = null;
  readonly loading = signal(false);
  readonly updating = signal(false);
  readonly uploading = signal(false);
  readonly isEditing = signal(false);
  readonly profileForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    avatar_url: new FormControl(''),
    email: new FormControl('', [Validators.email]),
  });

  async ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.loading.set(true);
      const user = await this.supabase.getCurrentProfile();
      if (user) {
        this.userId = user.id || null;
        this.profileForm.patchValue({
          username: user.username,
          avatar_url: user.avatar_url,
          email: user.email,
        });
      }
    } catch (error) {
      this.notify.showError('Error loading profile');
    } finally {
      this.loading.set(false);
    }
  }
  async updateProfile() {
    if (!this.userId) {
      this.notify.showError('Cannot update: User ID missing.');
      return;
    }
    try {
      this.updating.set(true);

      const profileUpdates: UserProfile = {
        id: this.userId,
        username: this.profileForm.value.username as string,
        avatar_url: this.profileForm.value.avatar_url as string,
      };
      if (this.profileForm.controls.username.dirty || this.profileForm.controls.avatar_url.dirty) {
        const { error } = await this.supabase.updateProfile(profileUpdates);
        if (error) throw error;
      }
      if (this.profileForm.controls.email.dirty && this.profileForm.value.email) {
        const { error } = await this.supabase.updateEmail(this.profileForm.value.email);
        if (error) throw error;
        this.notify.showSuccess('Confirmation link sent to your new email!');
      } else {
        this.notify.showSuccess('Profile updated!');
      }
      this.profileForm.markAsPristine();
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    } finally {
      this.updating.set(false);
      this.isEditing.set(false);
    }
  }

  toggleEditingState() {
    this.isEditing.update((v) => !v);

    if (!this.isEditing()) {
      this.loadProfile();
    }
  }
}
