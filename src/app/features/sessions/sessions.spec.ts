import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sessions } from './sessions';
import { SessionStateService } from '../../core/services/sessions/state.service';
import { StationEditService } from '../../core/services/sessions/edit.service';
import { SoundService } from '../../core/services/sound.service';
import { NotificationService } from '../../core/services/Notification';
import { AppNotification } from '../../core/services/Notification';
import { signal, computed } from '@angular/core';
import { ServiceSession } from '../../models/sessions';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const makeSession = (overrides: Partial<ServiceSession> = {}): ServiceSession => ({
  id: 1,
  station_id: 1,
  start_time: new Date(Date.now() - 30 * 60_000).toISOString(),
  end_time: new Date(Date.now() + 60 * 60_000).toISOString(),
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

const sessionsSignal = signal<ServiceSession[]>([]);

const mockState = {
  sessions: sessionsSignal,
  stations: signal([]),
  products: signal([]),
  selectedDate: signal(new Date()),
  loading: signal(false),
  resetting: signal(false),
  totalDaySum: signal(0),
  hourlyRate: signal(8),
  fitpassRate: signal(5),
  controllerRate: signal(2),
  loadAll: vi.fn().mockResolvedValue(undefined),
};

const mockEdit = {
  editMode: signal(false),
  allStations: signal([]),
  hasInvalidStations: vi.fn().mockReturnValue(false),
  toggleEditMode: vi.fn(),
  cancelEditMode: vi.fn(),
  addStation: vi.fn(),
  removeStation: vi.fn(),
};

const mockSound = {
  playSessionEnd: vi.fn(),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  confirm: vi.fn(),
  resolveConfirm: vi.fn(),
};

describe('Sessions', () => {
  let component: Sessions;
  let fixture: ComponentFixture<Sessions>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    sessionsSignal.set([]);

    await TestBed.configureTestingModule({
      imports: [Sessions],
      providers: [
        { provide: SessionStateService, useValue: mockState },
        { provide: StationEditService, useValue: mockEdit },
        { provide: SoundService, useValue: mockSound },
        { provide: NotificationService, useValue: mockNotify },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Sessions);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── modal ──────────────────────────────────────────
  it('showCreateModal starts as false', () => {
    expect(component['showCreateModal']()).toBe(false);
  });

  it('onCreateSession opens modal', () => {
    component.onCreateSession();
    expect(component['showCreateModal']()).toBe(true);
  });

  it('showEditModal sets editableSessionId and opens modal', () => {
    component.showEditModal(42);
    expect(component['editableSessionId']()).toBe(42);
    expect(component['showCreateModal']()).toBe(true);
  });

  it('closeModal clears editableSessionId and closes modal', () => {
    component.showEditModal(42);
    component.closeModal();
    expect(component['editableSessionId']()).toBeNull();
    expect(component['showCreateModal']()).toBe(false);
  });

  // ── sessionsByStation ──────────────────────────────
  it('sessionsByStation groups sessions by station_id', () => {
    sessionsSignal.set([
      makeSession({ id: 1, station_id: 1 }),
      makeSession({ id: 2, station_id: 1 }),
      makeSession({ id: 3, station_id: 2 }),
    ]);
    fixture.detectChanges();

    const map = component['sessionsByStation']();
    expect(map.get(1)).toHaveLength(2);
    expect(map.get(2)).toHaveLength(1);
  });

  it('sessionsByStation returns empty map when no sessions', () => {
    sessionsSignal.set([]);
    fixture.detectChanges();

    const map = component['sessionsByStation']();
    expect(map.size).toBe(0);
  });

  // ── session expiry detection ───────────────────────
  it('plays sound and shows notification when session just expired', async () => {
    // end time must be within the last 60s AFTER the timer fires
    // so set it to "will expire exactly when the interval fires"
    const willExpireAt = new Date(Date.now() + 60_000 - 10_000); // expires 10s before interval fires
    sessionsSignal.set([makeSession({ id: 1, end_time: willExpireAt.toISOString() })]);

    vi.advanceTimersByTime(60_000);
    await fixture.whenStable();

    expect(mockSound.playSessionEnd).toHaveBeenCalledOnce();
    expect(mockNotify.showSuccess).toHaveBeenCalledOnce();
  });

  it('does not play sound for same session twice', async () => {
    const willExpireAt = new Date(Date.now() + 60_000 - 10_000);
    sessionsSignal.set([makeSession({ id: 1, end_time: willExpireAt.toISOString() })]);

    vi.advanceTimersByTime(60_000);
    vi.advanceTimersByTime(60_000);
    await fixture.whenStable();

    expect(mockSound.playSessionEnd).toHaveBeenCalledOnce();
  });
  it('does not play sound for session that expired long ago', async () => {
    const longAgo = new Date(Date.now() - 5 * 60_000).toISOString(); // 5min ago
    sessionsSignal.set([makeSession({ id: 1, end_time: longAgo })]);

    vi.advanceTimersByTime(60_000);
    await fixture.whenStable();

    expect(mockSound.playSessionEnd).not.toHaveBeenCalled();
  });

  it('does not play sound for ongoing session with no end time', async () => {
    sessionsSignal.set([makeSession({ id: 1, end_time: null })]);

    vi.advanceTimersByTime(60_000);
    await fixture.whenStable();

    expect(mockSound.playSessionEnd).not.toHaveBeenCalled();
  });

  // ── onSessionChanged ───────────────────────────────
  it('onSessionChanged calls state.loadAll with reset', async () => {
    await component.onSessionChanged();
    expect(mockState.loadAll).toHaveBeenCalledWith('reset');
  });

  // ── onDateChange ───────────────────────────────────
  it('onDateChange calls state.loadAll with reset', () => {
    component.onDateChange();
    expect(mockState.loadAll).toHaveBeenCalledWith('reset');
  });
});
