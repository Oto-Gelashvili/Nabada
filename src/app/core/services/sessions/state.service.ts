import { computed, inject, Injectable, signal } from '@angular/core';
import { ServiceSession, Station } from '../../../models/sessions';
import { Product } from '../../../models/products.model';
import { StationsService } from '../station.service';
import { ProductsService } from '../products.service';
import { NotificationService } from '../Notification';

/**
 * SessionStateService centralizes all shared state for the sessions feature.
 * Components read from signals here instead of managing their own copies.
 */
@Injectable({ providedIn: 'root' })
export class SessionStateService {
  private readonly stationsService = inject(StationsService);
  private readonly productsService = inject(ProductsService);
  private readonly notify = inject(NotificationService);

  // ── Public state ──────────────────────────────────────────────────────────
  readonly selectedDate = signal<Date>(new Date());
  readonly loading = signal(false);
  readonly resetting = signal(false);

  readonly stations = signal<Station[]>([]);
  readonly sessions = signal<ServiceSession[]>([]);
  readonly products = signal<Product[]>([]);

  // ── Load ──────────────────────────────────────────────────────────────────

  async loadAll(action: 'initLoad' | 'reset'): Promise<void> {
    action === 'initLoad' ? this.loading.set(true) : this.resetting.set(true);

    try {
      const [stationsData, sessionsData, productsData] = await Promise.all([
        this.stationsService.getStations(this.selectedDate()),
        this.stationsService.getSessions(this.selectedDate()),
        this.productsService.getProducts(),
      ]);

      this.stations.set(stationsData);
      this.sessions.set(sessionsData);
      this.products.set(productsData);
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      action === 'initLoad' ? this.loading.set(false) : this.resetting.set(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  readonly totalDaySum = computed(() => {
    const start = new Date(this.selectedDate());
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.selectedDate());
    end.setHours(23, 59, 59, 999);

    return this.sessions()
      .filter((s) => {
        const t = new Date(s.start_time);
        return t >= start && t <= end;
      })
      .reduce((sum, s) => sum + Number(s.total_cost || 0), 0);
  });
}
