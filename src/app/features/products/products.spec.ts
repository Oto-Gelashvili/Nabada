import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Products } from './products';
import { ProductsService } from '../../core/services/products.service';
import { NotificationService } from '../../core/services/Notification';
import { AppNotification } from '../../core/services/Notification';
import { signal } from '@angular/core';
import { Product } from '../../models/products.model';

const mockProductsService = {
  getProducts: vi.fn().mockResolvedValue([]),
  updateProducts: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  createProduct: vi.fn(),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  resolveConfirm: vi.fn(),
};

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Water',
  price: 2,
  quantity: 10,
  ...overrides,
});

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // fake setTimeout so 800ms delay doesn't slow tests

    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
        { provide: NotificationService, useValue: mockNotify },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── modal ──────────────────────────────────────────
  it('showAddModal starts as false', () => {
    expect(component.showAddModal()).toBe(false);
  });

  it('openAddModal opens the modal', () => {
    component.openAddModal();
    expect(component.showAddModal()).toBe(true);
  });

  it('openAddModal resets newProduct', () => {
    component.newProduct = { name: 'Old', price: 5, quantity: 3 };
    component.openAddModal();
    expect(component.newProduct.name).toBe('');
    expect(component.newProduct.price).toBeNull();
    expect(component.newProduct.quantity).toBeNull();
  });

  it('openAddModal clears form errors', () => {
    component.showFormErrors.set(true);
    component.openAddModal();
    expect(component.showFormErrors()).toBe(false);
  });

  it('closeAddModal closes the modal', () => {
    component.showAddModal.set(true);
    component.closeAddModal();
    expect(component.showAddModal()).toBe(false);
  });

  // ── editing state ──────────────────────────────────
  it('editingId starts as null', () => {
    expect(component.editingId()).toBeNull();
  });

  it('toggleEditingState sets editingId', async () => {
    await component.toggleEditingState(1);
    expect(component.editingId()).toBe(1);
  });

  it('toggleEditingState clears editingId when same id clicked', async () => {
    await component.toggleEditingState(1);
    vi.runAllTimers();
    await component.toggleEditingState(1);
    expect(component.editingId()).toBeNull();
  });

  // ── onAddProduct validation ────────────────────────
  it('onAddProduct shows form errors when name is empty', async () => {
    component.newProduct = { name: '', price: 5, quantity: 1 };
    await component.onAddProduct();
    expect(component.showFormErrors()).toBe(true);
  });

  it('onAddProduct shows form errors when price is null', async () => {
    component.newProduct = { name: 'Test', price: null, quantity: 1 };
    await component.onAddProduct();
    expect(component.showFormErrors()).toBe(true);
  });

  it('onAddProduct shows form errors when price is negative', async () => {
    component.newProduct = { name: 'Test', price: -1, quantity: 1 };
    await component.onAddProduct();
    expect(component.showFormErrors()).toBe(true);
  });

  it('onAddProduct does not call service when validation fails', async () => {
    component.newProduct = { name: '', price: null, quantity: null };
    await component.onAddProduct();
    expect(mockProductsService.createProduct).not.toHaveBeenCalled();
  });

  it('onAddProduct calls createProduct with correct data', async () => {
    const created = makeProduct({ id: 99, name: 'Cola', price: 3, quantity: 5 });
    mockProductsService.createProduct.mockResolvedValueOnce(created);
    component.newProduct = { name: 'Cola', price: 3, quantity: 5 };

    const promise = component.onAddProduct();
    vi.runAllTimers();
    await promise;

    expect(mockProductsService.createProduct).toHaveBeenCalledWith({
      name: 'Cola',
      price: 3,
      quantity: 5,
    });
  });

  it('onAddProduct adds product to list after creation', async () => {
    const created = makeProduct({ id: 99, name: 'Cola' });
    mockProductsService.createProduct.mockResolvedValueOnce(created);
    component.newProduct = { name: 'Cola', price: 3, quantity: 5 };

    const promise = component.onAddProduct();
    vi.runAllTimers();
    await promise;

    expect(component.products().some((p) => p.id === 99)).toBe(true);
  });

  it('onAddProduct closes modal after creation', async () => {
    const created = makeProduct({ id: 99 });
    mockProductsService.createProduct.mockResolvedValueOnce(created);
    component.showAddModal.set(true);
    component.newProduct = { name: 'Cola', price: 3, quantity: 5 };

    const promise = component.onAddProduct();
    vi.runAllTimers();
    await promise;

    expect(component.showAddModal()).toBe(false);
  });

  // ── onDelete ───────────────────────────────────────
  it('onDelete removes product from list when confirmed', async () => {
    component.products.set([makeProduct({ id: 1 }), makeProduct({ id: 2 })]);
    mockNotify.confirm.mockResolvedValueOnce(true);

    const promise = component.onDelete(1);
    vi.runAllTimers();
    await promise;

    expect(component.products().find((p) => p.id === 1)).toBeUndefined();
  });

  it('onDelete does not remove product when cancelled', async () => {
    component.products.set([makeProduct({ id: 1 })]);
    mockNotify.confirm.mockResolvedValueOnce(false);

    const promise = component.onDelete(1);
    vi.runAllTimers();
    await promise;

    expect(component.products()).toHaveLength(1);
  });
});
