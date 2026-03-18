import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LineGraphComponent } from './line-graph';
import { GraphPoint } from '../../models/analytics.models';

const makePoints = (totals: number[]): GraphPoint[] =>
  totals.map((total, i) => ({
    date: `2024-01-0${i + 1}`,
    total,
  }));

describe('LineGraphComponent', () => {
  let component: LineGraphComponent;
  let fixture: ComponentFixture<LineGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineGraphComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── maxIncome ──────────────────────────────────────
  it('maxIncome returns 1 when no data', () => {
    fixture.componentRef.setInput('data', []);
    expect(component.maxIncome).toBe(1);
  });

  it('maxIncome returns highest total', () => {
    fixture.componentRef.setInput('data', makePoints([10, 50, 30]));
    expect(component.maxIncome).toBe(50);
  });

  // ── plottedPoints ──────────────────────────────────
  it('plottedPoints returns empty array when no data', () => {
    fixture.componentRef.setInput('data', []);
    expect(component.plottedPoints).toHaveLength(0);
  });

  it('plottedPoints returns correct number of points', () => {
    fixture.componentRef.setInput('data', makePoints([10, 20, 30]));
    expect(component.plottedPoints).toHaveLength(3);
  });

  it('first plottedPoint starts at paddingLeft', () => {
    fixture.componentRef.setInput('data', makePoints([10, 20]));
    expect(component.plottedPoints[0].x).toBe(component.paddingLeft);
  });

  it('last plottedPoint ends at svgWidth minus paddingRight', () => {
    fixture.componentRef.setInput('data', makePoints([10, 20]));
    const pts = component.plottedPoints;
    expect(pts[pts.length - 1].x).toBe(component.svgWidth - component.paddingRight);
  });

  it('highest value point has lowest y (closer to top)', () => {
    fixture.componentRef.setInput('data', makePoints([10, 100]));
    const pts = component.plottedPoints;
    expect(pts[1].y).toBeLessThan(pts[0].y);
  });

  // ── linePath ───────────────────────────────────────
  it('linePath returns empty string when no data', () => {
    fixture.componentRef.setInput('data', []);
    expect(component.linePath).toBe('');
  });

  it('linePath starts with M for single point', () => {
    fixture.componentRef.setInput('data', makePoints([50]));
    expect(component.linePath).toMatch(/^M/);
  });

  it('linePath contains bezier curves for multiple points', () => {
    fixture.componentRef.setInput('data', makePoints([10, 50, 30]));
    expect(component.linePath).toContain('C');
  });

  // ── fillPath ───────────────────────────────────────
  it('fillPath returns empty string when no data', () => {
    fixture.componentRef.setInput('data', []);
    expect(component.fillPath).toBe('');
  });

  it('fillPath closes with Z', () => {
    fixture.componentRef.setInput('data', makePoints([10, 50]));
    expect(component.fillPath).toMatch(/Z$/);
  });

  // ── tooltip ────────────────────────────────────────
  it('tooltip starts as null', () => {
    expect(component.tooltip()).toBeNull();
  });

  it('onMouseLeave clears tooltip', () => {
    component.tooltip.set({ x: 100, y: 100, index: 0 });
    component.onMouseLeave();
    expect(component.tooltip()).toBeNull();
  });
});
