import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsService } from './products.service';
import { SUPABASE_CLIENT } from './supabase.token';
import { Product } from '../../models/products.model';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Water',
  price: 2,
  quantity: 10,
  ...overrides,
});

// chainable supabase query builder mock
const mockQuery = {
  select: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: makeProduct(), error: null }),
};

const mockSupabase = {
  from: vi.fn().mockReturnValue(mockQuery),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    vi.clearAllMocks();
    // reset chainable mocks
    mockQuery.select.mockReturnThis();
    mockQuery.is.mockReturnThis();
    mockQuery.order.mockResolvedValue({ data: [], error: null });
    mockQuery.update.mockReturnThis();
    mockQuery.eq.mockResolvedValue({ data: null, error: null });
    mockQuery.insert.mockReturnThis();
    mockQuery.single.mockResolvedValue({ data: makeProduct(), error: null });

    TestBed.configureTestingModule({
      providers: [ProductsService, { provide: SUPABASE_CLIENT, useValue: mockSupabase }],
    });
    service = TestBed.inject(ProductsService);
  });

  // ── getProducts ────────────────────────────────────
  it('getProducts calls supabase with correct table', async () => {
    await service.getProducts();
    expect(mockSupabase.from).toHaveBeenCalledWith('products');
  });

  it('getProducts returns data', async () => {
    const products = [makeProduct(), makeProduct({ id: 2, name: 'Cola' })];
    mockQuery.order.mockResolvedValueOnce({ data: products, error: null });
    const result = await service.getProducts();
    expect(result).toHaveLength(2);
  });

  it('getProducts throws when error returned', async () => {
    mockQuery.order.mockResolvedValueOnce({ data: null, error: new Error('DB error') });
    await expect(service.getProducts()).rejects.toThrow();
  });

  // ── updateProducts ─────────────────────────────────
  it('updateProducts calls update on correct table', async () => {
    await service.updateProducts(makeProduct());
    expect(mockSupabase.from).toHaveBeenCalledWith('products');
    expect(mockQuery.update).toHaveBeenCalledWith({ name: 'Water', price: 2, quantity: 10 });
  });

  it('updateProducts throws when error returned', async () => {
    mockQuery.eq.mockResolvedValueOnce({ error: new Error('Update failed') });
    await expect(service.updateProducts(makeProduct())).rejects.toThrow();
  });

  // ── deleteProduct ──────────────────────────────────
  it('deleteProduct calls update with is_active false', async () => {
    await service.deleteProduct(1);
    expect(mockQuery.update).toHaveBeenCalledWith({ is_active: false });
  });

  it('deleteProduct throws when error returned', async () => {
    mockQuery.eq.mockResolvedValueOnce({ error: new Error('Delete failed') });
    await expect(service.deleteProduct(1)).rejects.toThrow();
  });

  // ── createProduct ──────────────────────────────────
  it('createProduct calls insert with correct data', async () => {
    await service.createProduct({ name: 'Cola', price: 3, quantity: 5 });
    expect(mockQuery.insert).toHaveBeenCalledWith({ name: 'Cola', price: 3, quantity: 5 });
  });

  it('createProduct returns created product', async () => {
    const created = makeProduct({ id: 99, name: 'Cola' });
    mockQuery.single.mockResolvedValueOnce({ data: created, error: null });
    const result = await service.createProduct({ name: 'Cola', price: 3, quantity: 5 });
    expect(result.id).toBe(99);
  });

  it('createProduct throws when error returned', async () => {
    mockQuery.single.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') });
    await expect(service.createProduct({ name: 'x', price: 1, quantity: 1 })).rejects.toThrow();
  });
});
