import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/Notification';

@Component({
  selector: 'app-errorModal',
  imports: [],
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.css',
})
export class ErrorModal {
  private readonly notifyService = inject(NotificationService);
  readonly notifications = this.notifyService.notifications;
}
