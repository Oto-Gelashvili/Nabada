import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineCalculator } from './timeline-calculator';

const TODAY = new Date('2024-01-01');

describe('TimelineCalculator', () => {
  let calc: TimelineCalculator;

  beforeEach(() => {
    calc = new TimelineCalculator(100);
  });

  // ── calculateLeft ──────────────────────────────────
  it('calculateLeft returns 0 for midnight', () => {
    expect(calc.calculateLeft('2024-01-01T00:00:00', TODAY)).toBe(0);
  });

  it('calculateLeft returns 100 for 01:00', () => {
    expect(calc.calculateLeft('2024-01-01T01:00:00', TODAY)).toBe(100);
  });

  it('calculateLeft returns 50 for 00:30', () => {
    expect(calc.calculateLeft('2024-01-01T00:30:00', TODAY)).toBeCloseTo(50);
  });

  it('calculateLeft returns 0 when session starts before selected date', () => {
    expect(calc.calculateLeft('2023-12-31T10:00:00', TODAY)).toBe(0);
  });

  // ── calculateWidth ─────────────────────────────────
  it('calculateWidth returns 100 for 1 hour session', () => {
    const now = new Date('2024-01-01T11:00:00').getTime();
    expect(calc.calculateWidth('2024-01-01T10:00:00', '2024-01-01T11:00:00', TODAY, now)).toBe(100);
  });

  it('calculateWidth returns 0 for zero duration', () => {
    const now = new Date('2024-01-01T10:00:00').getTime();
    expect(calc.calculateWidth('2024-01-01T10:00:00', '2024-01-01T10:00:00', TODAY, now)).toBe(0);
  });

  it('calculateWidth uses nowMs when end is null', () => {
    const startMs = new Date('2024-01-01T10:00:00').getTime();
    const nowMs = startMs + 60 * 60 * 1000; // 1hr later
    const width = calc.calculateWidth('2024-01-01T10:00:00', null, TODAY, nowMs);
    expect(width).toBeCloseTo(100);
  });

  // ── getOverlapClass ────────────────────────────────
  it('getOverlapClass returns empty string for normal session', () => {
    const nowMs = new Date('2024-01-01T11:00:00').getTime();
    const result = calc.getOverlapClass(
      { start_time: '2024-01-01T10:00:00', end_time: '2024-01-01T11:00:00' },
      TODAY,
      nowMs,
    );
    expect(result).toBe('');
  });

  it('getOverlapClass returns overflow-left when session starts before day', () => {
    const nowMs = new Date('2024-01-01T10:00:00').getTime();
    const result = calc.getOverlapClass(
      { start_time: '2023-12-31T23:00:00', end_time: '2024-01-01T01:00:00' },
      TODAY,
      nowMs,
    );
    expect(result).toContain('overflow-left');
  });

  it('getOverlapClass returns overflow-right when session ends after day', () => {
    const nowMs = new Date('2024-01-02T01:00:00').getTime();
    const result = calc.getOverlapClass(
      { start_time: '2024-01-01T23:00:00', end_time: '2024-01-02T01:00:00' },
      TODAY,
      nowMs,
    );
    expect(result).toContain('overflow-right');
  });

  // ── getStateClass ──────────────────────────────────
  it('getStateClass returns NotPaid for ongoing session', () => {
    expect(
      calc.getStateClass({
        start_time: '2024-01-01T10:00:00',
        end_time: null,
        pay_method: 'Cash',
      }),
    ).toBe('NotPaid');
  });

  it('getStateClass returns NotPaid when pay_method includes NotPaid', () => {
    expect(
      calc.getStateClass({
        start_time: '2024-01-01T10:00:00',
        end_time: '2024-01-01T11:00:00',
        pay_method: 'Cash,NotPaid',
      }),
    ).toBe('NotPaid');
  });

  it('getStateClass returns Cash for fully paid Cash session', () => {
    expect(
      calc.getStateClass({
        start_time: '2024-01-01T10:00:00',
        end_time: '2024-01-01T11:00:00',
        pay_method: 'Cash',
      }),
    ).toBe('Cash');
  });

  it('getStateClass returns empty string for multi-method session', () => {
    expect(
      calc.getStateClass({
        start_time: '2024-01-01T10:00:00',
        end_time: '2024-01-01T11:00:00',
        pay_method: 'Cash,Card',
      }),
    ).toBe('');
  });

  // ── getStateStyle ──────────────────────────────────
  it('getStateStyle returns empty object for ongoing session', () => {
    expect(
      calc.getStateStyle({
        start_time: '2024-01-01T10:00:00',
        end_time: null,
        pay_method: 'Cash',
      }),
    ).toEqual({});
  });

  it('getStateStyle returns empty object for single pay method', () => {
    expect(
      calc.getStateStyle({
        start_time: '2024-01-01T10:00:00',
        end_time: '2024-01-01T11:00:00',
        pay_method: 'Cash',
      }),
    ).toEqual({});
  });

  it('getStateStyle returns gradient for multi-method session', () => {
    const style = calc.getStateStyle({
      start_time: '2024-01-01T10:00:00',
      end_time: '2024-01-01T11:00:00',
      pay_method: 'Cash,Card',
    });
    expect(style['background']).toContain('linear-gradient');
  });

  it('getStateStyle returns empty object for NotPaid session', () => {
    expect(
      calc.getStateStyle({
        start_time: '2024-01-01T10:00:00',
        end_time: '2024-01-01T11:00:00',
        pay_method: 'NotPaid',
      }),
    ).toEqual({});
  });
});
