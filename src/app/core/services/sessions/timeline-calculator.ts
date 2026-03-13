import { PAY_METHOD_OPTIONS } from '../../../models/sessions';

/**
 * Pure, stateless utility for converting session times into pixel positions
 * on the day-view timeline.
 */
export class TimelineCalculator {
  private readonly colorMap: Record<string, string> = {
    Cash: 'var(--success)',
    Card: 'var(--primary-color)',
    Fitpass: 'var(--fitpass-color)',
    NotPaid: 'var(--error)',
  };
  constructor(private readonly pixelsPerHour: number = 100) {}

  calculateLeft(startTimeStr: string, selectedDate: Date): number {
    const sessionStart = new Date(startTimeStr).getTime();
    const viewStart = this.startOfDay(selectedDate);

    if (sessionStart < viewStart) return 0;

    const date = new Date(startTimeStr);
    return date.getHours() * this.pixelsPerHour + date.getMinutes() * (this.pixelsPerHour / 60);
  }

  calculateWidth(
    startStr: string,
    endStr: string | null,
    selectedDate: Date,
    nowMs: number,
  ): number {
    const sessionStart = new Date(startStr).getTime();
    const sessionEnd = endStr ? new Date(endStr).getTime() : nowMs;

    const viewStart = this.startOfDay(selectedDate);
    const viewEnd = this.endOfDay(selectedDate);

    const effectiveStart = Math.max(sessionStart, viewStart);
    const effectiveEnd = Math.min(sessionEnd, viewEnd);
    const durationHours = (effectiveEnd - effectiveStart) / (1000 * 60 * 60);

    return Math.max(0, durationHours * this.pixelsPerHour);
  }

  getOverlapClass(
    session: { start_time: string; end_time: string | null },
    selectedDate: Date,
    nowMs: number,
  ): string {
    const start = new Date(session.start_time).getTime();
    const end = session.end_time ? new Date(session.end_time).getTime() : nowMs;
    const classes: string[] = [];

    if (start < this.startOfDay(selectedDate)) classes.push('overflow-left');
    if (end > this.endOfDay(selectedDate)) classes.push('overflow-right');

    return classes.join(' ');
  }

  getStateClass(session: {
    start_time: string;
    end_time: string | null;
    pay_method: string;
  }): string {
    if (!session.end_time) {
      return 'NotPaid';
    }

    if (session.pay_method.includes('NotPaid')) {
      return 'NotPaid';
    }

    const methods = session.pay_method
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (methods.length <= 1) {
      return methods[0] ?? 'NotPaid';
    }

    return '';
  }

  getStateStyle(session: {
    start_time: string;
    end_time: string | null;
    pay_method: string;
  }): Record<string, string> {
    if (!session.end_time) {
      return {};
    }

    if (session.pay_method.includes('NotPaid')) {
      return {};
    }

    const methods = session.pay_method
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (methods.length <= 1) {
      return {};
    }

    const colors = methods.map((m) => this.colorMap[m] ?? 'var(--success)');
    const step = 100 / colors.length;
    const stops = colors
      .map((color, i) => `${color} ${i * step}%, ${color} ${(i + 1) * step}%`)
      .join(', ');

    return { background: `linear-gradient(135deg, ${stops})` };
  }
  // ── Private helpers ───────────────────────────────────────────────────────

  private startOfDay(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  private endOfDay(date: Date): number {
    const d = new Date(date);
    d.setHours(24, 0, 0, 0);
    return d.getTime();
  }
}
