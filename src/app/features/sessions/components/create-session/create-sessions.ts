import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { CurrencyPipe } from '@angular/common';
import { CreateSessionDTO, ServiceSession, Station } from '../../../../models/sessions';
import { Product } from '../../../../models/products.model';
import { StationsService } from '../../../../core/services/station.service';
import { NotificationService } from '../../../../core/services/Notification';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import { SessionFormService } from '../../../../core/services/sessions/form.service';
import { SessionOverlapValidator } from '../../../../core/services/sessions/overlap-validator';
import { PAY_METHOD_OPTIONS } from '../../../../models/sessions';

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
  // Provide per-instance so each modal gets its own form state
  providers: [SessionFormService],
})
export class CreateSessionComponent implements OnInit {
  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  stations = input<Station[]>([]);
  products = input<Product[]>([]);
  hourlyRate = input<number>(8.0);
  editableSessionID = input<number | null>(null);
  existingSessions = input<ServiceSession[]>([]);
  selectedDate = input.required<Date>();

  close = output<void>();
  sessionChanged = output<void>();
  readonly payMethodOptions = PAY_METHOD_OPTIONS;

  // ── DI ────────────────────────────────────────────────────────────────────
  protected readonly formService = inject(SessionFormService);
  private readonly stationService = inject(StationsService);
  private readonly notify = inject(NotificationService);
  private readonly overlapValidator = new SessionOverlapValidator();

  // ── UI state ──────────────────────────────────────────────────────────────
  protected readonly isSubmitting = signal(false);
  protected readonly isPayMethodOpen = signal(false);
  protected readonly isCustomSelectOpen = signal(false);
  protected readonly isCustomMultiSelectOpen = signal(false);

  // ── Template aliases (keeps template clean) ───────────────────────────────
  protected get createSessionForm() {
    return this.formService.form;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (this.editableSessionID()) {
      this.loadSessionForEdit();
    } else {
      const firstStation = this.stations()[0];
      if (firstStation) this.formService.form.patchValue({ stationId: firstStation.id });
    }
  }

  // ── PayMethod dropdown ──────────────────────────────────────────────────────

  protected togglePaySelect(): void {
    this.isPayMethodOpen.update((v) => !v);
    this.isCustomSelectOpen.set(false);
    this.isCustomMultiSelectOpen.set(false);
  }

  protected selectPayMethod(payMethod: string): void {
    this.formService.selectPayMethod(payMethod);
    this.isPayMethodOpen.set(false);
  }
  protected selectedPayMethodName(): string {
    const key = this.createSessionForm.value.payMethod;
    return PAY_METHOD_OPTIONS.find((o) => o.key === key)?.label ?? PAY_METHOD_OPTIONS[0].label;
  }

  // ── Station dropdown ──────────────────────────────────────────────────────

  protected selectedStationName(): string {
    return this.formService.selectedStationName(this.stations());
  }

  protected toggleCustomSelect(): void {
    this.isCustomSelectOpen.update((v) => !v);
    this.isCustomMultiSelectOpen.set(false);
    this.isPayMethodOpen.set(false);
  }

  protected selectStation(station: Station): void {
    this.formService.selectStation(station);
    this.isCustomSelectOpen.set(false);
  }

  // ── Product multi-select ──────────────────────────────────────────────────

  protected readonly productsInStock = computed(() =>
    this.products().filter((p) => p.quantity > 0),
  );
  protected toggleCustomMultiSelect(): void {
    this.isCustomMultiSelectOpen.update((v) => !v);
    this.isCustomSelectOpen.set(false);
    this.isPayMethodOpen.set(false);
  }

  protected isProductSelected(id: number) {
    return this.formService.isProductSelected(id);
  }
  protected toggleProduct(p: Product) {
    return this.formService.toggleProduct(p);
  }
  protected selectedProductsList() {
    return this.formService.selectedProductsList(this.products());
  }
  protected getAmount(id: number) {
    return this.formService.getAmount(id);
  }
  protected getTotalPrice(p: Product) {
    return this.formService.getTotalPrice(p);
  }

  protected addAmount(productId: number): void {
    const product = this.products().find((p) => p.id === productId);
    if (!product) return;

    const currentAmount = this.formService.getAmount(productId);
    const initialAmount =
      this.formService.initialAmounts().find((a) => a.id === productId)?.amount ?? 0;
    const maxAllowed = initialAmount + product.quantity;
    if (currentAmount >= maxAllowed) {
      this.notify.showError($localize`:@@error.stockLimit:Not enough stock`);
      return;
    }

    this.formService.addAmount(productId);
  }

  protected getMaxAllowed(productId: number, stockQuantity: number): number {
    const initialAmount =
      this.formService.initialAmounts().find((a) => a.id === productId)?.amount ?? 0;
    return initialAmount + stockQuantity;
  }
  protected removeAmount(id: number) {
    return this.formService.removeAmount(id);
  }

  // ── Computed sum ──────────────────────────────────────────────────────────

  protected readonly totalSum = computed(() => {
    const sessionId = this.editableSessionID();
    const session = sessionId ? this.existingSessions().find((s) => s.id === sessionId) : null;
    const hourlyRate = session?.hourly_rate ?? this.hourlyRate();
    return this.formService.buildTotalSum(this.products(), hourlyRate);
  });

  // ── canEndSession ─────────────────────────────────────────────────────────

  protected readonly canEndSession = computed(() => {
    const sessionId = this.editableSessionID();
    if (!sessionId) return false;

    const session = this.existingSessions().find((s) => s.id === sessionId);
    if (!session) return false;

    const now = Date.now();
    const start = new Date(session.start_time).getTime();
    if (start > now) return false;

    return !session.end_time || new Date(session.end_time).getTime() > now;
  });

  // ── Submit ────────────────────────────────────────────────────────────────

  async onSubmit(): Promise<void> {
    if (this.createSessionForm.invalid) {
      this.notify.showError($localize`:@@error.fillInError:Please fill in all required fields`);
      return;
    }

    const { stationId, startTime, endTime, payMethod } = this.createSessionForm.value;
    const base = new Date(this.selectedDate());

    const start = this.mergeDateAndTime(base, startTime!);
    let end: Date | null = null;

    if (endTime) {
      end = this.mergeDateAndTime(base, endTime);
      if (end <= start) {
        // Handles overnight sessions (e.g. 23:00 – 01:00)
        if (end.getHours() < start.getHours()) {
          end.setDate(end.getDate() + 1);
        } else {
          this.notify.showError($localize`:@@error.timeError:End time must be after start time`);
          return;
        }
      }
    }

    if (
      this.overlapValidator.hasOverlap(
        this.existingSessions(),
        stationId!,
        start,
        end,
        this.editableSessionID(),
      )
    ) {
      this.notify.showError($localize`:@@error.overlapError:Times are overlapping`);
      return;
    }

    const products = this.formService.buildProductsPayload(this.products());
    const payload: CreateSessionDTO = {
      station_id: stationId!,
      start_time: start.toISOString(),
      end_time: end?.toISOString() ?? null,
      products,
      hourly_rate: this.hourlyRate(),
      pay_method: payMethod ?? 'Cash',
    };

    this.isSubmitting.set(true);
    try {
      if (this.editableSessionID()) {
        await this.stationService.updateSession(this.editableSessionID()!, payload);
        this.notify.showSuccess($localize`:@@sessions.updated:Session updated`);
      } else {
        const result = await this.stationService.createSession(payload);
        const msg = result.closed_session_id
          ? $localize`:@@sessions.autoCancel:Previous session auto-closed. New session created`
          : $localize`:@@sessions.created:Session created`;
        this.notify.showSuccess(msg);
      }
      this.sessionChanged.emit();
      this.close.emit();
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ── End / Delete ──────────────────────────────────────────────────────────

  async endSession(): Promise<void> {
    const confirmed = await this.notify.confirm(
      $localize`:@@confirm.endSession:This will end the session`,
    );
    if (!confirmed) return;
    this.createSessionForm.patchValue({ endTime: new Date() });
    await this.onSubmit();
  }

  async deleteSession(): Promise<void> {
    const sessionId = this.editableSessionID();
    if (!sessionId) return;
    const confirmed = await this.notify.confirm(
      $localize`:@@confirm.deleteSession:This will delete session`,
    );
    if (!confirmed) return;

    this.isSubmitting.set(true);
    try {
      await this.stationService.deleteSession(sessionId);
      this.notify.showSuccess($localize`:@@common.deleted:Deleted`);
      this.sessionChanged.emit();
      this.close.emit();
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected onCancel(): void {
    this.close.emit();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async loadSessionForEdit(): Promise<void> {
    const session = this.existingSessions().find((s) => s.id === this.editableSessionID());
    if (!session) return;

    try {
      const items = await this.stationService.getSessionItems(session.id);
      const productIds = items.map((i) => i.product_id);
      const amounts = items.map((i) => ({ id: i.product_id, amount: i.quantity }));
      this.formService.patchFromSession(session, productIds, amounts);
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
      this.close.emit();
    }
  }

  private mergeDateAndTime(date: Date, time: Date): Date {
    const result = new Date(date);
    result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return result;
  }
}
