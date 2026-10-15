import { describe, it, expect, beforeEach } from 'vitest';
import { SessionOverlapValidator } from './overlap-validator';
import { ServiceSession } from '../../../models/sessions';

const makeSession = (overrides: Partial<ServiceSession> = {}): ServiceSession => ({
  id: 1,
  station_id: 1,
  start_time: '2024-01-01T10:00:00',
  end_time: '2024-01-01T11:00:00',
  status: 'active',
  pay_method: 'Cash',
  total_cost: 8,
  hourly_rate: 8,
  controller_amount: 2,
  controller_cost: 0,
  cash_paid: 8,
  card_paid: 0,
  fitpass_paid: 0,
  fitpass_count: 0,
  ...overrides,
});

describe('SessionOverlapValidator', () => {
  let validator: SessionOverlapValidator;

  beforeEach(() => {
    validator = new SessionOverlapValidator();
  });

  it('returns false when no sessions exist', () => {
    const result = validator.hasOverlap(
      [],
      1,
      new Date('2024-01-01T10:00:00'),
      new Date('2024-01-01T11:00:00'),
    );
    expect(result).toBe(false);
  });

  it('returns false when sessions are on different stations', () => {
    const sessions = [makeSession({ station_id: 2 })];
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T10:00:00'),
      new Date('2024-01-01T11:00:00'),
    );
    expect(result).toBe(false);
  });

  it('returns true when new session overlaps existing', () => {
    const sessions = [makeSession()]; // 10:00 - 11:00
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T10:30:00'),
      new Date('2024-01-01T11:30:00'),
    );
    expect(result).toBe(true);
  });

  it('returns true when new session is fully inside existing', () => {
    const sessions = [makeSession()]; // 10:00 - 11:00
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T10:15:00'),
      new Date('2024-01-01T10:45:00'),
    );
    expect(result).toBe(true);
  });

  it('returns true when existing session is inside new session', () => {
    const sessions = [makeSession()]; // 10:00 - 11:00
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T09:00:00'),
      new Date('2024-01-01T12:00:00'),
    );
    expect(result).toBe(true);
  });

  it('returns false when new session ends exactly when existing starts', () => {
    const sessions = [makeSession()]; // 10:00 - 11:00
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T09:00:00'),
      new Date('2024-01-01T10:00:00'),
    );
    expect(result).toBe(false);
  });

  it('returns false when new session starts exactly when existing ends', () => {
    const sessions = [makeSession()]; // 10:00 - 11:00
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T11:00:00'),
      new Date('2024-01-01T12:00:00'),
    );
    expect(result).toBe(false);
  });

  it('returns false when excluded session would overlap', () => {
    const sessions = [makeSession({ id: 5 })];
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T10:30:00'),
      new Date('2024-01-01T11:30:00'),
      5, // exclude this session (editing it)
    );
    expect(result).toBe(false);
  });

  it('returns true when overlapping a different session even with excludeId', () => {
    const sessions = [
      makeSession({ id: 5 }),
      makeSession({ id: 6, start_time: '2024-01-01T10:30:00', end_time: '2024-01-01T11:30:00' }),
    ];
    const result = validator.hasOverlap(
      sessions,
      1,
      new Date('2024-01-01T10:00:00'),
      new Date('2024-01-01T11:00:00'),
      5,
    );
    expect(result).toBe(true);
  });
});
