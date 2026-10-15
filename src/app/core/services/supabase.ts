import { inject, Injectable, signal } from '@angular/core';
import { AuthChangeEvent, AuthSession, Session, User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { UserProfile } from '../../models/userProfile';
import { SUPABASE_CLIENT } from './supabase.token';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly _session = signal<AuthSession | null>(null);
  readonly session = this._session.asReadonly();
  private readonly router = inject(Router);

  constructor() {
    this.initSession();
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._session.set(session);
      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/']);
      }
    });
  }
  private async initSession() {
    const { data } = await this.supabase.auth.getSession();
    this._session.set(data.session);
  }

  async getUser() {
    return this.supabase.auth.getUser();
  }
  async getCurrentProfile() {
    const {
      data: { user },
    } = await this.getUser();

    if (!user) return null;

    const { data, error } = await this.profile(user);

    if (error) {
      throw error;
    }
    return { ...data, email: user.email };
  }

  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return !!data.session;
  }

  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`id, username, avatar_url,hourly_rate,fitpass_rate, controller_rate`)
      .eq('id', user.id)
      .single();
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  signIn(email: string) {
    const isKa = window.location.pathname.startsWith('/ka');

    return this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${isKa ? '/ka' : ''}/sessions`,
      },
    });
  }

  signInWithGoogle() {
    const isKa = window.location.pathname.startsWith('/ka');

    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${isKa ? '/ka' : ''}/sessions`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  }
  signOut() {
    return this.supabase.auth.signOut();
  }

  updateProfile(profile: UserProfile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    };

    return this.supabase.from('profiles').upsert(update);
  }

  downLoadImage(path: string) {
    return this.supabase.storage.from('avatars').download(path);
  }

  uploadAvatar(filePath: string, file: File) {
    return this.supabase.storage.from('avatars').upload(filePath, file);
  }

  getPublicUrl(path: string) {
    return this.supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  }
  async updateEmail(email: string) {
    return this.supabase.auth.updateUser({ email });
  }

  async deleteAccount() {
    const { error } = await this.supabase.rpc('delete_own_account');

    if (error) throw error;

    await this.signOut();
  }
}
