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
    // email: new FormControl(''),
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
          // email: user.email,
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

      const updates: UserProfile = {
        id: this.userId,
        username: this.profileForm.value.username as string,
        avatar_url: this.profileForm.value.avatar_url as string,
      };
      const { error } = await this.supabase.updateProfile(updates);
      if (error) throw error;
      this.notify.showSuccess('Profile updated!');
      this.profileForm.markAsPristine();
    } catch (error) {
      this.notify.showError('Error updating profile');
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
