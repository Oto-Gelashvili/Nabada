import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { Product } from '../../models/products.model';
import { NotificationService } from '../../core/services/Notification';
import { Spinner } from '../../shared/components/spinner/spinner';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-products',
  imports: [Spinner, FormsModule, Loader],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly notify = inject(NotificationService);
  readonly products = signal<Product[]>([]);
  isLoading = signal(false);
  editingId = signal<number | null>(null);
  // showConfirmation = signal(false);
  isUpdating = signal(false);
  // deleteId = signal<number | null>(null);
  actionType = signal<'update' | 'delete' | null>(null);

  ngOnInit() {
    this.loadProducts('init');
  }

  async loadProducts(action: 'reset' | 'init') {
    try {
      if (action === 'init') {
        this.isLoading.set(true);
      } else {
        this.isUpdating.set(true);
      }

      const productsData = await this.productsService.getProducts();
      this.products.set(productsData);
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    } finally {
      if (action === 'init') {
        this.isLoading.set(false);
      } else {
        this.isUpdating.set(false);
      }
    }
  }

  async toggleEditingState(productId: number) {
    if (this.editingId() === productId) {
      await this.loadProducts('reset');
      this.editingId.set(null);
    } else {
      this.editingId.set(productId);
    }
  }

  async updateProduct(product: Product) {
    try {
      this.actionType.set('update');
      this.isUpdating.set(true);
      // for adding btn animation
      const minDelay = new Promise((resolve) => setTimeout(resolve, 400));
      const apiCall = this.productsService.updateProducts(product);
      await Promise.all([apiCall, minDelay]);
      this.notify.showSuccess($localize`:@@commoont.updated:Updated`);
      this.editingId.set(null);
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.actionType.set(null);
      this.isUpdating.set(false);
    }
  }

  async onDelete(productId: number) {
    this.actionType.set('delete');

    await new Promise((resolve) => setTimeout(resolve, 400));

    const confirmed = await this.notify.confirm(
      $localize`:@@common.confirmDelete:Are you sure you want to delete this product?`,
    );

    if (!confirmed) {
      this.actionType.set(null);
      return;
    }

    try {
      this.isLoading.set(true);
      await this.productsService.deleteProduct(productId);

      this.products.update((current) => current.filter((p) => p.id !== productId));
      this.notify.showSuccess($localize`:@@common.deleted:Deleted`);
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.isLoading.set(false);
      this.actionType.set(null);
    }
  }
}
