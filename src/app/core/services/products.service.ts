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
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .is('is_active', true)
      .order('id', { ascending: true });

    if (error) throw error;
    return data as Product[];
  }
  async updateProducts(product: Product) {
    const { id, name, price } = product;
    const { error } = await this.supabase.from('products').update({ name, price }).eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }
  async deleteProduct(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async createProduct(product: { name: string; price: number }): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Product;
  }
}
