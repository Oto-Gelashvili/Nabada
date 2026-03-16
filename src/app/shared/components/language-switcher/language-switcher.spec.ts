import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LOCALE_ID } from '@angular/core';
import { LanguageSwitcher } from './language-switcher';

const mockLocation = {
  pathname: '/en/sessions',
  href: '',
};

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  });
});

afterEach(() => {
  localStorage.clear();
  mockLocation.pathname = '/en/sessions';
  mockLocation.href = '';
});

describe('LanguageSwitcher (en locale)', () => {
  let component: LanguageSwitcher;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [{ provide: LOCALE_ID, useValue: 'en' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageSwitcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sets loading to true when switching', () => {
    component.switchLang();
    expect(component.loading()).toBe(true);
  });

  it('saves ka to localStorage', () => {
    component.switchLang();
    expect(localStorage.getItem('preferred-locale')).toBe('ka');
  });

  it('navigates to ka path', () => {
    component.switchLang();
    expect(window.location.href).toBe('/ka/sessions');
  });
});

describe('LanguageSwitcher (ka locale)', () => {
  let component: LanguageSwitcher;

  beforeEach(async () => {
    mockLocation.pathname = '/ka/sessions';

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [{ provide: LOCALE_ID, useValue: 'ka' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LanguageSwitcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('saves en to localStorage', () => {
    component.switchLang();
    expect(localStorage.getItem('preferred-locale')).toBe('en');
  });

  it('navigates to en path', () => {
    component.switchLang();
    expect(window.location.href).toBe('/sessions');
  });
});
