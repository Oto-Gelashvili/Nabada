import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Settings } from './settings';
import { SupabaseService } from '../../core/services/supabase';
import { NotificationService } from '../../core/services/Notification';
import { AppNotification } from '../../core/services/Notification';
import { signal } from '@angular/core';

const mockProfile = {
  id: 'user-1',
  username: 'oto',
  avatar_url: null,
  email: 'oto@test.com',
  hourly_rate: 8,
  fitpass_rate: 5,
  controller_rate: 2,
};

const mockSupabase = {
  getCurrentProfile: vi.fn().mockResolvedValue(mockProfile),
  updateProfile: vi.fn().mockResolvedValue({ error: null }),
  updateEmail: vi.fn().mockResolvedValue({ error: null }),
  uploadAvatar: vi.fn().mockResolvedValue({ error: null }),
  getPublicUrl: vi.fn().mockReturnValue('https://example.com/avatar.jpg'),
  deleteAccount: vi.fn().mockResolvedValue(undefined),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  resolveConfirm: vi.fn(),
};

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: NotificationService, useValue: mockNotify },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ── loadProfile ────────────────────────────────────
  it('loads profile and patches form on init', () => {
    expect(component.profileForm.value.username).toBe('oto');
    expect(component.profileForm.value.rate).toBe(8);
    expect(component.profileForm.value.fitpass).toBe(5);
    expect(component.profileForm.value.controller).toBe(2);
  });

  it('loads email into emailForm', () => {
    expect(component.emailForm.value.email).toBe('oto@test.com');
  });

  it('sets loading to false after load', () => {
    expect(component.loading()).toBe(false);
  });

  // ── toggleEditingState ─────────────────────────────
  it('isEditing starts as false', () => {
    expect(component.isEditing()).toBe(false);
  });

  it('toggleEditingState enables editing', () => {
    component.toggleEditingState();
    expect(component.isEditing()).toBe(true);
  });

  it('toggleEditingState disables editing and reloads profile', async () => {
    component.toggleEditingState(); // enable
    component.toggleEditingState(); // disable
    await fixture.whenStable();
    expect(component.isEditing()).toBe(false);
    expect(mockSupabase.getCurrentProfile).toHaveBeenCalledTimes(2); // init + reload
  });

  // ── updateProfile ──────────────────────────────────
  it('updateProfile shows error when userId is missing', async () => {
    (component as any).userId = null;
    await component.updateProfile();
    expect(mockNotify.showError).toHaveBeenCalled();
  });

  it('updateProfile calls updateProfile service when form is dirty', async () => {
    component.profileForm.controls.username.markAsDirty();
    await component.updateProfile();
    expect(mockSupabase.updateProfile).toHaveBeenCalled();
  });

  it('updateProfile sets isEditing to false after save', async () => {
    component.isEditing.set(true);
    component.profileForm.controls.username.markAsDirty();
    await component.updateProfile();
    expect(component.isEditing()).toBe(false);
  });

  it('updateProfile does not call service when form is pristine', async () => {
    mockSupabase.updateProfile.mockClear();
    await component.updateProfile();
    expect(mockSupabase.updateProfile).not.toHaveBeenCalled();
  });

  // ── saveEmail ──────────────────────────────────────
  it('saveEmail shows error when userId is missing', async () => {
    (component as any).userId = null;
    await component.saveEmail();
    expect(mockNotify.showError).toHaveBeenCalled();
  });

  it('saveEmail calls updateEmail service', async () => {
    component.emailForm.patchValue({ email: 'new@test.com' });
    component.emailForm.markAsDirty();
    await component.saveEmail();
    expect(mockSupabase.updateEmail).toHaveBeenCalledWith('new@test.com');
  });

  it('saveEmail sets updatingEmail to false after completing', async () => {
    component.emailForm.patchValue({ email: 'new@test.com' });
    await component.saveEmail();
    expect(component.updatingEmail()).toBe(false);
  });

  // ── onDelete ───────────────────────────────────────
  it('onDelete calls deleteAccount when confirmed', async () => {
    mockNotify.confirm.mockResolvedValueOnce(true);
    await component.onDelete();
    expect(mockSupabase.deleteAccount).toHaveBeenCalled();
  });

  it('onDelete does not call deleteAccount when cancelled', async () => {
    mockNotify.confirm.mockResolvedValueOnce(false);
    await component.onDelete();
    expect(mockSupabase.deleteAccount).not.toHaveBeenCalled();
  });

  it('onDelete sets loading to false after completing', async () => {
    mockNotify.confirm.mockResolvedValueOnce(true);
    await component.onDelete();
    expect(component.loading()).toBe(false);
  });

  // ── onAvatarSelected ───────────────────────────────
  it('onAvatarSelected shows error when file is too large', async () => {
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'avatar.png', {
      type: 'image/png',
    });
    const event = {
      target: { files: [largeFile], value: '' },
    } as unknown as Event;

    await component.onAvatarSelected(event);
    expect(mockNotify.showError).toHaveBeenCalled();
  });
});
