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
  isUpdating = signal(false);
  actionType = signal<'update' | 'delete' | null>(null);
  showAddModal = signal(false);
  isCreating = signal(false);
  showFormErrors = signal(false);
  newProduct = {
    name: '',
    price: null as number | null,
  };

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
        this.notify.showError(
          $localize`:@@common.errorOccurred:An error occurred. Please try again.`,
        );
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
      const minDelay = new Promise((resolve) => setTimeout(resolve, 800));
      const apiCall = this.productsService.updateProducts(product);
      await Promise.all([apiCall, minDelay]);
      this.notify.showSuccess($localize`:@@commoont.updated:Updated`);
      this.editingId.set(null);
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(
          $localize`:@@common.errorOccurred:An error occurred. Please try again.`,
        );
      }
    } finally {
      this.actionType.set(null);
      this.isUpdating.set(false);
    }
  }

  async onDelete(productId: number) {
    this.actionType.set('delete');

    await new Promise((resolve) => setTimeout(resolve, 800));

    const confirmed = await this.notify.confirm(
      $localize`:@@common.deleteProduct:This product will be deleted`,
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
      if (error instanceof Error) {
        this.notify.showError(
          $localize`:@@common.errorOccurred:An error occurred. Please try again.`,
        );
      }
    } finally {
      this.isLoading.set(false);
      this.actionType.set(null);
    }
  }
  openAddModal() {
    this.newProduct = { name: '', price: null };
    this.showFormErrors.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  async onAddProduct() {
    const isValidName = !!this.newProduct.name;
    const isValidPrice = this.newProduct.price !== null && this.newProduct.price >= 0;
    if (!isValidName || !isValidPrice) {
      this.showFormErrors.set(true);
      return;
    }
    try {
      this.isCreating.set(true);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const createdProduct = await this.productsService.createProduct({
        name: this.newProduct.name,
        price: this.newProduct.price as number,
      });

      this.products.update((current) => [...current, createdProduct]);

      this.notify.showSuccess($localize`:@@common.created:Product created`);
      this.closeAddModal();
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.isCreating.set(false);
    }
  }
}
