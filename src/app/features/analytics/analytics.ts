import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { GraphPoint } from './models/analytics.models';
import { LineGraphComponent } from './components/line-graph';

@Component({
  selector: 'app-analytics',
  imports: [LineGraphComponent, DatePickerModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics {
  readonly today = new Date();

  readonly startDate = signal<Date>(this.getDefaultStart());
  readonly endDate = signal<Date>(new Date());

  readonly dataPoints: GraphPoint[] = [
    { date: 'Mon', total: 40 },
    { date: 'Tue', total: 80 },
    { date: 'Wed', total: 30 },
    { date: 'Thu', total: 95 },
    { date: 'Fri', total: 60 },
    { date: 'Sat', total: 110 },
    { date: 'Sun', total: 75 },
  ];

  onDateChange() {
    // later: reload data from Supabase
  }

  private getDefaultStart(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
}
