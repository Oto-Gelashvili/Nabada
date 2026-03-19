import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionFormService } from './form.service';
import { Product } from '../../../models/products.model';
import { ServiceSession } from '../../../models/sessions';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Water',
  price: 2,
  quantity: 10,
  ...overrides,
});

const makeSession = (overrides: Partial<ServiceSession> = {}): ServiceSession => ({
  id: 1,
  station_id: 1,
  start_time: new Date(Date.now() - 60 * 60_000).toISOString(),
  end_time: new Date().toISOString(),
  status: 'finished',
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

describe('SessionFormService', () => {
  let service: SessionFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SessionFormService] });
    service = TestBed.inject(SessionFormService);
  });

  // ── isNotPaid / hasUnpaidRemainder ─────────────────
  it('isNotPaid returns true when no pay methods selected', () => {
    expect(service.isNotPaid()).toBe(true);
  });

  it('isNotPaid returns false when pay method selected', () => {
    service.togglePayMethod('Cash');
    expect(service.isNotPaid()).toBe(false);
  });

  it('hasUnpaidRemainder returns true when paid less than total', () => {
    service.togglePayMethod('Cash');
    service.setPayAmount('Cash', 5);
    expect(service.hasUnpaidRemainder(10)).toBe(true);
  });

  it('hasUnpaidRemainder returns false when fully paid', () => {
    service.togglePayMethod('Cash');
    service.setPayAmount('Cash', 10);
    expect(service.hasUnpaidRemainder(10)).toBe(false);
  });

  // ── togglePayMethod ────────────────────────────────
  it('togglePayMethod adds pay method', () => {
    service.togglePayMethod('Cash');
    expect(service.isPayMethodSelected('Cash')).toBe(true);
  });

  it('togglePayMethod removes pay method', () => {
    service.togglePayMethod('Cash');
    service.togglePayMethod('Cash');
    expect(service.isPayMethodSelected('Cash')).toBe(false);
  });

  it('togglePayMethod resets fitpassCount when Fitpass deselected', () => {
    service.togglePayMethod('Fitpass');
    service.setFitpassCount(3);
    service.togglePayMethod('Fitpass');
    expect(service.fitpassCount()).toBe(0);
  });

  // ── setPayAmount / getPayAmount ────────────────────
  it('setPayAmount updates amount for key', () => {
    service.togglePayMethod('Cash');
    service.setPayAmount('Cash', 15);
    expect(service.getPayAmount('Cash')).toBe(15);
  });

  it('getPayAmount returns 0 for unselected method', () => {
    expect(service.getPayAmount('Card')).toBe(0);
  });

  it('totalPaid sums all pay method amounts', () => {
    service.togglePayMethod('Cash');
    service.togglePayMethod('Card');
    service.setPayAmount('Cash', 5);
    service.setPayAmount('Card', 3);
    expect(service.totalPaid()).toBe(8);
  });

  // ── getMaxFitpasses ────────────────────────────────
  it('getMaxFitpasses returns 0 for less than 1 hour', () => {
    expect(service.getMaxFitpasses(30, 0)).toBe(0);
  });

  it('getMaxFitpasses returns 1 for 1 hour with default controllers', () => {
    expect(service.getMaxFitpasses(60, 0)).toBe(1);
  });

  it('getMaxFitpasses returns 2 for 1 hour with 4 controllers', () => {
    expect(service.getMaxFitpasses(60, 2)).toBe(2);
  });

  it('getMaxFitpasses returns 4 for 2 hours with 4 controllers', () => {
    expect(service.getMaxFitpasses(120, 2)).toBe(4);
  });

  // ── buildTotalSum ──────────────────────────────────
  it('1hr no fitpass no extra controllers = 8 lari', () => {
    service.form.patchValue({
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00'),
      controllerAmount: 2,
    });
    const total = service.buildTotalSum([], 8, 5, 2);
    expect(total).toBe(8);
  });

  it('1hr 4ctrl 1fp = 11 lari', () => {
    service.form.patchValue({
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00'),
      controllerAmount: 4,
    });
    service.togglePayMethod('Fitpass');
    service.setFitpassCount(1);
    const total = service.buildTotalSum([], 8, 5, 2);
    expect(total).toBe(11);
  });

  it('1hr 4ctrl 2fp = 10 lari', () => {
    service.form.patchValue({
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00'),
      controllerAmount: 4,
    });
    service.togglePayMethod('Fitpass');
    service.setFitpassCount(2);
    const total = service.buildTotalSum([], 8, 5, 2);
    expect(total).toBe(10);
  });

  it('2hr 4ctrl 1fp = 23 lari', () => {
    service.form.patchValue({
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T12:00:00'),
      controllerAmount: 4,
    });
    service.togglePayMethod('Fitpass');
    service.setFitpassCount(1);
    const total = service.buildTotalSum([], 8, 5, 2);
    expect(total).toBe(23);
  });

  it('2hr 3ctrl 1fp = 18 lari', () => {
    service.form.patchValue({
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T12:00:00'),
      controllerAmount: 3,
    });
    service.togglePayMethod('Fitpass');
    service.setFitpassCount(1);
    const total = service.buildTotalSum([], 8, 5, 2);
    expect(total).toBe(18);
  });

  it('adds product cost to total', () => {
    service.form.patchValue({
      startTime: new Date('2024-01-01T10:00:00'),
      endTime: new Date('2024-01-01T11:00:00'),
      controllerAmount: 2,
      productIds: [1],
    });
    service.amounts.set([{ id: 1, amount: 2 }]);
    const total = service.buildTotalSum([makeProduct({ price: 3 })], 8, 5, 2);
    expect(total).toBe(14); // 8 gaming + 6 products
  });

  // ── patchFromSession ───────────────────────────────
  it('patchFromSession restores cash payment', () => {
    service.patchFromSession(makeSession({ cash_paid: 8 }), [], []);
    expect(service.isPayMethodSelected('Cash')).toBe(true);
    expect(service.getPayAmount('Cash')).toBe(8);
  });

  it('patchFromSession restores fitpass count', () => {
    service.patchFromSession(makeSession({ fitpass_paid: 5, fitpass_count: 1 }), [], []);
    expect(service.fitpassCount()).toBe(1);
    expect(service.isPayMethodSelected('Fitpass')).toBe(true);
  });

  it('patchFromSession patches form values', () => {
    const session = makeSession({ station_id: 3, controller_amount: 4 });
    service.patchFromSession(session, [], []);
    expect(service.form.value.stationId).toBe(3);
    expect(service.form.value.controllerAmount).toBe(4);
  });

  // ── reset ──────────────────────────────────────────
  it('reset clears fitpassCount', () => {
    service.setFitpassCount(3);
    service.reset();
    expect(service.fitpassCount()).toBe(0);
  });

  it('reset clears payMethodAmounts', () => {
    service.togglePayMethod('Cash');
    service.reset();
    expect(service.isNotPaid()).toBe(true);
  });
});
