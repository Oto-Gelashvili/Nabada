import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: number;
  message: string;
  type: 'success' | 'error';
  leaving?: boolean;
}
interface ConfirmationRequest {
  message: string;
  resolve: (result: boolean) => void;
}
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  readonly confirmation = signal<ConfirmationRequest | null>(null);

  showError(message: string) {
    this.show(message, 'error');
  }

  showSuccess(message: string) {
    this.show(message, 'success');
  }

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmation.set({ message, resolve });
    });
  }

  resolveConfirm(result: boolean) {
    const request = this.confirmation();
    if (request) {
      request.resolve(result);
      this.confirmation.set(null);
    }
  }

  remove(id: number) {
    this.notifications.update((current) => current.filter((n) => n.id !== id));
  }

  private show(message: string, type: 'success' | 'error') {
    const id = Date.now() + Math.random();
    this.notifications.update((current) => [...current, { id, message, type }]);

    setTimeout(() => {
      this.markLeaving(id);
      setTimeout(() => this.remove(id), 600);
    }, 3400);
  }

  private markLeaving(id: number) {
    this.notifications.update((current) =>
      current.map((n) => (n.id === id ? { ...n, leaving: true } : n)),
    );
  }
}
