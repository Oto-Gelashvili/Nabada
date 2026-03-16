import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeSwitcher } from './theme-switcher';

describe('ThemeSwitcher', () => {
  let component: ThemeSwitcher;
  let fixture: ComponentFixture<ThemeSwitcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeSwitcher],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSwitcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme to light', () => {
    component.setTheme('light', 'sun');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets data-theme to dark', () => {
    component.setTheme('dark', 'moon');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('saves theme to localStorage', () => {
    component.setTheme('dark', 'moon');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('sets isAnimating to sun when light clicked', () => {
    component.setTheme('light', 'sun');
    expect(component.isAnimating()).toBe('sun');
  });

  it('sets isAnimating to moon when dark clicked', () => {
    component.setTheme('dark', 'moon');
    expect(component.isAnimating()).toBe('moon');
  });

  it('clears isAnimating after animation ends', () => {
    component.setTheme('dark', 'moon');
    component.onAnimationEnd();
    expect(component.isAnimating()).toBeNull();
  });
});
