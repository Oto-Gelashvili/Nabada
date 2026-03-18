import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SorterComponent } from './sorter';
import { SortOption } from '../../models/analytics.models';
import { Component } from '@angular/core';

const mockOptions: SortOption[] = [
  { key: 'dec-total', label: 'Total ↓' },
  { key: 'inc-total', label: 'Total ↑' },
];

describe('SorterComponent', () => {
  let component: SorterComponent;
  let fixture: ComponentFixture<SorterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SorterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SorterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();
  });

  it('sets first option as selected on init', () => {
    expect(component.selectedOption()?.key).toBe('dec-total');
  });

  it('isOpen starts as false', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('toggle opens the dropdown', () => {
    component.toggle();
    expect(component.isOpen()).toBe(true);
  });

  it('toggle closes the dropdown', () => {
    component.toggle();
    component.toggle();
    expect(component.isOpen()).toBe(false);
  });

  it('select sets selected option', () => {
    component.select(mockOptions[1]);
    expect(component.selectedOption()?.key).toBe('inc-total');
  });

  it('select closes dropdown', () => {
    component.toggle();
    component.select(mockOptions[1]);
    expect(component.isOpen()).toBe(false);
  });

  it('select emits sortChanged with option key', () => {
    const spy = vi.fn();
    component.sortChanged.subscribe(spy);
    component.select(mockOptions[1]);
    expect(spy).toHaveBeenCalledWith('inc-total');
  });
});
