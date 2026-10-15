import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StationEditService } from './edit.service';
import { StationsService } from '../station.service';
import { NotificationService } from '../Notification';
import { SessionStateService } from './state.service';
import { AppNotification } from '../Notification';
import { signal } from '@angular/core';
import { Station } from '../../../models/sessions';

const makeStation = (overrides: Partial<Station> = {}): Station => ({
  id: 1,
  name: 'PS1',
  display_order: 1,
  ...overrides,
});

const stationsSignal = signal<Station[]>([]);

const mockState = {
  stations: stationsSignal,
  sessions: signal([]),
  selectedDate: signal(new Date()),
  loading: signal(false),
  resetting: signal(false),
  loadAll: vi.fn().mockResolvedValue(undefined),
};

const mockStationsService = {
  updateStationName: vi.fn().mockResolvedValue(undefined),
  createStation: vi.fn().mockResolvedValue({ id: 99, name: 'PS2', display_order: 2 }),
  removeStation: vi.fn().mockResolvedValue(undefined),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  resolveConfirm: vi.fn(),
};

describe('StationEditService', () => {
  let service: StationEditService;

  beforeEach(() => {
    vi.clearAllMocks();
    stationsSignal.set([]);

    TestBed.configureTestingModule({
      providers: [
        StationEditService,
        { provide: StationsService, useValue: mockStationsService },
        { provide: NotificationService, useValue: mockNotify },
        { provide: SessionStateService, useValue: mockState },
      ],
    });
    service = TestBed.inject(StationEditService);
  });

  // ── editMode ───────────────────────────────────────
  it('editMode starts as false', () => {
    expect(service.editMode()).toBe(false);
  });

  // ── allStations ────────────────────────────────────
  it('allStations returns state stations initially', () => {
    stationsSignal.set([makeStation()]);
    expect(service.allStations()).toHaveLength(1);
  });

  // ── hasInvalidStations ─────────────────────────────
  it('hasInvalidStations returns false when all stations have names', () => {
    stationsSignal.set([makeStation({ name: 'PS1' })]);
    expect(service.hasInvalidStations()).toBe(false);
  });

  it('hasInvalidStations returns true when station has empty name', () => {
    stationsSignal.set([makeStation({ name: '' })]);
    expect(service.hasInvalidStations()).toBe(true);
  });

  // ── toggleEditMode ─────────────────────────────────
  it('toggleEditMode shows error when date is not today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockState.selectedDate.set(yesterday);

    await service.toggleEditMode();
    expect(mockNotify.showError).toHaveBeenCalled();
    expect(service.editMode()).toBe(false);
  });

  it('toggleEditMode enables edit mode for today', async () => {
    mockState.selectedDate.set(new Date());
    await service.toggleEditMode();
    expect(service.editMode()).toBe(true);
  });

  it('toggleEditMode saves and disables edit mode when already editing', async () => {
    mockState.selectedDate.set(new Date());
    await service.toggleEditMode(); // enable
    await service.toggleEditMode(); // save and disable
    expect(service.editMode()).toBe(false);
  });

  // ── cancelEditMode ─────────────────────────────────
  it('cancelEditMode disables edit mode', async () => {
    mockState.selectedDate.set(new Date());
    await service.toggleEditMode();
    service.cancelEditMode();
    expect(service.editMode()).toBe(false);
  });

  it('cancelEditMode calls state.loadAll', () => {
    service.cancelEditMode();
    expect(mockState.loadAll).toHaveBeenCalledWith('reset');
  });

  // ── addStation ─────────────────────────────────────
  it('addStation adds a new station to allStations', () => {
    service.addStation();
    expect(service.allStations()).toHaveLength(1);
  });

  it('addStation increments display_order', () => {
    stationsSignal.set([makeStation({ display_order: 3 })]);
    service.addStation();
    const allStations = service.allStations();
    const added = allStations[allStations.length - 1];
    expect(added.display_order).toBe(4);
  });

  it('addStation sets default name with order number', () => {
    service.addStation();
    expect(service.allStations()[0].name).toMatch(/^PS\d+/);
  });

  // ── removeStation ──────────────────────────────────
  it('removeStation removes newly added station from allStations', () => {
    service.addStation();
    const added = service.allStations()[0];
    service.removeStation(added.id);
    expect(service.allStations()).toHaveLength(0);
  });

  it('removeStation removes existing station from state.stations', () => {
    stationsSignal.set([makeStation({ id: 1 })]);
    service.removeStation(1);
    expect(stationsSignal()).toHaveLength(0);
  });

  it('removeStation marks existing station for deletion', async () => {
    stationsSignal.set([makeStation({ id: 1, name: 'PS1' })]);
    mockState.selectedDate.set(new Date());

    // enter edit mode so snapshot is captured
    await service.toggleEditMode();

    // change name so saveAll finds a diff and proceeds
    stationsSignal.update((s) => s.map((st) => ({ ...st, name: 'PS1-edited' })));

    service.removeStation(1);

    // save - should call removeStation
    await service.toggleEditMode();
    expect(mockStationsService.removeStation).toHaveBeenCalledWith(1);
  });
});
