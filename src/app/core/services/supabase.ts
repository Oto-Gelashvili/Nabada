import { computed, inject, Injectable, signal } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { Router } from '@angular/router';
import { UserProfile } from '../../models/userProfile';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly _session = signal<AuthSession | null>(null);
  readonly session = this._session.asReadonly();
  private readonly router = inject(Router);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
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
      .select(`id, username, avatar_url`)
      .eq('id', user.id)
      .single();
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  signIn(email: string) {
    return this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/sessions`,
      },
    });
  }

  signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/sessions`,
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

  async updateEmail(email: string) {
    return this.supabase.auth.updateUser({ email });
  }
}
