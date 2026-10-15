import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionsHeaderComponent } from './sessions-header';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SessionsHeaderComponent', () => {
  let component: SessionsHeaderComponent;
  let fixture: ComponentFixture<SessionsHeaderComponent>;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionsHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionsHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('date', new Date(yesterday));
    fixture.detectChanges();
  });

  // ── isToday ────────────────────────────────────────
  it('isToday returns false for yesterday', () => {
    expect(component.isToday()).toBe(false);
  });

  it('isToday returns true for today', () => {
    fixture.componentRef.setInput('date', new Date());
    fixture.detectChanges();
    expect(component.isToday()).toBe(true);
  });

  // ── changeDay ──────────────────────────────────────
  it('changeDay(-1) moves date back one day', () => {
    const before = new Date(component.date());
    component.changeDay(-1);
    const after = new Date(component.date());
    expect(after.getDate()).toBe(before.getDate() - 1);
  });

  it('changeDay(1) moves date forward one day', () => {
    const before = new Date(component.date());
    component.changeDay(1);
    const after = new Date(component.date());
    expect(after.getDate()).toBe(before.getDate() + 1);
  });

  it('changeDay(1) does not go past today', () => {
    fixture.componentRef.setInput('date', new Date(today));
    component.changeDay(1);
    expect(component.date().getDate()).toBe(today.getDate());
  });

  // ── outputs ────────────────────────────────────────
  it('onCancel emits cancelEdit', () => {
    const spy = vi.fn();
    component.cancelEdit.subscribe(spy);
    component.onCancel();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('createClick emits when called', () => {
    const spy = vi.fn();
    component.createClick.subscribe(spy);
    component.createClick.emit();
    expect(spy).toHaveBeenCalledOnce();
  });
});
