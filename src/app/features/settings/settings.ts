import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase';
import { NotificationService } from '../../core/services/Notification';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Spinner } from '../../shared/components/spinner/spinner';
import { UserProfile } from '../../models/userProfile';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, Spinner],
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
  readonly updatingEmail = signal(false);
  readonly isEditing = signal(false);

  readonly profileForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    avatar_url: new FormControl(''),
    rate: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  readonly emailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  async ngOnInit() {
    this.loadProfile('load');
  }

  async loadProfile(resetOrLoad: 'load' | 'reset') {
    try {
      resetOrLoad === 'load' ? this.loading.set(true) : this.updating.set(true);

      const user = await this.supabase.getCurrentProfile();
      if (user) {
        this.userId = user.id || null;
        this.profileForm.patchValue({
          username: user.username,
          avatar_url: user.avatar_url,
          rate: user.hourly_rate,
        });
        this.emailForm.patchValue({
          email: user.email,
        });
      }
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      resetOrLoad === 'load' ? this.loading.set(false) : this.updating.set(false);
    }
  }

  async updateProfile() {
    if (!this.userId) {
      this.notify.showError($localize`:@@settings.errorNoID:Cannot update: User ID missing`);
      return;
    }

    try {
      this.updating.set(true);

      let newAvatarUrl: string | null = null;
      if (this.pendingAvatarFile()) {
        newAvatarUrl = await this.uploadPendingAvatar();
      }

      if (
        this.profileForm.controls.username.dirty ||
        this.profileForm.controls.rate.dirty ||
        newAvatarUrl
      ) {
        await this.saveProfileData(newAvatarUrl);
      }

      this.onSaveSuccess();
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.updating.set(false);
      this.isEditing.set(false);
    }
  }

  async saveEmail() {
    if (!this.userId) {
      this.notify.showError($localize`:@@settings.errorNoID:Cannot update: User ID missing`);
      return;
    }

    try {
      this.updatingEmail.set(true);
      await this.saveEmailData();
      this.emailForm.markAsPristine();
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.updatingEmail.set(false);
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
      hourly_rate: this.profileForm.value.rate ?? 8,
    };

    const { error } = await this.supabase.updateProfile(updates);
    if (error) throw error;

    this.notify.showSuccess($localize`:@@settings.profileUpdated:Profile updated!`);
  }

  private async saveEmailData() {
    const email = this.emailForm.value.email;
    if (!email) return;

    const { error } = await this.supabase.updateEmail(email);
    if (error) throw error;

    this.notify.showSuccess(
      $localize`:@@settings.emailSent:Confirmation link sent to your new email!`,
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
      this.loadProfile('reset');
      this.profileForm.markAsPristine();
    }
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (file.size > 2 * 1024 * 1024) {
      this.notify.showError($localize`:@@settings.errorLargeIMG:Image must be smaller than 2MB`);
      return;
    }

    this.pendingAvatarFile.set(file);
    const previewUrl = URL.createObjectURL(file);
    this.profileForm.patchValue({ avatar_url: previewUrl });
    this.profileForm.controls.avatar_url.markAsDirty();
    input.value = '';
  }

  async onDelete() {
    const confirmed = await this.notify.confirm(
      $localize`:@@common.deleteProductDesc:This product will be deleted`,
    );
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.supabase.deleteAccount();
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(
          $localize`:@@common.errorOccurred:An error occurred. Please try again.`,
        );
      }
    } finally {
      this.loading.set(false);
    }
  }
}
