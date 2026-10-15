import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavMenu } from './nav-menu';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase';
import { NotificationService } from '../../../../core/services/Notification';
import { signal } from '@angular/core';
import { AppNotification } from '../../../../core/services/Notification';

const mockSupabase = {
  signOut: vi.fn().mockResolvedValue(undefined),
  getCurrentProfile: vi.fn().mockResolvedValue(null),
};

const mockNotify = {
  notifications: signal<AppNotification[]>([]),
  confirmation: signal<{ message: string; resolve: (r: boolean) => void } | null>(null),
  showError: vi.fn(),
  resolveConfirm: vi.fn(),
};

describe('NavMenu', () => {
  let component: NavMenu;
  let fixture: ComponentFixture<NavMenu>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [NavMenu, RouterModule.forRoot([])],
      providers: [
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: NotificationService, useValue: mockNotify },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('open starts as false', () => {
    expect(component.open()).toBe(false);
  });

  it('toggleState flips open', () => {
    component.toggleState();
    expect(component.open()).toBe(true);

    component.toggleState();
    expect(component.open()).toBe(false);
  });

  it('signOut calls supabase.signOut', async () => {
    await component.signOut();
    expect(mockSupabase.signOut).toHaveBeenCalledOnce();
  });

  it('signOut sets loading to false after completing', async () => {
    await component.signOut();
    expect(component.loading()).toBe(false);
  });

  it('signOut closes menu after signing out', async () => {
    component.open.set(true);
    await component.signOut();
    expect(component.open()).toBe(false);
  });

  it('signOut shows error if supabase throws', async () => {
    mockSupabase.signOut.mockRejectedValueOnce(new Error('Network error'));
    await component.signOut();
    expect(mockNotify.showError).toHaveBeenCalledWith('Network error');
  });

  it('fetchProfile sets userProfile when profile returned', async () => {
    mockSupabase.getCurrentProfile.mockResolvedValueOnce({
      username: 'oto',
      avatar_url: null,
    });

    await component.fetchProfile();

    expect(component.userProfile()).toEqual({ username: 'oto', avatar_url: null });
  });

  it('fetchProfile leaves userProfile null when nothing returned', async () => {
    mockSupabase.getCurrentProfile.mockResolvedValueOnce(null);
    await component.fetchProfile();
    expect(component.userProfile()).toBeNull();
  });

  it('fetchProfile shows error if supabase throws', async () => {
    mockSupabase.getCurrentProfile.mockRejectedValueOnce(new Error('Auth error'));
    await component.fetchProfile();
    expect(mockNotify.showError).toHaveBeenCalledWith('Auth error');
  });

  it('removes click listener on destroy', () => {
    const spy = vi.spyOn(component['document'], 'removeEventListener');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
