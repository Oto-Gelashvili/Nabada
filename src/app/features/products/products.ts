import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductsService } from '../../core/services/products.service';
import { Product } from '../../models/products.model';
import { NotificationService } from '../../core/services/Notification';

@Component({
  selector: 'app-products',
  imports: [],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly notify = inject(NotificationService);
  readonly products = signal<Product[]>([]);
  isLoading = signal(false);
  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    try {
      this.isLoading.set(true);
      const productsData = await this.productsService.getProducts();
      this.products.set(productsData);
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
