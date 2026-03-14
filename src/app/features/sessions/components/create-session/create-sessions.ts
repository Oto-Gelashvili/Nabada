import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { CurrencyPipe } from '@angular/common';
import {
  CreateSessionDTO,
  ServiceSession,
  Station,
  PAY_METHOD_OPTIONS,
} from '../../../../models/sessions';
import { Product } from '../../../../models/products.model';
import { StationsService } from '../../../../core/services/station.service';
import { NotificationService } from '../../../../core/services/Notification';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import { SessionFormService } from '../../../../core/services/sessions/form.service';
import { SessionOverlapValidator } from '../../../../core/services/sessions/overlap-validator';

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
  providers: [SessionFormService],
})
export class CreateSessionComponent implements OnInit {
  stations = input<Station[]>([]);
  products = input<Product[]>([]);
  hourlyRate = input<number>(8.0);
  fitpassRate = input<number>(5.0);
  controllerRate = input<number>(2.0);
  editableSessionID = input<number | null>(null);
  existingSessions = input<ServiceSession[]>([]);
  selectedDate = input.required<Date>();

  close = output<void>();
  sessionChanged = output<void>();

  readonly payMethodOptions = PAY_METHOD_OPTIONS;

  protected readonly formService = inject(SessionFormService);
  private readonly stationService = inject(StationsService);
  private readonly notify = inject(NotificationService);
  private readonly overlapValidator = new SessionOverlapValidator();

  protected readonly isSubmitting = signal(false);
  protected readonly isPayMethodOpen = signal(false);
  protected readonly isControllerOpen = signal(false);
  protected readonly isCustomSelectOpen = signal(false);
  protected readonly isCustomMultiSelectOpen = signal(false);

  protected get createSessionForm() {
    return this.formService.form;
  }
  constructor() {
    effect(() => {
      const max = this.fitpassMaxCount();
      const current = this.formService.fitpassCount();
      if (current > max) {
        const clamped = Math.max(0, max);
        this.formService.setFitpassCount(clamped);
        this.formService.setPayAmount('Fitpass', clamped * this.fitpassRate());
      }
    });
  }
  ngOnInit(): void {
    if (this.editableSessionID()) {
      this.loadSessionForEdit();
    } else {
      const firstStation = this.stations()[0];
      if (firstStation) this.formService.form.patchValue({ stationId: firstStation.id });
    }
  }

  // ── Controller ────────────────────────────────────────────────────────────
  protected toggleControllerSelect(): void {
    this.isControllerOpen.update((v) => !v);
    this.isCustomSelectOpen.set(false);
    this.isCustomMultiSelectOpen.set(false);
    this.isPayMethodOpen.set(false);
  }
  protected selectControllerAmount(amount: number): void {
    this.formService.selectControllerAmount(amount);
    this.isControllerOpen.set(false);
  }
  protected selectedControllerAmount(): number {
    return this.createSessionForm.value.controllerAmount ?? 2;
  }

  // ── PayMethod multi-select ────────────────────────────────────────────────
  protected togglePaySelect(): void {
    this.isPayMethodOpen.update((v) => !v);
    this.isCustomSelectOpen.set(false);
    this.isCustomMultiSelectOpen.set(false);
    this.isControllerOpen.set(false);
  }
  protected togglePayMethod(key: string): void {
    this.formService.togglePayMethod(key);
  }
  protected isPayMethodSelected(key: string): boolean {
    return this.formService.isPayMethodSelected(key);
  }
  protected selectedPayMethodsLabel(): string {
    const selected = this.formService.selectedPayMethodsList();
    if (selected.length === 0) return $localize`:@@sessions.notPaid:Not paid`;

    const labels = selected
      .map((key) => PAY_METHOD_OPTIONS.find((o) => o.key === key)?.label ?? key)
      .join(', ');

    if (this.formService.hasUnpaidRemainder(this.totalSum())) {
      return `${labels} + ${$localize`:@@sessions.notPaid:Not paid`}`;
    }
    return labels;
  }
  protected getPayAmount(key: string): number {
    return this.formService.getPayAmount(key);
  }
  protected onPayAmountChange(key: string, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.formService.setPayAmount(key, value);
  }
  protected getPayMethodLabel(key: string): string {
    return PAY_METHOD_OPTIONS.find((o) => o.key === key)?.label ?? key;
  }

  // ── Station ───────────────────────────────────────────────────────────────
  protected selectedStationName(): string {
    return this.formService.selectedStationName(this.stations());
  }
  protected toggleCustomSelect(): void {
    this.isCustomSelectOpen.update((v) => !v);
    this.isCustomMultiSelectOpen.set(false);
    this.isPayMethodOpen.set(false);
    this.isControllerOpen.set(false);
  }
  protected selectStation(station: Station): void {
    this.formService.selectStation(station);
    this.isCustomSelectOpen.set(false);
  }

  // ── Products ──────────────────────────────────────────────────────────────
  protected readonly productsInStock = computed(() =>
    this.products().filter((p) => p.quantity > 0),
  );
  protected toggleCustomMultiSelect(): void {
    this.isCustomMultiSelectOpen.update((v) => !v);
    this.isCustomSelectOpen.set(false);
    this.isPayMethodOpen.set(false);
    this.isControllerOpen.set(false);
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

  // ── Fitpass stuff ──────────────────────────────────────────────────────────

  protected readonly fitpassMaxCount = computed(() => {
    const vals = this.formService.formValues();
    const start = vals.startTime;
    const end = vals.endTime;

    if (!start) return 0;
    const base = new Date(this.selectedDate());
    const startDate = this.mergeDateAndTime(base, start);
    const endDate = end ? this.mergeDateAndTime(base, end) : null;
    const effectiveEnd = endDate ?? new Date();

    let diffMs = effectiveEnd.getTime() - startDate.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const extraControllers = (vals.controllerAmount ?? 2) - 2;
    return this.formService.getMaxFitpasses(diffMinutes, extraControllers);
  });
  protected incrementFitpass(): void {
    const current = this.formService.fitpassCount();
    const max = this.fitpassMaxCount();
    if (current >= max) return;
    const newCount = current + 1;
    this.formService.setFitpassCount(newCount);
    this.formService.setPayAmount('Fitpass', newCount * this.fitpassRate());
  }

  protected decrementFitpass(): void {
    const current = this.formService.fitpassCount();
    if (current <= 0) return;
    const newCount = current - 1;
    this.formService.setFitpassCount(newCount);
    this.formService.setPayAmount('Fitpass', newCount * this.fitpassRate());
  }

  // ── Computed sum ──────────────────────────────────────────────────────────
  protected readonly totalSum = computed(() => {
    const sessionId = this.editableSessionID();
    const session = sessionId ? this.existingSessions().find((s) => s.id === sessionId) : null;
    const hourlyRate = session?.hourly_rate ?? this.hourlyRate();
    const fitpassRate = session ? this.fitpassRate() : this.fitpassRate();

    return this.formService.buildTotalSum(
      this.products(),
      hourlyRate,
      fitpassRate,
      this.controllerRate(),
    );
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

    const { stationId, startTime, endTime, controllerAmount } = this.createSessionForm.value;
    const base = new Date(this.selectedDate());
    const start = this.mergeDateAndTime(base, startTime!);
    let end: Date | null = null;

    if (endTime) {
      end = this.mergeDateAndTime(base, endTime);
      if (end <= start) {
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

    if (!this.formService.isNotPaid()) {
      const selected = this.formService.selectedPayMethodsList();
      const hasZeroAmount = selected.some((key) => this.formService.getPayAmount(key) <= 0);
      if (hasZeroAmount && selected.length > 1) {
        this.notify.showError(
          $localize`:@@error.hasInvalidAmount:Payment amounts must be greater than 0`,
        );
        return;
      }

      const paid = this.formService.totalPaid();
      const expected = this.totalSum();
      if (paid > expected) {
        this.notify.showError(
          $localize`:@@error.paymentMismatch:Payment amounts must add up to ₾${expected}:EXPECTED:`,
        );
        return;
      }
    }
    const products = this.formService.buildProductsPayload(this.products());
    const extraControllers = (controllerAmount ?? 2) - 2;
    let controllerCost = 0;
    const fitpassCount = this.formService.fitpassCount();
    const hasFitpass = this.formService.isPayMethodSelected('Fitpass');
    if (extraControllers > 0) {
      if (hasFitpass && fitpassCount > 0 && end) {
        const minutes = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60));
        const sessionHours = minutes / 60;
        const gamingHoursCovered = Math.min(fitpassCount, sessionHours);
        const extraFitpasses = fitpassCount - gamingHoursCovered;
        const controllerHoursCovered = extraFitpasses * 2;
        const totalControllerHours = extraControllers * gamingHoursCovered;
        const remainingControllerHours = Math.max(0, totalControllerHours - controllerHoursCovered);
        const remainingMinutes = Math.max(0, minutes - gamingHoursCovered * 60);

        controllerCost = remainingControllerHours * (this.controllerRate() + 1);
        if (remainingMinutes > 0) {
          const remainingBlocks = Math.max(1, Math.floor(remainingMinutes / 30));
          controllerCost += remainingBlocks * (this.controllerRate() * 0.5) * extraControllers;
        }
      } else {
        const minutes = end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60)) : 0;
        const blocks = Math.max(1, Math.floor(minutes / 30));
        controllerCost = blocks * (this.controllerRate() * 0.5) * extraControllers;
      }
    }

    const hourlyRate = this.hourlyRate();
    const fitpassPaid = fitpassCount * this.fitpassRate();
    if (this.formService.isPayMethodSelected('Fitpass')) {
      this.formService.setPayAmount('Fitpass', fitpassPaid);
    }

    const payload: CreateSessionDTO = {
      station_id: stationId!,
      start_time: start.toISOString(),
      end_time: end?.toISOString() ?? null,
      products,
      hourly_rate: hourlyRate,
      controller_amount: controllerAmount ?? 2,
      controller_cost: controllerCost,
      cash_paid: this.formService.getPayAmount('Cash'),
      card_paid: this.formService.getPayAmount('Card'),
      fitpass_count: fitpassCount,
      fitpass_paid: this.formService.getPayAmount('Fitpass'),
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
