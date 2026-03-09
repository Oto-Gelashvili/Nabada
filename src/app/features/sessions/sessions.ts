import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Spinner } from '../../shared/components/spinner/spinner';
import { SessionsHeaderComponent } from './components/sessions-header/sessions-header';
import { CreateSessionComponent } from './components/create-session/create-sessions';
import { SessionStateService } from '../../core/services/sessions/state.service';
import { StationEditService } from '../../core/services/sessions/edit.service';
import { TimelineCalculator } from '../../core/services/sessions/timeline-calculator';
import { PAY_METHOD_OPTIONS, ServiceSession } from '../../models/sessions';
import { SoundService } from '../../core/services/sound.service';
import { NotificationService } from '../../core/services/Notification';

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
    CurrencyPipe,
  ],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
})
export class Sessions implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  // Services — components read directly from their signals in the template
  protected readonly state = inject(SessionStateService);
  protected readonly edit = inject(StationEditService);
  private readonly sound = inject(SoundService);
  private readonly notify = inject(NotificationService);

  // Local UI state that belongs only to this component
  protected readonly showCreateModal = signal(false);
  protected readonly editableSessionId = signal<number | null>(null);

  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  private readonly now = signal(Date.now());
  private readonly timeline = new TimelineCalculator(100);
  private justExpired = new Set<number>();

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.state.loadAll('initLoad');

    const intervalId = setInterval(() => {
      const nowMs = Date.now();
      this.now.set(nowMs);

      for (const session of this.state.sessions()) {
        if (!session.end_time) continue;
        const endMs = new Date(session.end_time).getTime();
        const justPassed = endMs <= nowMs && endMs > nowMs - 60_000;
        if (justPassed && !this.justExpired.has(session.id)) {
          this.justExpired.add(session.id);
          this.sound.playSessionEnd();
          this.notify.showSuccess($localize`:@@sessions.ended:Session ended`);
        }
      }
    }, 60_000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  // ── Header events ─────────────────────────────────────────────────────────

  onDateChange(): void {
    this.state.loadAll('reset');
  }

  onCreateSession(): void {
    this.showCreateModal.set(true);
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  showEditModal(sessionId: number): void {
    this.editableSessionId.set(sessionId);
    this.showCreateModal.set(true);
  }

  closeModal(): void {
    this.editableSessionId.set(null);
    this.showCreateModal.set(false);
  }

  async onSessionChanged(): Promise<void> {
    await this.state.loadAll('reset');
  }

  // ── Timeline helpers (thin delegation to calculator) ─────────────────────

  protected readonly sessionsByStation = computed(() => {
    const map = new Map<number, ServiceSession[]>();
    for (const s of this.state.sessions()) {
      const list = map.get(s.station_id) ?? [];
      list.push(s);
      map.set(s.station_id, list);
    }
    return map;
  });
  calculateLeft(startTimeStr: string): number {
    return this.timeline.calculateLeft(startTimeStr, this.state.selectedDate());
  }

  calculateWidth(startStr: string, endStr: string | null): number {
    return this.timeline.calculateWidth(startStr, endStr, this.state.selectedDate(), this.now());
  }

  getSessionOverlapClass(session: ServiceSession): string {
    return this.timeline.getOverlapClass(session, this.state.selectedDate(), this.now());
  }

  getStateClass(session: ServiceSession): string {
    return this.timeline.getStateClass(session);
  }
}
