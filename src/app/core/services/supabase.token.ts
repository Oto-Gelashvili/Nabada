import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SupabaseClient');

export const supabaseClientFactory = () => {
  return createClient(environment.supabaseUrl, environment.supabaseKey);
};
