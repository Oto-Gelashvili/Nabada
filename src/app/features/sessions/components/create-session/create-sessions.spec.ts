import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSessionComponent } from './create-sessions';
import { StationsService } from '../../../../core/services/station.service';
import { NotificationService } from '../../../../core/services/Notification';
import { AppNotification } from '../../../../core/services/Notification';
import { signal } from '@angular/core';
import { ServiceSession } from '../../../../models/sessions';
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

const mockStationsService = {
  createSession: vi.fn().mockResolvedValue({ closed_session_id: null }),
  updateSession: vi.fn().mockResolvedValue({}),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  getSessionItems: vi.fn().mockResolvedValue([]),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  resolveConfirm: vi.fn(),
};

describe('CreateSessionComponent', () => {
  let component: CreateSessionComponent;
  let fixture: ComponentFixture<CreateSessionComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CreateSessionComponent],
      providers: [
        { provide: StationsService, useValue: mockStationsService },
        { provide: NotificationService, useValue: mockNotify },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSessionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedDate', new Date());
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ── dropdowns ──────────────────────────────────────
  it('all dropdowns start closed', () => {
    expect(component['isPayMethodOpen']()).toBe(false);
    expect(component['isControllerOpen']()).toBe(false);
    expect(component['isCustomSelectOpen']()).toBe(false);
    expect(component['isCustomMultiSelectOpen']()).toBe(false);
  });

  it('togglePaySelect opens pay method dropdown', () => {
    component['togglePaySelect']();
    expect(component['isPayMethodOpen']()).toBe(true);
  });

  it('togglePaySelect closes other dropdowns', () => {
    component['isControllerOpen'].set(true);
    component['togglePaySelect']();
    expect(component['isControllerOpen']()).toBe(false);
  });

  it('toggleControllerSelect opens controller dropdown', () => {
    component['toggleControllerSelect']();
    expect(component['isControllerOpen']()).toBe(true);
  });

  it('toggleControllerSelect closes other dropdowns', () => {
    component['isPayMethodOpen'].set(true);
    component['toggleControllerSelect']();
    expect(component['isPayMethodOpen']()).toBe(false);
  });

  // ── fitpass stepper ────────────────────────────────
  it('fitpassCount starts at 0', () => {
    expect(component['formService'].fitpassCount()).toBe(0);
  });

  it('decrementFitpass does not go below 0', () => {
    component['decrementFitpass']();
    expect(component['formService'].fitpassCount()).toBe(0);
  });

  it('incrementFitpass does not exceed max', () => {
    // max is 0 when no end time set — can't increment
    component['incrementFitpass']();
    expect(component['formService'].fitpassCount()).toBe(0);
  });

  // ── canEndSession ──────────────────────────────────
  it('canEndSession returns false when no editableSessionID', () => {
    fixture.componentRef.setInput('editableSessionID', null);
    fixture.detectChanges();
    expect(component['canEndSession']()).toBe(false);
  });

  it('canEndSession returns true for active session', () => {
    const session = makeSession({ id: 5 });
    fixture.componentRef.setInput('editableSessionID', 5);
    fixture.componentRef.setInput('existingSessions', [session]);
    fixture.detectChanges();
    expect(component['canEndSession']()).toBe(true);
  });

  it('canEndSession returns false for future session', () => {
    const session = makeSession({
      id: 5,
      start_time: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
    fixture.componentRef.setInput('editableSessionID', 5);
    fixture.componentRef.setInput('existingSessions', [session]);
    fixture.detectChanges();
    expect(component['canEndSession']()).toBe(false);
  });

  // ── onSubmit validation ────────────────────────────
  it('onSubmit shows error when form is invalid', async () => {
    component['formService'].form.controls.stationId.setValue(null);
    await component.onSubmit();
    expect(mockNotify.showError).toHaveBeenCalled();
  });

  it('onSubmit calls createSession when form is valid', async () => {
    component['formService'].form.patchValue({
      stationId: 1,
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00'),
    });
    fixture.componentRef.setInput('selectedDate', new Date('2024-01-01'));
    await component.onSubmit();
    expect(mockStationsService.createSession).toHaveBeenCalled();
  });

  // ── deleteSession ──────────────────────────────────
  it('deleteSession does nothing when no sessionId', async () => {
    fixture.componentRef.setInput('editableSessionID', null);
    await component.deleteSession();
    expect(mockStationsService.deleteSession).not.toHaveBeenCalled();
  });

  it('deleteSession calls service when confirmed', async () => {
    fixture.componentRef.setInput('editableSessionID', 5);
    mockNotify.confirm.mockResolvedValueOnce(true);
    await component.deleteSession();
    expect(mockStationsService.deleteSession).toHaveBeenCalledWith(5);
  });

  it('deleteSession does not call service when cancelled', async () => {
    fixture.componentRef.setInput('editableSessionID', 5);
    mockNotify.confirm.mockResolvedValueOnce(false);
    await component.deleteSession();
    expect(mockStationsService.deleteSession).not.toHaveBeenCalled();
  });

  // ── onCancel ───────────────────────────────────────
  it('onCancel emits close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component['onCancel']();
    expect(spy).toHaveBeenCalledOnce();
  });
});
