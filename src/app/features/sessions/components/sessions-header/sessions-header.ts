import { Component, computed, ElementRef, input, model, output, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DateUtils } from '../../../../shared/components/utils/date.utils';

@Component({
  selector: 'app-sessions-header',
  imports: [DatePipe],
  templateUrl: './sessions-header.html',
  styleUrls: ['./sessions-header.css'],
})
export class SessionsHeaderComponent {
  date = model.required<Date>();
  editMode = input<boolean>(false);

  cancelEdit = output<void>();
  createClick = output<void>();

  @ViewChild('datePickerInput') datePickerInput!: ElementRef<HTMLInputElement>;
  private readonly today = new Date();

  dateInputValue = computed(() => DateUtils.toISODate(this.date()));

  maxDate = computed(() => DateUtils.toISODate(this.today));

  isToday = computed(() => DateUtils.isToday(this.date()));

  changeDay(days: number) {
    const newDate = new Date(this.date());
    newDate.setDate(newDate.getDate() + days);

    if (newDate > this.today) return;

    this.date.set(newDate);
  }

  onCancel() {
    this.cancelEdit.emit();
  }

  openDatePicker() {
    try {
      this.datePickerInput.nativeElement.showPicker();
    } catch {
      this.datePickerInput.nativeElement.click();
    }
  }

  onDatePicked(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.value) return;

    const [year, month, day] = input.value.split('-').map(Number);
    this.date.set(new Date(year, month - 1, day));
  }
}
