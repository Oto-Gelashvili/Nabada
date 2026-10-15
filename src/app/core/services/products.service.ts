import { inject, Injectable } from '@angular/core';
import { Product } from '../../models/products.model';
import { SUPABASE_CLIENT } from './supabase.token';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private supabase = inject(SUPABASE_CLIENT);
  constructor() {}

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
    const { id, name, price, quantity } = product;
    const { error } = await this.supabase
      .from('products')
      .update({ name, price, quantity })
      .eq('id', id);
    if (error) {
      throw new Error($localize`:@@error.fetchingError:Could not fetch data. Please try again.`);
    }
  }
  async deleteProduct(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error($localize`:@@error.deleteError:Could not delete. Please try again.`);
    }
  }

  async createProduct(product: {
    name: string;
    price: number;
    quantity: number;
  }): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
      })
      .select()
      .single();

    if (error) {
      throw new Error($localize`:@@error.createError:Could not Create. Please try again.`);
    }

    return data as Product;
  }
}
