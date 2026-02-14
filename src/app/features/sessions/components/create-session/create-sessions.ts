import { Component, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-session',
  imports: [ReactiveFormsModule],
  templateUrl: './create-sessions.html',
  styleUrls: ['./create-sessions.css'],
})
export class CreateSessionComponent {
  close = output<void>();
  isSubmitting = signal(false);

  readonly createSessionForm = new FormGroup({
    stationId: new FormControl(null, [Validators.required]),
    startTime: new FormControl(this.getCurrentTime(), [Validators.required]),
    endTime: new FormControl(''),
    productIds: new FormControl([]),
  });

  private getCurrentTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
  onSubmit() {
    console.log(this.createSessionForm.value);
  }
  onCancel() {
    this.close.emit();
  }
}
