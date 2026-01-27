import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly notification = signal<AppNotification | null>(null);

  private timeoutId: any;

  showError(message: string) {
    this.show(message, 'error');
  }

  showSuccess(message: string) {
    this.show(message, 'success');
  }

  private show(message: string, type: 'success' | 'error') {
    if (this.timeoutId) clearTimeout(this.timeoutId);

    this.notification.set({ message, type });

    this.timeoutId = setTimeout(() => {
      this.notification.set(null);
    }, 4000);
  }
}
