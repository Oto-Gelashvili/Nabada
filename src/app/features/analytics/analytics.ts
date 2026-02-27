import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { GraphPoint } from './models/analytics.models';
import { LineGraphComponent } from './components/line-graph';
import { AnalyticsService } from '../../core/services/analytics.service';
import { NotificationService } from '../../core/services/Notification';

@Component({
  selector: 'app-analytics',
  imports: [LineGraphComponent, DatePickerModule, FormsModule],
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

  async ngOnInit() {
    await this.load();
  }

  async onDateChange() {
    await this.load();
  }

  async load() {
    try {
      this.loading.set(true);
      const points = await this.analyticsService.getDailyIncome(this.startDate(), this.endDate());
      this.dataPoints.set(points);
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
}
