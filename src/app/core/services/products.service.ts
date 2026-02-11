import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { Product } from '../../models/products.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.from('products').select('*').is('is_active', true);

    if (error) throw error;
    return data as Product[];
  }
}
