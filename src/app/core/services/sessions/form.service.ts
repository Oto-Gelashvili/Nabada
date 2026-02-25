import { computed, Injectable, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Product, ProductAmount } from '../../../models/products.model';
import { ServiceSession, Station } from '../../../models/sessions';

/**
 * SessionFormService owns the reactive form, product amounts, and all
 * derived computations for the create/edit session modal.
 */
@Injectable()
export class SessionFormService {
  readonly form = new FormGroup({
    stationId: new FormControl<number | null>(null, [Validators.required]),
    startTime: new FormControl<Date | null>(new Date(), [Validators.required]),
    endTime: new FormControl<Date | null>(null),
    productIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  readonly amounts = signal<ProductAmount[]>([]);

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

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

  buildTotalSum(allProducts: Product[], hourlyRate: number): number {
    const vals = this.formValues();
    let sum = 0;

    if (vals.startTime && vals.endTime) {
      let diffMs = vals.endTime.getTime() - vals.startTime.getTime();
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      sum += (diffMinutes / 60) * hourlyRate;
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

  /** Patch all fields from an existing session + its items. */
  patchFromSession(session: ServiceSession, productIds: number[], amounts: ProductAmount[]): void {
    this.amounts.set(amounts);
    this.form.patchValue({
      stationId: session.station_id,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : null,
      productIds,
    });
  }

  reset(): void {
    this.form.reset({ startTime: new Date(), endTime: null, productIds: [] });
    this.amounts.set([]);
  }
}
