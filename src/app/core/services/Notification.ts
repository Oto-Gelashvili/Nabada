import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  // readonly notifications = signal<AppNotification[]>([
  //   { id: 123123, message: ' erororeroror erororeroror eroror buddysa', type: 'error' },
  //   { id: 123123, message: 'success buddysa', type: 'success' },
  // ]);

  showError(message: string) {
    this.show(message, 'error');
  }

  showSuccess(message: string) {
    this.show(message, 'success');
  }

  remove(id: number) {
    this.notifications.update((current) => current.filter((n) => n.id !== id));
  }

  private show(message: string, type: 'success' | 'error') {
    const id = Date.now() + Math.random();

    this.notifications.update((current) => [...current, { id, message, type }]);

    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }
}
