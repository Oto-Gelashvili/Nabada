import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorModal } from './error-modal';
import { AppNotification, NotificationService } from '../../../core/services/Notification';
import { signal } from '@angular/core';

const mockNotificationService = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (result: boolean) => void } | null>(null),
  resolveConfirm: vi.fn(),
};

describe('ErrorModal', () => {
  let component: ErrorModal;
  let fixture: ComponentFixture<ErrorModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorModal],
      providers: [{ provide: NotificationService, useValue: mockNotificationService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockNotificationService.notifications.set([]);
    mockNotificationService.confirmation.set(null);
  });

  it('calls resolveConfirm with true when confirmed', () => {
    component.resolveConfirm(true);
    expect(mockNotificationService.resolveConfirm).toHaveBeenCalledWith(true);
  });

  it('calls resolveConfirm with false when cancelled', () => {
    component.resolveConfirm(false);
    expect(mockNotificationService.resolveConfirm).toHaveBeenCalledWith(false);
  });

  it('exposes notifications from service', () => {
    mockNotificationService.notifications.set([{ id: 1, type: 'success', message: 'Done' }]);
    expect(component.notifications()).toHaveLength(1);
  });
});
