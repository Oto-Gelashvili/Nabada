import { Component, computed, input, model, output } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { DateUtils } from '../../../../shared/components/utils/date.utils';

@Component({
  selector: 'app-sessions-header',
  imports: [DatePickerModule, FormsModule],
  templateUrl: './sessions-header.html',
  styleUrls: ['./sessions-header.css'],
})
export class SessionsHeaderComponent {
  date = model.required<Date>();
  editMode = input<boolean>(false);

  cancelEdit = output<void>();
  createClick = output<void>();

  readonly today = new Date();
  readonly isToday = computed(() => DateUtils.isToday(this.date()));

  changeDay(days: number) {
    const newDate = new Date(this.date());
    newDate.setDate(newDate.getDate() + days);
    if (newDate > this.today) return;
    this.date.set(newDate);
  }

  onCancel() {
    this.cancelEdit.emit();
  }
}
