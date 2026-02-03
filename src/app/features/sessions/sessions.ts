import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase';
import { ServiceSession, Station } from '../../models/sessions';
import { NotificationService } from '../../core/services/Notification';
@Component({
  selector: 'app-sessions',
  imports: [DatePipe],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
})
export class Sessions implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notify = inject(NotificationService);
  private readonly pixelsPerHour = 100;
  readonly currentDate = signal<Date>(new Date());
  readonly stations = signal<Station[]>([]);
  readonly sessions = signal<ServiceSession[]>([]);
  readonly hours = Array.from({ length: 24 }, (_, i) => i);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const stationsData = await this.supabase.getStations();
      this.stations.set(stationsData);

      await this.fetchSessionsForCurrentDate();
    } catch (error) {
      if (error instanceof Error) {
        this.notify.showError(error.message);
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

    // Logic: (Hours * 100) + (Minutes * (100/60))
    return hours * this.pixelsPerHour + minutes * (this.pixelsPerHour / 60);
  }

  calculateWidth(startStr: string, endStr: string | null): number {
    if (!endStr) return 100; // Default width for "Open" sessions

    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();

    // Difference in hours
    const durationInHours = (end - start) / (1000 * 60 * 60);

    return durationInHours * this.pixelsPerHour;
  }
}
