import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase';
import { NotificationService } from '../../core/services/Notification';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Loader } from '../../shared/components/loader/loader';
import { Spinner } from '../../shared/components/spinner/spinner';
import { UserProfile } from '../../models/userProfile';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, Loader, Spinner, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notify = inject(NotificationService);

  private userId: string | null = null;
  private readonly pendingAvatarFile = signal<File | null>(null);

  readonly loading = signal(false);
  readonly updating = signal(false);
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
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async updateProfile() {
    if (!this.userId) {
      this.notify.showError($localize`:@@settings.error.noID:Cannot update: User ID missing`);
      return;
    }

    try {
      this.updating.set(true);

      // Handle Avatar Upload (if exists)
      let newAvatarUrl: string | null = null;
      if (this.pendingAvatarFile()) {
        newAvatarUrl = await this.uploadPendingAvatar();
      }

      // Step B: Update Profile (Username/Avatar)
      // We check if form is dirty OR if we just uploaded a new avatar
      if (this.profileForm.controls.username.dirty || newAvatarUrl) {
        await this.saveProfileData(newAvatarUrl);
      }

      // Step C: Update Email
      if (this.profileForm.controls.email.dirty) {
        await this.saveEmailData();
      }

      // Step D: Cleanup & Reset
      this.onSaveSuccess();
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.updating.set(false);
      this.isEditing.set(false);
    }
  }

  private async uploadPendingAvatar(): Promise<string> {
    const file = this.pendingAvatarFile()!;
    const fileExt = file.name.split('.').pop();
    const filePath = `${this.userId}/${Date.now()}.${fileExt}`;

    const { error } = await this.supabase.uploadAvatar(filePath, file);
    if (error) throw error;

    return this.supabase.getPublicUrl(filePath);
  }

  private async saveProfileData(newAvatarUrl: string | null) {
    const updates: UserProfile = {
      id: this.userId!,
      username: this.profileForm.value.username as string,
      avatar_url: newAvatarUrl || (this.profileForm.value.avatar_url as string),
    };

    const { error } = await this.supabase.updateProfile(updates);
    if (error) throw error;

    this.notify.showSuccess($localize`:@@settings.success.profileUpdated:Profile updated!`);
  }

  private async saveEmailData() {
    const email = this.profileForm.value.email;
    if (!email) return;

    const { error } = await this.supabase.updateEmail(email);
    if (error) throw error;

    this.notify.showSuccess(
      $localize`:@@settings.success.emailSent:Confirmation link sent to your new email!`,
    );
  }

  private onSaveSuccess() {
    this.profileForm.markAsPristine();
    this.pendingAvatarFile.set(null);
  }

  toggleEditingState() {
    this.isEditing.update((v) => !v);

    if (!this.isEditing()) {
      this.pendingAvatarFile.set(null);
      this.loadProfile();
      this.profileForm.markAsPristine();
    }
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (file.size > 2 * 1024 * 1024) {
      this.notify.showError($localize`:@@settings.error.largeIMG:Image must be smaller than 2MB`);
      return;
    }

    // 1. Queue the file
    this.pendingAvatarFile.set(file);

    // 2. Show instant preview
    const previewUrl = URL.createObjectURL(file);
    this.profileForm.patchValue({ avatar_url: previewUrl });
    this.profileForm.controls.avatar_url.markAsDirty();

    // Reset input
    input.value = '';
  }
}
