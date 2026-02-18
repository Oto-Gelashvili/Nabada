import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ServiceSession, Station } from '../../../../models/sessions';
import { Product, ProductAmount } from '../../../../models/products.model';
import { CurrencyPipe } from '@angular/common';
import { StationsService } from '../../../../core/services/station.service';
import { NotificationService } from '../../../../core/services/Notification';
import { Spinner } from '../../../../shared/components/spinner/spinner';
@Component({
  selector: 'app-create-session',
  imports: [
    ReactiveFormsModule,
    CheckboxModule,
    DatePickerModule,
    FormsModule,
    CurrencyPipe,
    Spinner,
  ],
  templateUrl: './create-sessions.html',
  styleUrls: ['./create-sessions.css'],
})
export class CreateSessionComponent implements OnInit {
  stations = input<Station[]>([]);
  products = input<Product[]>([]);
  existingSessions = input<ServiceSession[]>([]);
  selectedDate = input.required<Date>();

  private stationService = inject(StationsService);
  private notify = inject(NotificationService);

  amounts = signal<ProductAmount[]>([]);
  isCustomSelectOpen = signal(false);
  isCustomMultiSelectOpen = signal(false);
  close = output<void>();
  isSubmitting = signal(false);
  sessionCreated = output<void>();

  readonly createSessionForm = new FormGroup({
    stationId: new FormControl<number | null>(null, [Validators.required]),
    startTime: new FormControl<Date | null>(new Date(), [Validators.required]),
    endTime: new FormControl<Date | null>(null),
    productIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  ngOnInit() {
    const allStations = this.stations();

    if (allStations && allStations.length > 0) {
      this.createSessionForm.patchValue({
        stationId: allStations[0].id,
      });
    }
  }

  selectedStationName(): string {
    const selectedId = this.createSessionForm.controls.stationId.value;
    const matchingStation = this.stations().find((s) => s.id === selectedId);
    return matchingStation ? matchingStation.name : 'Select Station';
  }
  toggleCustomSelect() {
    this.isCustomSelectOpen.update((v) => !v);
    this.isCustomMultiSelectOpen.set(false);
  }
  toggleCustomMultiSelect() {
    this.isCustomMultiSelectOpen.update((v) => !v);
    this.isCustomSelectOpen.set(false);
  }

  selectStation(station: Station) {
    this.createSessionForm.patchValue({ stationId: station.id });
    this.isCustomSelectOpen.set(false);
  }

  isProductSelected(productId: number): boolean {
    const currentIds = this.createSessionForm.controls.productIds.value;
    return currentIds.includes(productId);
  }
  toggleProduct(product: Product) {
    const currentIds = this.createSessionForm.controls.productIds.value;
    const index = currentIds.indexOf(product.id);
    let newIds: number[];
    if (index > -1) {
      newIds = currentIds.filter((id) => id !== product.id);
      this.amounts.update((prev) => prev.filter((a) => a.id !== product.id));
    } else {
      newIds = [...currentIds, product.id];
      this.amounts.update((prev) => [...prev, { id: product.id, amount: 1 }]);
    }

    this.createSessionForm.patchValue({ productIds: newIds });
  }

  selectedProductsList(): Product[] {
    const selectedIds = this.createSessionForm.controls.productIds.value;
    const allProducts = this.products();

    return selectedIds
      .map((id) => allProducts.find((product) => product.id === id))
      .filter((product) => product !== undefined) as Product[];
  }
  removeProduct(productId: number) {
    const currentIds = this.createSessionForm.controls.productIds.value;
    const newIds = currentIds.filter((id) => id !== productId);
    this.createSessionForm.patchValue({ productIds: newIds });
  }
  getAmount(productId: number): number {
    const item = this.amounts().find((a) => a.id === productId);
    return item ? item.amount : 1;
  }
  getTotalPrice(product: Product): number {
    const amount = this.getAmount(product.id);
    return product.price * amount;
  }

  addAmount(productId: number) {
    this.amounts.update((current) => {
      const index = current.findIndex((item) => item.id === productId);

      if (index === -1) {
        return [...current, { id: productId, amount: 2 }];
      }

      const updated = [...current];
      updated[index] = { ...updated[index], amount: updated[index].amount + 1 };
      return updated;
    });
  }
  removeAmount(productId: number) {
    this.amounts.update((current) => {
      const index = current.findIndex((item) => item.id === productId);
      if (current[index].amount === 1) {
        this.removeProduct(productId);
        return current;
      }

      const updated = [...current];
      updated[index] = { ...updated[index], amount: current[index].amount - 1 };
      return updated;
    });
  }

  private mergeDateAndTime(datePart: Date, timePart: Date): Date {
    const result = new Date(datePart);
    result.setHours(timePart.getHours());
    result.setMinutes(timePart.getMinutes());
    result.setSeconds(0);
    result.setMilliseconds(0);
    return result;
  }

  private hasOverlap(stationId: number, start: Date, end: Date | null): boolean {
    const stationSessions = this.existingSessions().filter((s) => s.station_id === stationId);

    return stationSessions.some((existing) => {
      const existStart = new Date(existing.start_time).getTime();
      const existEnd = existing.end_time ? new Date(existing.end_time).getTime() : Date.now();

      const newStart = start.getTime();
      const newEnd = end ? end.getTime() : Date.now() + 1000 * 60 * 60;

      return newStart < existEnd && newEnd > existStart;
    });
  }

  private prepareProductsPayload() {
    const selectedIds = this.createSessionForm.controls.productIds.value;
    if (selectedIds.length === 0) return [];

    const allProducts = this.products();
    return selectedIds.map((id) => {
      const product = allProducts.find((p) => p.id === id)!;
      const quantity = this.getAmount(id);
      return {
        product_id: id,
        quantity: quantity,
        price_at_purchase: product.price,
        name: product.name,
      };
    });
  }

  async onSubmit() {
    if (this.createSessionForm.invalid) {
      this.notify.showError($localize`:@@common.fillInError:Please fill in all required fields`);
      return;
    }

    const val = this.createSessionForm.value;
    const baseDate = new Date(this.selectedDate());

    const startDateTime = this.mergeDateAndTime(baseDate, val.startTime!);

    let endDateTime: Date | null = null;
    if (val.endTime) {
      endDateTime = this.mergeDateAndTime(baseDate, val.endTime);

      if (endDateTime <= startDateTime) {
        if (endDateTime.getHours() < startDateTime.getHours()) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        } else {
          this.notify.showError($localize`:@@common.timeError:End time must be after start time`);
          return;
        }
      }
    }

    if (this.hasOverlap(val.stationId!, startDateTime, endDateTime)) {
      this.notify.showError($localize`:@@common.overlapError:Times are overlapping`);
      return;
    }

    const productPayload = this.prepareProductsPayload();

    this.isSubmitting.set(true);
    try {
      const result = await this.stationService.createSession({
        station_id: val.stationId!,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime ? endDateTime.toISOString() : null,
        products: productPayload,
      });

      if (result.closed_session_id) {
        this.notify.showSuccess(
          $localize`:@@createSession.autoCancel:Previous session auto-closed. New session created`,
        );
      } else {
        this.notify.showSuccess($localize`:@@createSession.created:Session created`);
      }

      this.sessionCreated.emit();
      this.close.emit();
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
  onCancel() {
    this.close.emit();
  }
}
