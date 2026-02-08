import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { ServiceSession, Station } from '../../models/sessions';
import { NotificationService } from '../../core/services/Notification';
import { FormsModule } from '@angular/forms';
import { Spinner } from '../../shared/components/spinner/spinner';
@Component({
  selector: 'app-sessions',
  imports: [DatePipe, FormsModule, Spinner],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
})
export class Sessions implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notify = inject(NotificationService);
  private readonly pixelsPerHour = 100;
  readonly currentDate = signal<Date>(new Date());
  readonly stations = signal<Station[]>([]);
  readonly addedStations = signal<Station[]>([]);
  readonly allStations = computed(() => [...this.stations(), ...this.addedStations()]);
  readonly removedStationsIds = signal<number[]>([]);
  readonly sessions = signal<ServiceSession[]>([]);
  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly now = signal(Date.now());
  private originalData = new Map<number, string>();
  loading = signal(false);
  resetting = signal(false);
  editMode = signal(false);

  ngOnInit() {
    this.loadData('initLoad');

    setInterval(() => {
      this.now.set(Date.now());
    }, 60000);
  }

  async loadData(action: 'initLoad' | 'reset') {
    try {
      if (action === 'initLoad') {
        this.loading.set(true);
      } else if (action === 'reset') {
        this.resetting.set(true);
      }
      const stationsData = await this.supabase.getStations();
      this.stations.set(stationsData);

      await this.fetchSessionsForCurrentDate();
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    } finally {
      if (action === 'initLoad') {
        this.loading.set(false);
      } else if (action === 'reset') {
        this.resetting.set(false);
      }
    }
  }
  async fetchSessionsForCurrentDate() {
    try {
      const data = await this.supabase.getSessions(this.currentDate());
      this.sessions.set(data);
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
    }
  }

  getSessionsForStation(stationId: number): ServiceSession[] {
    return this.sessions().filter((s) => s.station_id === stationId);
  }

  changeDate(days: number) {
    this.currentDate.update((d) => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
    this.fetchSessionsForCurrentDate();
  }

  calculateLeft(startTimeStr: string): number {
    const date = new Date(startTimeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return hours * this.pixelsPerHour + minutes * (this.pixelsPerHour / 60);
  }

  calculateWidth(startStr: string, endStr: string | null): number {
    const start = new Date(startStr).getTime();

    const end = endStr ? new Date(endStr).getTime() : this.now();

    const durationHours = (end - start) / (1000 * 60 * 60);

    return durationHours * this.pixelsPerHour;
  }

  hasInvalidStations(): boolean {
    return this.allStations().some((s) => !s.name || s.name.trim() === '');
  }

  async toggleEditMode() {
    if (this.editMode()) {
      // only close mode when
      const success = await this.saveAllChanges();
      if (success) {
        this.editMode.set(false);
      }
    } else {
      this.captureSnapshot();
      this.editMode.set(true);
    }
  }
  private captureSnapshot() {
    this.originalData.clear();
    this.stations().forEach((s) => {
      this.originalData.set(s.id, s.name);
    });
  }
  closeEditMode() {
    this.editMode.set(false);
    this.loadData('reset');
  }

  async saveAllChanges(): Promise<boolean> {
    //  PREPARE UPDATES
    const changedStations = this.stations().filter((station) => {
      const originalName = this.originalData.get(station.id);
      return station.name !== originalName;
    });

    const updatePromises = changedStations.map((station) =>
      this.supabase.updateStationName(station.id, station.name),
    );

    //  PREPARE CREATES
    const newStations = this.addedStations();

    const createPromises = newStations.map((station) =>
      this.supabase.createStation({
        name: station.name,
        display_order: station.display_order,
      }),
    );

    // PREPARE DELETES
    const removedStationsIds = this.removedStationsIds();
    const deletePromises = removedStationsIds.map((id) =>
      this.supabase.removeStation(id).catch((err) => {
        this.notify.showError('Failed to delete');
        this.loadData('reset');
      }),
    );

    // CHECK IF ANYTHING NEW
    if (updatePromises.length === 0 && createPromises.length === 0 && deletePromises.length === 0) {
      return true;
    }

    try {
      this.resetting.set(true);
      await Promise.all([...updatePromises, ...createPromises, ...deletePromises]);

      this.notify.showSuccess(`Saved`);
      // CLEANUP AND RELOAD
      this.removedStationsIds.set([]);
      this.addedStations.set([]);
      await this.loadData('reset');
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
      // THIS KEEPS EDIT MODE OPEN ON FAIL
      return false;
    } finally {
      this.resetting.set(false);
    }
  }
  addStation() {
    // we find highest display order to avoid future collision
    const maxOrder = this.allStations().reduce((max, station) => {
      return Math.max(max, station.display_order);
    }, 0);
    const nextId = Date.now();
    const nextOrder = maxOrder + 1;

    const newStation: Station = {
      id: nextId,
      name: `PS${nextOrder}`,
      display_order: nextOrder,
    };
    this.addedStations.update((current) => [...current, newStation]);
  }
  removeStation(stationId: number) {
    // if removing newly added station
    const isNew = this.addedStations().some((s) => s.id === stationId);
    if (isNew) {
      this.addedStations.update((current) => current.filter((s) => s.id !== stationId));
    } else {
      // if removing existing(db) station
      this.stations.update((current) => current.filter((s) => s.id !== stationId));

      this.removedStationsIds.update((current) => [...current, stationId]);
    }
  }
}
