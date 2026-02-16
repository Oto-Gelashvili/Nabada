import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Spinner } from '../../shared/components/spinner/spinner';

import { NotificationService } from '../../core/services/Notification';
import { ServiceSession, Station } from '../../models/sessions';
import { SessionsHeaderComponent } from './components/sessions-header/sessions-header';
import { StationsService } from '../../core/services/station.service';
import { DateUtils } from '../../shared/components/utils/date.utils';
import { CreateSessionComponent } from './components/create-session/create-sessions';
import { ProductsService } from '../../core/services/products.service';
import { Product } from '../../models/products.model';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    Spinner,
    SessionsHeaderComponent,
    NgClass,
    CreateSessionComponent,
  ],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
})
export class Sessions implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly stationsService = inject(StationsService);
  private readonly productsService = inject(ProductsService);
  private readonly notify = inject(NotificationService);

  private readonly pixelsPerHour = 100;

  // Signals
  showCreateModal = signal(false);
  selectedDate = signal<Date>(new Date());
  editMode = signal(false);
  loading = signal(false);
  resetting = signal(false);
  now = signal(Date.now());

  // Data
  readonly stations = signal<Station[]>([]);
  readonly addedStations = signal<Station[]>([]);
  readonly allStations = computed(() => [...this.stations(), ...this.addedStations()]);
  readonly removedStationsIds = signal<number[]>([]);
  readonly sessions = signal<ServiceSession[]>([]);
  readonly products = signal<Product[]>([]);
  readonly hours = Array.from({ length: 24 }, (_, i) => i);

  private originalData = new Map<number, string>();

  ngOnInit() {
    this.loadData('initLoad');

    const intervalId = setInterval(() => {
      this.now.set(Date.now());
    }, 60000);

    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  async loadData(action: 'initLoad' | 'reset') {
    try {
      if (action === 'initLoad') {
        this.loading.set(true);
      } else if (action === 'reset') {
        this.resetting.set(true);
      }

      this.clearTempState();
      const stationsData = await this.stationsService.getStations(this.selectedDate());
      this.stations.set(stationsData);

      const sessionsData = await this.stationsService.getSessions(this.selectedDate());
      this.sessions.set(sessionsData);

      const productsData = await this.productsService.getProducts();
      this.products.set(productsData);
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(
          $localize`:@@common.fetchingError:Could not fetch data. Please try again.`,
        );
      }
    } finally {
      if (action === 'initLoad') {
        this.loading.set(false);
      } else if (action === 'reset') {
        this.resetting.set(false);
      }
    }
  }

  // === HELPER TO CLEAN STATE ===
  private clearTempState() {
    this.addedStations.set([]);
    this.removedStationsIds.set([]);
    this.originalData.clear();
  }

  // === HEADER EVENTS ===

  async onDateChange() {
    this.loadData('reset');
  }

  async onCreateSession() {
    this.showCreateModal.set(true);
  }

  closeModal() {
    this.showCreateModal.set(false);
  }

  // === HELPERS ===

  getSessionsForStation(stationId: number): ServiceSession[] {
    return this.sessions().filter((s) => s.station_id === stationId);
  }

  calculateLeft(startTimeStr: string): number {
    const sessionStart = new Date(startTimeStr).getTime();
    const viewStart = new Date(this.selectedDate());
    viewStart.setHours(0, 0, 0, 0);

    if (sessionStart < viewStart.getTime()) {
      return 0;
    }

    const date = new Date(startTimeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * this.pixelsPerHour + minutes * (this.pixelsPerHour / 60);
  }

  calculateWidth(startStr: string, endStr: string | null): number {
    const sessionStart = new Date(startStr).getTime();
    const sessionEnd = endStr ? new Date(endStr).getTime() : this.now();

    const viewStart = new Date(this.selectedDate());
    viewStart.setHours(0, 0, 0, 0);

    const viewEnd = new Date(this.selectedDate());
    viewEnd.setHours(24, 0, 0, 0);

    const effectiveStart = Math.max(sessionStart, viewStart.getTime());
    const effectiveEnd = Math.min(sessionEnd, viewEnd.getTime());

    const durationHours = (effectiveEnd - effectiveStart) / (1000 * 60 * 60);

    return Math.max(0, durationHours * this.pixelsPerHour);
  }

  getSessionOverlapClass(session: ServiceSession): string {
    const start = new Date(session.start_time).getTime();
    const end = session.end_time ? new Date(session.end_time).getTime() : this.now();

    const viewStart = new Date(this.selectedDate());
    viewStart.setHours(0, 0, 0, 0);

    const viewEnd = new Date(this.selectedDate());
    viewEnd.setHours(24, 0, 0, 0);

    const classes = [];

    if (start < viewStart.getTime()) {
      classes.push('overflow-left');
    }

    if (end > viewEnd.getTime()) {
      classes.push('overflow-right');
    }

    return classes.join(' ');
  }
  getStateClass(session: ServiceSession): string {
    const now = new Date().getTime();

    if (session.end_time && new Date(session.end_time).getTime() < now) {
      return 'finished';
    }

    if (!session.end_time) {
      return 'activeOpen';
    }

    return 'active';
  }

  hasInvalidStations(): boolean {
    return this.allStations().some((s) => !s.name || s.name.trim() === '');
  }

  isToday(): boolean {
    return DateUtils.isToday(this.selectedDate());
  }

  // === EDIT MODE ===

  async toggleEditMode() {
    if (!this.isToday()) {
      this.notify.showError('Can not edit past stations');
      return;
    }

    if (this.editMode()) {
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
    const changedStations = this.stations().filter((station) => {
      const originalName = this.originalData.get(station.id);
      return station.name !== originalName;
    });

    const updatePromises = changedStations.map((station) =>
      this.stationsService.updateStationName(station.id, station.name),
    );

    const newStations = this.addedStations();
    const createPromises = newStations.map((station) =>
      this.stationsService.createStation({
        name: station.name,
        display_order: station.display_order,
      }),
    );

    const removedStationsIds = this.removedStationsIds();
    const deletePromises = removedStationsIds.map((id) =>
      this.stationsService.removeStation(id).catch((err) => {
        this.notify.showError('Failed to delete');
      }),
    );

    if (updatePromises.length === 0 && createPromises.length === 0 && deletePromises.length === 0) {
      return true;
    }

    try {
      this.resetting.set(true);
      await Promise.all([...updatePromises, ...createPromises, ...deletePromises]);

      this.notify.showSuccess(`Saved`);
      this.removedStationsIds.set([]);
      this.addedStations.set([]);
      await this.loadData('reset');
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
      }
      return false;
    } finally {
      this.resetting.set(false);
    }
  }

  // === STATION ACTIONS ===

  addStation() {
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
    const isNew = this.addedStations().some((s) => s.id === stationId);
    if (isNew) {
      this.addedStations.update((current) => current.filter((s) => s.id !== stationId));
    } else {
      this.stations.update((current) => current.filter((s) => s.id !== stationId));
      this.removedStationsIds.update((current) => [...current, stationId]);
    }
  }
}
