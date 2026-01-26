import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const isLoggedIn = await supabase.isLoggedIn();

  if (isLoggedIn) {
    return true;
  } else {
    router.navigate(['/signups']);
    return false;
  }
};

export const guestGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const isLoggedIn = await supabase.isLoggedIn();

  if (!isLoggedIn) {
    return true;
  } else {
    router.navigate(['/sessions']);
    return false;
  }
};
