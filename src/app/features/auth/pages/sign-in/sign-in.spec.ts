import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignIn } from './sign-in';
import { SupabaseService } from '../../../../core/services/supabase';
import { NotificationService } from '../../../../core/services/Notification';
import { AppNotification } from '../../../../core/services/Notification';
import { signal } from '@angular/core';
import { NgForm } from '@angular/forms';

const mockSupabase = {
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  resolveConfirm: vi.fn(),
};

// helper to create a fake NgForm
const makeForm = (valid: boolean) =>
  ({
    invalid: !valid,
    resetForm: vi.fn(),
  }) as unknown as NgForm;

describe('SignIn', () => {
  let component: SignIn;
  let fixture: ComponentFixture<SignIn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: NotificationService, useValue: mockNotify },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignIn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── toggleSignInMode ───────────────────────────────
  it('starts in sign up mode', () => {
    expect(component.isSignInMode()).toBe(false);
  });

  it('toggleSignInMode switches to sign in mode', () => {
    component.toggleSignInMode();
    expect(component.isSignInMode()).toBe(true);
  });

  it('toggleSignInMode switches back to sign up mode', () => {
    component.toggleSignInMode();
    component.toggleSignInMode();
    expect(component.isSignInMode()).toBe(false);
  });

  // ── submit ─────────────────────────────────────────
  it('does not call signIn when form is invalid', async () => {
    await component.submit(makeForm(false));
    expect(mockSupabase.signIn).not.toHaveBeenCalled();
  });

  it('triggers shake when form is invalid', async () => {
    await component.submit(makeForm(false));
    expect(component.isShaking()).toBe(true);
  });

  it('calls signIn with email when form is valid', async () => {
    component.email.set('test@example.com');
    await component.submit(makeForm(true));
    expect(mockSupabase.signIn).toHaveBeenCalledWith('test@example.com');
  });

  it('shows success notification on successful submit', async () => {
    component.email.set('test@example.com');
    await component.submit(makeForm(true));
    expect(mockNotify.showSuccess).toHaveBeenCalled();
  });

  it('sets loading to false after submit', async () => {
    await component.submit(makeForm(true));
    expect(component.isLoading()).toBe(false);
  });

  it('shows error when signIn returns error', async () => {
    mockSupabase.signIn.mockResolvedValueOnce({ error: new Error('Invalid email') });
    component.email.set('test@example.com');
    await component.submit(makeForm(true));
    expect(mockNotify.showError).toHaveBeenCalledWith('Invalid email');
  });

  // ── loginWithGoogle ────────────────────────────────
  it('calls signInWithGoogle', async () => {
    await component.loginWithGoogle();
    expect(mockSupabase.signInWithGoogle).toHaveBeenCalledOnce();
  });

  it('shows error when google sign in fails', async () => {
    mockSupabase.signInWithGoogle.mockResolvedValueOnce({ error: new Error('Popup closed') });
    await component.loginWithGoogle();
    expect(mockNotify.showError).toHaveBeenCalledWith('Popup closed');
  });
});
