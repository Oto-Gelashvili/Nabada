import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionStateService } from './state.service';
import { StationsService } from '../station.service';
import { ProductsService } from '../products.service';
import { SupabaseService } from '../supabase';
import { NotificationService } from '../Notification';
import { AppNotification } from '../Notification';
import { signal } from '@angular/core';
import { ServiceSession } from '../../../models/sessions';

const makeSession = (overrides: Partial<ServiceSession> = {}): ServiceSession => ({
  id: 1,
  station_id: 1,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 60 * 60_000).toISOString(),
  status: 'active',
  pay_method: 'Cash',
  total_cost: 10,
  hourly_rate: 8,
  controller_amount: 2,
  controller_cost: 0,
  cash_paid: 10,
  card_paid: 0,
  fitpass_paid: 0,
  fitpass_count: 0,
  ...overrides,
});

const mockStations = {
  getStations: vi.fn().mockResolvedValue([]),
  getSessions: vi.fn().mockResolvedValue([]),
};
const mockProducts = { getProducts: vi.fn().mockResolvedValue([]) };
const mockSupabase = { getCurrentProfile: vi.fn().mockResolvedValue(null) };
const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  resolveConfirm: vi.fn(),
};

describe('SessionStateService', () => {
  let service: SessionStateService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        SessionStateService,
        { provide: StationsService, useValue: mockStations },
        { provide: ProductsService, useValue: mockProducts },
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: NotificationService, useValue: mockNotify },
      ],
    });
    service = TestBed.inject(SessionStateService);
  });

  // ── initial state ──────────────────────────────────
  it('loading starts as false', () => {
    expect(service.loading()).toBe(false);
  });

  it('sessions starts empty', () => {
    expect(service.sessions()).toHaveLength(0);
  });

  // ── loadAll ────────────────────────────────────────
  it('loadAll sets loading true then false', async () => {
    const states: boolean[] = [];
    mockStations.getStations.mockImplementationOnce(async () => {
      states.push(service.loading());
      return [];
    });
    await service.loadAll('initLoad');
    states.push(service.loading());
    expect(states).toEqual([true, false]);
  });

  it('loadAll sets resetting true then false for reset', async () => {
    const states: boolean[] = [];
    mockStations.getStations.mockImplementationOnce(async () => {
      states.push(service.resetting());
      return [];
    });
    await service.loadAll('reset');
    states.push(service.resetting());
    expect(states).toEqual([true, false]);
  });

  it('loadAll sets stations from service', async () => {
    mockStations.getStations.mockResolvedValueOnce([{ id: 1, name: 'PS1', display_order: 1 }]);
    await service.loadAll('initLoad');
    expect(service.stations()).toHaveLength(1);
  });

  it('loadAll sets sessions from service', async () => {
    mockStations.getSessions.mockResolvedValueOnce([makeSession()]);
    await service.loadAll('initLoad');
    expect(service.sessions()).toHaveLength(1);
  });

  it('loadAll updates hourlyRate from profile', async () => {
    mockSupabase.getCurrentProfile.mockResolvedValueOnce({
      hourly_rate: 12,
      fitpass_rate: null,
      controller_rate: null,
    });
    await service.loadAll('initLoad');
    expect(service.hourlyRate()).toBe(12);
  });

  it('loadAll shows error when service throws', async () => {
    mockStations.getStations.mockRejectedValueOnce(new Error('Network fail'));
    await service.loadAll('initLoad');
    expect(mockNotify.showError).toHaveBeenCalledWith('Network fail');
  });

  // ── totalDaySum ────────────────────────────────────
  it('totalDaySum sums paid sessions for selected date', () => {
    const today = new Date();
    service.selectedDate.set(today);
    service.sessions.set([
      makeSession({ total_cost: 10, pay_method: 'Cash', start_time: today.toISOString() }),
      makeSession({ id: 2, total_cost: 5, pay_method: 'Card', start_time: today.toISOString() }),
    ]);
    expect(service.totalDaySum()).toBe(15);
  });

  it('totalDaySum excludes NotPaid sessions', () => {
    const today = new Date();
    service.selectedDate.set(today);
    service.sessions.set([
      makeSession({ total_cost: 10, pay_method: 'Cash', start_time: today.toISOString() }),
      makeSession({ id: 2, total_cost: 8, pay_method: 'NotPaid', start_time: today.toISOString() }),
    ]);
    expect(service.totalDaySum()).toBe(10);
  });

  it('totalDaySum excludes sessions from different dates', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    service.selectedDate.set(today);
    service.sessions.set([
      makeSession({ total_cost: 10, pay_method: 'Cash', start_time: yesterday.toISOString() }),
    ]);
    expect(service.totalDaySum()).toBe(0);
  });
});
