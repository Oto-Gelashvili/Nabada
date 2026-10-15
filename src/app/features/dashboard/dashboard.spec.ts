import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dashboard } from './dashboard';
import { StationsService } from '../../core/services/station.service';
import { signal } from '@angular/core';
import { ServiceSession, Station } from '../../models/sessions';

const mockStationsService = {
  getStations: vi.fn().mockResolvedValue([]),
  getSessions: vi.fn().mockResolvedValue([]),
};

const makeSession = (overrides: Partial<ServiceSession> = {}): ServiceSession => ({
  id: 1,
  station_id: 1,
  start_time: new Date(Date.now() - 30 * 60_000).toISOString(), // 30min ago
  end_time: new Date(Date.now() + 60 * 60_000).toISOString(), // 1hr from now
  status: 'active',
  pay_method: 'Cash',
  total_cost: 8,
  hourly_rate: 8,
  controller_amount: 2,
  controller_cost: 0,
  cash_paid: 8,
  card_paid: 0,
  fitpass_paid: 0,
  fitpass_count: 0,
  ...overrides,
});

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: StationsService, useValue: mockStationsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ── getActiveSession ───────────────────────────────
  it('getActiveSession returns null when no sessions', () => {
    component['sessions'].set([]);
    expect(component['getActiveSession'](1)).toBeNull();
  });

  it('getActiveSession returns session for matching station', () => {
    const session = makeSession({ station_id: 1 });
    component['sessions'].set([session]);
    expect(component['getActiveSession'](1)).toEqual(session);
  });

  it('getActiveSession returns null for different station', () => {
    const session = makeSession({ station_id: 2 });
    component['sessions'].set([session]);
    expect(component['getActiveSession'](1)).toBeNull();
  });

  it('getActiveSession returns null for future session', () => {
    const session = makeSession({
      start_time: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
    component['sessions'].set([session]);
    expect(component['getActiveSession'](1)).toBeNull();
  });

  it('getActiveSession returns null for past session', () => {
    const session = makeSession({
      start_time: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
      end_time: new Date(Date.now() - 60 * 60_000).toISOString(),
    });
    component['sessions'].set([session]);
    expect(component['getActiveSession'](1)).toBeNull();
  });

  it('getActiveSession returns ongoing session with no end time', () => {
    const session = makeSession({ end_time: null });
    component['sessions'].set([session]);
    expect(component['getActiveSession'](1)).toEqual(session);
  });

  // ── getStationState ────────────────────────────────
  it('getStationState returns empty when no active session', () => {
    component['sessions'].set([]);
    expect(component['getStationState'](1)).toBe('empty');
  });

  it('getStationState returns active for normal session', () => {
    component['sessions'].set([makeSession()]);
    expect(component['getStationState'](1)).toBe('active');
  });

  it('getStationState returns ending-soon when less than 5 minutes left', () => {
    const session = makeSession({
      end_time: new Date(Date.now() + 3 * 60_000).toISOString(), // 3min left
    });
    component['sessions'].set([session]);
    expect(component['getStationState'](1)).toBe('ending-soon');
  });

  it('getStationState returns active for ongoing session with no end time', () => {
    component['sessions'].set([makeSession({ end_time: null })]);
    expect(component['getStationState'](1)).toBe('active');
  });

  // ── isUnpaid ───────────────────────────────────────
  it('isUnpaid returns true for NotPaid session', () => {
    const session = makeSession({ pay_method: 'NotPaid' });
    expect(component['isUnpaid'](session)).toBe(true);
  });

  it('isUnpaid returns true for partial NotPaid session', () => {
    const session = makeSession({ pay_method: 'Cash,NotPaid' });
    expect(component['isUnpaid'](session)).toBe(true);
  });

  it('isUnpaid returns false for fully paid session', () => {
    const session = makeSession({ pay_method: 'Cash' });
    expect(component['isUnpaid'](session)).toBe(false);
  });

  it('isUnpaid returns false for Card session', () => {
    const session = makeSession({ pay_method: 'Card' });
    expect(component['isUnpaid'](session)).toBe(false);
  });
});
