import { Component } from '@angular/core';
import { LineGraphComponent } from './components/line-graph';
import { GraphPoint } from './models/analytics.models';

@Component({
  selector: 'app-analytics',
  imports: [LineGraphComponent],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics {
  readonly dataPoints: GraphPoint[] = [
    { date: 'Mon', total: 40 },
    { date: 'Tue', total: 80 },
    { date: 'Wed', total: 30 },
    { date: 'Thu', total: 95 },
    { date: 'Fri', total: 60 },
    { date: 'Sat', total: 110 },
    { date: 'Sun', total: 75 },
  ];
}
