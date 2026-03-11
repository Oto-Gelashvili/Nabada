import { Injectable, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Product, ProductAmount } from '../../../models/products.model';
import { ServiceSession, Station } from '../../../models/sessions';

export interface PayMethodAmount {
  key: string;
  amount: number;
}

@Injectable()
export class SessionFormService {
  readonly form = new FormGroup({
    stationId: new FormControl<number | null>(null, [Validators.required]),
    startTime: new FormControl<Date | null>(new Date(), [Validators.required]),
    endTime: new FormControl<Date | null>(null),
    productIds: new FormControl<number[]>([], { nonNullable: true }),
    controllerAmount: new FormControl<number>(2),
  });

  readonly initialAmounts = signal<ProductAmount[]>([]);
  readonly amounts = signal<ProductAmount[]>([]);
  readonly payMethodAmounts = signal<PayMethodAmount[]>([]);

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  isNotPaid(): boolean {
    return this.payMethodAmounts().length === 0;
  }

  hasUnpaidRemainder(totalSum: number): boolean {
    return this.totalPaid() < totalSum;
  }

  // ── PayMethod multi-select ────────────────────────────────────────────────
  isPayMethodSelected(key: string): boolean {
    return this.payMethodAmounts().some((p) => p.key === key);
  }

  togglePayMethod(key: string): void {
    const exists = this.isPayMethodSelected(key);
    if (exists) {
      this.payMethodAmounts.update((prev) => prev.filter((p) => p.key !== key));
    } else {
      this.payMethodAmounts.update((prev) => [...prev, { key, amount: 0 }]);
    }
  }

  setPayAmount(key: string, amount: number): void {
    this.payMethodAmounts.update((prev) => prev.map((p) => (p.key === key ? { ...p, amount } : p)));
  }

  getPayAmount(key: string): number {
    return this.payMethodAmounts().find((p) => p.key === key)?.amount ?? 0;
  }

  totalPaid(): number {
    return this.payMethodAmounts().reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  selectedPayMethodsList(): string[] {
    return this.payMethodAmounts().map((p) => p.key);
  }

  // ── Controller amount ─────────────────────────────────────────────────────
  selectControllerAmount(amount: number): void {
    this.form.patchValue({ controllerAmount: amount });
  }

  // ── Station ───────────────────────────────────────────────────────────────
  selectedStationName(stations: Station[]): string {
    const id = this.form.controls.stationId.value;
    return stations.find((s) => s.id === id)?.name ?? 'Select Station';
  }

  selectStation(station: Station): void {
    this.form.patchValue({ stationId: station.id });
  }

  // ── Products ──────────────────────────────────────────────────────────────
  isProductSelected(productId: number): boolean {
    return this.form.controls.productIds.value.includes(productId);
  }

  toggleProduct(product: Product): void {
    const ids = this.form.controls.productIds.value;
    const exists = ids.includes(product.id);
    this.form.patchValue({
      productIds: exists ? ids.filter((id) => id !== product.id) : [...ids, product.id],
    });
    this.amounts.update((prev) =>
      exists ? prev.filter((a) => a.id !== product.id) : [...prev, { id: product.id, amount: 1 }],
    );
  }

  removeProduct(productId: number): void {
    const ids = this.form.controls.productIds.value.filter((id) => id !== productId);
    this.form.patchValue({ productIds: ids });
    this.amounts.update((prev) => prev.filter((a) => a.id !== productId));
  }

  selectedProductsList(allProducts: Product[]): Product[] {
    const ids = this.form.controls.productIds.value;
    return ids
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }

  getAmount(productId: number): number {
    return this.amounts().find((a) => a.id === productId)?.amount ?? 1;
  }

  getTotalPrice(product: Product): number {
    return product.price * this.getAmount(product.id);
  }

  addAmount(productId: number): void {
    this.amounts.update((current) => {
      const idx = current.findIndex((a) => a.id === productId);
      if (idx === -1) return [...current, { id: productId, amount: 2 }];
      return current.map((a, i) => (i === idx ? { ...a, amount: a.amount + 1 } : a));
    });
  }

  removeAmount(productId: number): void {
    const item = this.amounts().find((a) => a.id === productId);
    if (item?.amount === 1) {
      this.removeProduct(productId);
    } else {
      this.amounts.update((current) =>
        current.map((a) => (a.id === productId ? { ...a, amount: a.amount - 1 } : a)),
      );
    }
  }

  // ── Computed sum ──────────────────────────────────────────────────────────
  buildTotalSum(allProducts: Product[], hourlyRate: number, controllerRate: number): number {
    const vals = this.formValues();
    let sum = 0;

    const start = vals.startTime;
    const now = new Date();
    const end = vals.endTime ?? (start && start <= now ? now : null);

    let diffMinutes = 0;

    if (start && end) {
      let diffMs = end.getTime() - start.getTime();
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
      diffMinutes = Math.ceil(diffMs / (1000 * 60));
      sum += Math.round((diffMinutes / 60) * hourlyRate);
    }

    const extraControllers = (vals.controllerAmount ?? 2) - 2;
    if (extraControllers > 0) {
      const blocks = Math.max(1, Math.floor(diffMinutes / 30));
      sum += blocks * (controllerRate * 0.5) * extraControllers;
    }

    for (const item of this.amounts()) {
      const product = allProducts.find((p) => p.id === item.id);
      if (product) sum += item.amount * product.price;
    }

    return sum;
  }
  // ── Payload helpers ───────────────────────────────────────────────────────
  buildProductsPayload(allProducts: Product[]) {
    const ids = this.form.controls.productIds.value;
    return ids.map((id) => {
      const product = allProducts.find((p) => p.id === id)!;
      return {
        product_id: id,
        quantity: this.getAmount(id),
        price_at_purchase: product.price,
        name: product.name,
      };
    });
  }

  patchFromSession(session: ServiceSession, productIds: number[], amounts: ProductAmount[]): void {
    this.initialAmounts.set(amounts);
    this.amounts.set(amounts);

    const restored: PayMethodAmount[] = [];
    if (session.cash_paid > 0) restored.push({ key: 'Cash', amount: session.cash_paid });
    if (session.card_paid > 0) restored.push({ key: 'Card', amount: session.card_paid });
    if (session.fitpass_paid > 0) restored.push({ key: 'Fitpass', amount: session.fitpass_paid });
    this.payMethodAmounts.set(restored);

    this.form.patchValue({
      stationId: session.station_id,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : null,
      productIds,
      controllerAmount: session.controller_amount ?? 2,
    });
  }

  reset(): void {
    this.form.reset({ startTime: new Date(), endTime: null, productIds: [] });
    this.amounts.set([]);
    this.payMethodAmounts.set([]);
  }
}
