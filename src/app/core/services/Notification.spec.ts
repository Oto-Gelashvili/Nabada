import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService } from './Notification';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('showSuccess adds success notification', () => {
    service.showSuccess('All good');
    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].type).toBe('success');
    expect(service.notifications()[0].message).toBe('All good');
  });

  it('showError adds error notification', () => {
    service.showError('Something failed');
    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].type).toBe('error');
    expect(service.notifications()[0].message).toBe('Something failed');
  });

  it('notification is removed after 4 seconds', () => {
    service.showSuccess('Temporary');
    expect(service.notifications()).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(service.notifications()).toHaveLength(0);
  });

  it('notification is not removed before 4 seconds', () => {
    service.showSuccess('Still here');
    vi.advanceTimersByTime(3999);
    expect(service.notifications()).toHaveLength(1);
  });

  it('multiple notifications stack', () => {
    service.showSuccess('First');
    service.showError('Second');
    expect(service.notifications()).toHaveLength(2);
  });

  it('remove deletes notification by id', () => {
    service.showSuccess('Remove me');
    const id = service.notifications()[0].id;
    service.remove(id);
    expect(service.notifications()).toHaveLength(0);
  });

  it('confirmation starts as null', () => {
    expect(service.confirmation()).toBeNull();
  });

  it('confirm sets confirmation signal', () => {
    service.confirm('Are you sure?');
    expect(service.confirmation()?.message).toBe('Are you sure?');
  });

  it('resolveConfirm resolves promise with true', async () => {
    const promise = service.confirm('Confirm?');
    service.resolveConfirm(true);
    expect(await promise).toBe(true);
  });

  it('resolveConfirm resolves promise with false', async () => {
    const promise = service.confirm('Confirm?');
    service.resolveConfirm(false);
    expect(await promise).toBe(false);
  });

  it('resolveConfirm clears confirmation signal', () => {
    service.confirm('Confirm?');
    service.resolveConfirm(true);
    expect(service.confirmation()).toBeNull();
  });
});
