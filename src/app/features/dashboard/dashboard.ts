import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { StationsService } from '../../core/services/station.service';
import { ServiceSession, Station } from '../../models/sessions';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly stationService = inject(StationsService);

  protected readonly stations = signal<Station[]>([]);
  protected readonly sessions = signal<ServiceSession[]>([]);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  protected readonly currentTime = signal<string>('');
  protected readonly now = signal<number>(Date.now());

  async ngOnInit(): Promise<void> {
    this.updateClock();
    await this.loadData();
    this.refreshInterval = setInterval(() => {
      this.loadData();
      this.updateClock();
    }, 30_000);
    setInterval(() => {
      this.updateClock();
      this.now.set(Date.now());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private updateClock(): void {
    this.currentTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
  private async loadData(): Promise<void> {
    const today = new Date();
    const [stations, sessions] = await Promise.all([
      this.stationService.getStations(),
      this.stationService.getSessions(today),
    ]);
    this.stations.set(stations);
    this.sessions.set(sessions);
  }

  protected getActiveSession(stationId: number): ServiceSession | null {
    const now = new Date();
    return (
      this.sessions().find(
        (s) =>
          s.station_id === stationId &&
          new Date(s.start_time) <= now &&
          (!s.end_time || new Date(s.end_time) >= now),
      ) ?? null
    );
  }

  protected isUnpaid(session: ServiceSession): boolean {
    return session.pay_method === 'NotPaid' || session.pay_method?.includes('NotPaid');
  }

  protected getStationState(stationId: number): 'empty' | 'ending-soon' | 'active' {
    const session = this.getActiveSession(stationId);
    if (!session) return 'empty';
    if (session.end_time) {
      const minutesLeft = (new Date(session.end_time).getTime() - Date.now()) / 60_000;
      if (minutesLeft <= 5) return 'ending-soon';
    }
    return 'active';
  }

  protected getCountdown(stationId: number): string {
    this.now();
    const session = this.getActiveSession(stationId);
    if (!session || !session.end_time) return '';

    const msLeft = new Date(session.end_time).getTime() - this.now();
    if (msLeft <= 0) return '0:00';

    const totalSeconds = Math.floor(msLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  protected formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
