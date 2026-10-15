import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import {
  GraphPoint,
  PayMethodAnalytics,
  PRODUCT_SORT_OPTIONS,
  SessionItems,
  STATION_SORT_OPTIONS,
  StationAnalytics,
} from './models/analytics.models';
import { LineGraphComponent } from './components/lineGraph/line-graph';
import { AnalyticsService } from '../../core/services/analytics.service';
import { NotificationService } from '../../core/services/Notification';
import { SorterComponent } from './components/sorter/sorter';
import { FormatCurrencyPipe } from '../../shared/pipes/currency-format.pipe';
import { PAY_METHOD_OPTIONS } from '../../models/sessions';

@Component({
  selector: 'app-analytics',
  imports: [LineGraphComponent, DatePickerModule, FormsModule, SorterComponent, FormatCurrencyPipe],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly notify = inject(NotificationService);

  readonly today = new Date();

  readonly startDate = signal<Date>(this.getDefaultStart());
  readonly endDate = signal<Date>(new Date());

  readonly loading = signal(false);
  readonly dataPoints = signal<GraphPoint[]>([]);
  readonly stationsData = signal<StationAnalytics[]>([]);
  readonly payMethodsData = signal<PayMethodAnalytics[]>([]);
  readonly productsData = signal<SessionItems[]>([]);

  readonly stationSortOptions = [...STATION_SORT_OPTIONS];
  readonly productSortOptions = [...PRODUCT_SORT_OPTIONS];

  readonly productsTotalRevenue = computed(() =>
    this.productsData().reduce((sum, p) => sum + p.total_revenue, 0),
  );
  readonly totalRevenue = computed(() =>
    this.stationsData().reduce((sum, p) => sum + p.total_cost, 0),
  );
  readonly totalPayRevenue = computed(() =>
    this.stationsData().reduce((sum, p) => sum + p.total_cost, 0),
  );

  async ngOnInit() {
    await this.load();
  }

  async onDateChange() {
    await this.load();
  }

  async load() {
    try {
      this.loading.set(true);
      const [points, result, products] = await Promise.all([
        this.analyticsService.getIncomeGraph(this.startDate(), this.endDate()),
        this.analyticsService.getStationsAnalytics(this.startDate(), this.endDate()),
        this.analyticsService.getProductsData(this.startDate(), this.endDate()),
      ]);
      this.dataPoints.set(points);
      this.stationsData.set(result.stations);
      this.payMethodsData.set(result.payMethods);
      this.productsData.set(products);
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
    } finally {
      this.loading.set(false);
    }
  }
  private getDefaultStart(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }

  onStationSortChange(option: string) {
    this.stationsData.set(this.sortByCost(this.stationsData(), option));
  }
  onPayMethodSortChange(option: string) {
    this.payMethodsData.set(this.sortByCost(this.payMethodsData(), option));
  }

  onProductSortChange(option: string) {
    this.productsData.set(this.sortProducts(this.productsData(), option));
  }

  private sortByCost<T extends { total_cost: number; gaming_cost: number; products_cost: number }>(
    data: T[],
    sort: string,
  ): T[] {
    return [...data].sort((a, b) => {
      switch (sort) {
        case 'dec-total':
          return b.total_cost - a.total_cost;
        case 'inc-total':
          return a.total_cost - b.total_cost;
        case 'dec-gaming':
          return b.gaming_cost - a.gaming_cost;
        case 'inc-gaming':
          return a.gaming_cost - b.gaming_cost;
        case 'dec-products':
          return b.products_cost - a.products_cost;
        case 'inc-products':
          return a.products_cost - b.products_cost;
        default:
          return 0;
      }
    });
  }

  private sortProducts(data: SessionItems[], sort: string): SessionItems[] {
    return [...data].sort((a, b) => {
      switch (sort) {
        case 'dec-total':
          return b.total_revenue - a.total_revenue;
        case 'inc-total':
          return a.total_revenue - b.total_revenue;
        case 'dec-quantity':
          return b.quantity - a.quantity;
        case 'inc-quantity':
          return a.quantity - b.quantity;
        default:
          return 0;
      }
    });
  }
  getPayMethodLabel(key: string): string {
    return PAY_METHOD_OPTIONS.find((o) => o.key === key)?.label ?? key;
  }
}
