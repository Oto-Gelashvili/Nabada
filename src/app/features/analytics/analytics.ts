import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { GraphPoint, SortOption, StationAnalytics } from './models/analytics.models';
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
  readonly sortOption = signal<SortOption>('Decreasing total');

  async ngOnInit() {
    await this.load();
  }

  async onDateChange() {
    await this.load();
  }

  async load() {
    try {
      this.loading.set(true);
      const [points, stations] = await Promise.all([
        this.analyticsService.getDailyIncome(this.startDate(), this.endDate()),
        this.analyticsService.getStationsAnalytics(this.startDate(), this.endDate()),
      ]);
      this.dataPoints.set(points);
      this.stationsData.set(stations);
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

  readonly sortedStations = computed(() => {
    const stations = [...this.stationsData()];
    const option = this.sortOption();

    switch (option) {
      case 'Decreasing total':
        return stations.sort((a, b) => b.total_cost - a.total_cost);
      case 'Increasing total':
        return stations.sort((a, b) => a.total_cost - b.total_cost);
      case 'Decreasing gaming':
        return stations.sort((a, b) => b.gaming_cost - a.gaming_cost);
      case 'Increasing gaming':
        return stations.sort((a, b) => a.gaming_cost - b.gaming_cost);
      case 'Decreasing products':
        return stations.sort((a, b) => b.products_cost - a.products_cost);
      case 'Increasing products':
        return stations.sort((a, b) => a.products_cost - b.products_cost);
    }
  });
  onSortChange(option: SortOption) {
    this.sortOption.set(option);
  }
}
