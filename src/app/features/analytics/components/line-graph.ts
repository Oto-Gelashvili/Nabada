import { Component, input, signal } from '@angular/core';
import { GraphPoint } from '../models/analytics.models';

interface PlottedPoint {
  x: number;
  y: number;
  date: string;
  total: number;
}

interface TooltipState {
  x: number;
  y: number;
  index: number;
}

@Component({
  selector: 'app-line-graph',
  imports: [],
  templateUrl: './line-graph.html',
  styleUrl: './line-graph.css',
})
export class LineGraphComponent {
  data = input<GraphPoint[]>([]);

  readonly svgWidth = 1000;
  readonly svgHeight = 300;
  readonly paddingTop = 20;
  readonly paddingBottom = 40;
  readonly paddingLeft = 40;
  readonly paddingRight = 20;

  get plotWidth() {
    return this.svgWidth - this.paddingLeft - this.paddingRight;
  }
  get plotHeight() {
    return this.svgHeight - this.paddingTop - this.paddingBottom;
  }

  readonly tooltip = signal<TooltipState | null>(null);

  get maxIncome(): number {
    return Math.max(...this.data().map((d) => d.total), 1);
  }

  get plottedPoints(): PlottedPoint[] {
    const points = this.data();
    const count = points.length;
    if (count === 0) return [];

    return points.map((point, index) => ({
      x: this.paddingLeft + (index / (count - 1)) * this.plotWidth,
      y: this.paddingTop + (1 - point.total / this.maxIncome) * this.plotHeight,
      date: point.date,
      total: point.total,
    }));
  }

  get yAxisLabels() {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => ({
      value: (this.maxIncome / steps) * i,
      y: this.paddingTop + (this.plotHeight - (this.plotHeight / steps) * i),
    }));
  }

  get linePath(): string {
    const pts = this.plottedPoints;
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const midX = pts[i].x + (pts[i + 1].x - pts[i].x) / 2;
      d += ` C ${midX} ${pts[i].y}, ${midX} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  }

  get fillPath(): string {
    const pts = this.plottedPoints;
    if (pts.length === 0) return '';
    const bottom = this.paddingTop + this.plotHeight;
    return `${this.linePath} L ${pts[pts.length - 1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
  }

  onMouseMove(event: MouseEvent, svgEl: HTMLElement): void {
    const rect = svgEl.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (this.svgWidth / rect.width);
    const pts = this.plottedPoints;
    if (pts.length === 0) return;

    let closestIndex = 0;
    let closestDist = Infinity;
    pts.forEach((pt, i) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });

    const closest = pts[closestIndex];
    this.tooltip.set({ x: closest.x, y: closest.y, index: closestIndex });
  }

  onMouseLeave(): void {
    this.tooltip.set(null);
  }
  formatYLabel(value: number): string {
    if (value >= 1000) {
      const k = value / 1000;
      return '₾' + (k % 1 === 0 ? k : k.toFixed(1)) + 'k';
    }
    return '₾' + Math.round(value);
  }
}
