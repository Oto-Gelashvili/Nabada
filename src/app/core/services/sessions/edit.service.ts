import { computed, inject, Injectable, signal } from '@angular/core';
import { Station } from '../../../models/sessions';
import { StationsService } from '../station.service';
import { NotificationService } from '../Notification';
import { SessionStateService } from './state.service';
import { DateUtils } from '../../../shared/components/utils/date.utils';

/**
 * StationEditService owns edit-mode state and all station CRUD operations.
 */
@Injectable({ providedIn: 'root' })
export class StationEditService {
  private readonly stationsService = inject(StationsService);
  private readonly notify = inject(NotificationService);
  private readonly state = inject(SessionStateService);

  readonly editMode = signal(false);

  /** Stations added locally during an edit session (not yet persisted). */
  private readonly addedStations = signal<Station[]>([]);

  /** IDs of existing stations marked for deletion (not yet persisted). */
  private readonly removedStationIds = signal<number[]>([]);

  /** Snapshot of original names so we can diff on save. */
  private originalNames = new Map<number, string>();

  // ── Derived ───────────────────────────────────────────────────────────────

  /** The full list rendered in the template. */
  readonly allStations = computed(() => [...this.state.stations(), ...this.addedStations()]);

  readonly hasInvalidStations = computed(() =>
    this.allStations().some((s) => !s.name || s.name.trim() === ''),
  );

  // ── Edit mode lifecycle ───────────────────────────────────────────────────

  async toggleEditMode(): Promise<void> {
    if (!DateUtils.isToday(this.state.selectedDate())) {
      this.notify.showError($localize`:@@error.pastStations:Can not edit past stations`);
      return;
    }

    if (this.editMode()) {
      const saved = await this.saveAll();
      if (saved) this.editMode.set(false);
    } else {
      this.captureSnapshot();
      this.editMode.set(true);
    }
  }

  cancelEditMode(): void {
    this.editMode.set(false);
    this.clearTempState();
    this.state.loadAll('reset');
  }

  // ── Station actions ───────────────────────────────────────────────────────

  addStation(): void {
    const maxOrder = this.allStations().reduce((max, s) => Math.max(max, s.display_order), 0);
    const order = maxOrder + 1;
    this.addedStations.update((current) => [
      ...current,
      { id: Date.now(), name: `PS${order}`, display_order: order },
    ]);
  }

  removeStation(stationId: number): void {
    const isNew = this.addedStations().some((s) => s.id === stationId);
    if (isNew) {
      this.addedStations.update((list) => list.filter((s) => s.id !== stationId));
    } else {
      this.state.stations.update((list) => list.filter((s) => s.id !== stationId));
      this.removedStationIds.update((ids) => [...ids, stationId]);
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private async saveAll(): Promise<boolean> {
    const updates = this.state
      .stations()
      .filter((s) => this.originalNames.get(s.id) !== s.name)
      .map((s) => this.stationsService.updateStationName(s.id, s.name));

    const creates = this.addedStations().map((s) =>
      this.stationsService.createStation({ name: s.name, display_order: s.display_order }),
    );

    const deletes = this.removedStationIds().map((id) => this.stationsService.removeStation(id));

    if (!updates.length && !creates.length && !deletes.length) return true;

    this.state.resetting.set(true);
    try {
      await Promise.all([...updates, ...creates, ...deletes]);
      this.notify.showSuccess($localize`:@@common.saved:Saved`);
      this.clearTempState();
      await this.state.loadAll('reset');
      return true;
    } catch (error) {
      if (error instanceof Error) this.notify.showError(error.message);
      return false;
    } finally {
      this.state.resetting.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private captureSnapshot(): void {
    this.originalNames.clear();
    this.state.stations().forEach((s) => this.originalNames.set(s.id, s.name));
  }

  private clearTempState(): void {
    this.addedStations.set([]);
    this.removedStationIds.set([]);
    this.originalNames.clear();
  }
}
