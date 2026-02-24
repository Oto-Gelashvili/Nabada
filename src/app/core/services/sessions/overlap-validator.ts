import { ServiceSession } from '../../../models/sessions';

/**
 * Isolated, pure overlap logic.
 */
export class SessionOverlapValidator {
  /**
   * Returns true if [start, end) overlaps any existing session for the given station,
   * ignoring the session with `excludeId` (used when editing an existing session).
   */
  hasOverlap(
    sessions: ServiceSession[],
    stationId: number,
    start: Date,
    end: Date | null,
    excludeId: number | null = null,
  ): boolean {
    const stationSessions = sessions.filter(
      (s) => s.station_id === stationId && s.id !== excludeId,
    );

    const newStart = start.getTime();
    const newEnd = end ? end.getTime() : Date.now() + 60 * 60 * 1000;

    return stationSessions.some((existing) => {
      const existStart = new Date(existing.start_time).getTime();
      const existEnd = existing.end_time ? new Date(existing.end_time).getTime() : Date.now();

      return newStart < existEnd && newEnd > existStart;
    });
  }
}
