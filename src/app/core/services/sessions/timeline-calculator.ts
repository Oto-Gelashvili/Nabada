/**
 * Pure, stateless utility for converting session times into pixel positions
 * on the day-view timeline.
 */
export class TimelineCalculator {
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

  getStateClass(session: { start_time: string; end_time: string | null }): string {
    const now = Date.now();
    const start = new Date(session.start_time).getTime();
    const end = session.end_time ? new Date(session.end_time).getTime() : null;

    if (end !== null && end < now) return 'finished';
    if (end === null) return 'activeOpen';
    if (start > now) return 'booked';
    return 'active';
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
