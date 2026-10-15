import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Analytics } from './analytics';
import { AnalyticsService } from '../../core/services/analytics.service';
import { NotificationService } from '../../core/services/Notification';
import { AppNotification } from '../../core/services/Notification';
import { signal } from '@angular/core';
import { StationAnalytics, SessionItems, PayMethodAnalytics } from './models/analytics.models';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const mockAnalyticsService = {
  getIncomeGraph: vi.fn().mockResolvedValue([]),
  getStationsAnalytics: vi.fn().mockResolvedValue({ stations: [], payMethods: [] }),
  getProductsData: vi.fn().mockResolvedValue([]),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  resolveConfirm: vi.fn(),
};

const makeStation = (overrides: Partial<StationAnalytics> = {}): StationAnalytics => ({
  id: 1,
  name: 'Station 1',
  total_cost: 100,
  gaming_cost: 80,
  products_cost: 20,
  ...overrides,
});

const makeProduct = (overrides: Partial<SessionItems> = {}): SessionItems => ({
  id: 1,
  name: 'Water',
  total_revenue: 50,
  quantity: 10,
  ...overrides,
});

describe('Analytics', () => {
  let component: Analytics;
  let fixture: ComponentFixture<Analytics>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Analytics],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: NotificationService, useValue: mockNotify },
      ],
      schemas: [NO_ERRORS_SCHEMA], // ignore unknown child components like line-graph, sorter
    }).compileComponents();

    fixture = TestBed.createComponent(Analytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ── getPayMethodLabel ──────────────────────────────
  it('getPayMethodLabel returns label for Cash', () => {
    expect(component.getPayMethodLabel('Cash')).toBe('Cash');
  });

  it('getPayMethodLabel returns label for Card', () => {
    expect(component.getPayMethodLabel('Card')).toBe('Card');
  });

  it('getPayMethodLabel returns key if not found', () => {
    expect(component.getPayMethodLabel('Unknown')).toBe('Unknown');
  });

  // ── onStationSortChange ────────────────────────────
  it('sorts stations by total cost descending', () => {
    component.stationsData.set([
      makeStation({ id: 1, total_cost: 50 }),
      makeStation({ id: 2, total_cost: 100 }),
    ]);
    component.onStationSortChange('dec-total');
    expect(component.stationsData()[0].total_cost).toBe(100);
  });

  it('sorts stations by total cost ascending', () => {
    component.stationsData.set([
      makeStation({ id: 1, total_cost: 100 }),
      makeStation({ id: 2, total_cost: 50 }),
    ]);
    component.onStationSortChange('inc-total');
    expect(component.stationsData()[0].total_cost).toBe(50);
  });

  it('sorts stations by gaming cost descending', () => {
    component.stationsData.set([
      makeStation({ id: 1, gaming_cost: 30 }),
      makeStation({ id: 2, gaming_cost: 80 }),
    ]);
    component.onStationSortChange('dec-gaming');
    expect(component.stationsData()[0].gaming_cost).toBe(80);
  });

  it('sorts stations by products cost descending', () => {
    component.stationsData.set([
      makeStation({ id: 1, products_cost: 10 }),
      makeStation({ id: 2, products_cost: 40 }),
    ]);
    component.onStationSortChange('dec-products');
    expect(component.stationsData()[0].products_cost).toBe(40);
  });

  // ── onProductSortChange ────────────────────────────
  it('sorts products by revenue descending', () => {
    component.productsData.set([
      makeProduct({ id: 1, total_revenue: 20 }),
      makeProduct({ id: 2, total_revenue: 80 }),
    ]);
    component.onProductSortChange('dec-total');
    expect(component.productsData()[0].total_revenue).toBe(80);
  });

  it('sorts products by quantity descending', () => {
    component.productsData.set([
      makeProduct({ id: 1, quantity: 5 }),
      makeProduct({ id: 2, quantity: 15 }),
    ]);
    component.onProductSortChange('dec-quantity');
    expect(component.productsData()[0].quantity).toBe(15);
  });

  // ── computed totals ────────────────────────────────
  it('totalRevenue sums all station costs', () => {
    component.stationsData.set([makeStation({ total_cost: 100 }), makeStation({ total_cost: 50 })]);
    expect(component.totalRevenue()).toBe(150);
  });

  it('productsTotalRevenue sums all product revenues', () => {
    component.productsData.set([
      makeProduct({ total_revenue: 30 }),
      makeProduct({ total_revenue: 20 }),
    ]);
    expect(component.productsTotalRevenue()).toBe(50);
  });
});
