import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import {
  GraphPoint,
  PRODUCT_SORT_OPTIONS,
  ProductSortOption,
  SessionItems,
  STATION_SORT_OPTIONS,
  StationAnalytics,
  StationSortOption,
} from './models/analytics.models';
import { LineGraphComponent } from './components/lineGraph/line-graph';
import { AnalyticsService } from '../../core/services/analytics.service';
import { NotificationService } from '../../core/services/Notification';
import { SorterComponent } from './components/sorter/sorter';
import { FormatCurrencyPipe } from '../../shared/pipes/currency-format.pipe';

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
  readonly productsData = signal<SessionItems[]>([]);

  readonly stationSortOptions = [...STATION_SORT_OPTIONS];
  readonly productSortOptions = [...PRODUCT_SORT_OPTIONS];

  async ngOnInit() {
    await this.load();
  }

  async onDateChange() {
    await this.load();
  }

  async load() {
    try {
      this.loading.set(true);
      const [points, stations, products] = await Promise.all([
        this.analyticsService.getDailyIncome(this.startDate(), this.endDate()),
        this.analyticsService.getStationsAnalytics(this.startDate(), this.endDate()),
        this.analyticsService.getProductsData(this.startDate(), this.endDate()),
      ]);
      this.dataPoints.set(points);
      this.stationsData.set(stations);
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
    const sort = option as StationSortOption;
    this.stationsData.set(this.sortStations(this.stationsData(), sort));
  }

  onProductSortChange(option: string) {
    const sort = option as ProductSortOption;
    this.productsData.set(this.sortProducts(this.productsData(), sort));
  }

  private sortStations(data: StationAnalytics[], sort: StationSortOption): StationAnalytics[] {
    return [...data].sort((a, b) => {
      switch (sort) {
        case 'Decreasing total':
          return b.total_cost - a.total_cost;
        case 'Increasing total':
          return a.total_cost - b.total_cost;
        case 'Decreasing gaming':
          return b.gaming_cost - a.gaming_cost;
        case 'Increasing gaming':
          return a.gaming_cost - b.gaming_cost;
        case 'Decreasing products':
          return b.products_cost - a.products_cost;
        case 'Increasing products':
          return a.products_cost - b.products_cost;
      }
    });
  }

  private sortProducts(data: SessionItems[], sort: ProductSortOption): SessionItems[] {
    return [...data].sort((a, b) => {
      switch (sort) {
        case 'Decreasing total':
          return b.total_revenue - a.total_revenue;
        case 'Increasing total':
          return a.total_revenue - b.total_revenue;
        case 'Decreasing quantity':
          return b.quantity - a.quantity;
        case 'Increasing quantity':
          return a.quantity - b.quantity;
      }
    });
  }
}
