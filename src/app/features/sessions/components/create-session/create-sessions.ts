import { Component, computed, input, OnInit, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { Station } from '../../../../models/sessions';

@Component({
  selector: 'app-create-session',
  imports: [ReactiveFormsModule, DatePickerModule, FormsModule],
  templateUrl: './create-sessions.html',
  styleUrls: ['./create-sessions.css'],
})
export class CreateSessionComponent implements OnInit {
  stations = input<Station[]>([]);
  isCustomSelectOpen = signal(false);
  close = output<void>();
  isSubmitting = signal(false);

  readonly createSessionForm = new FormGroup({
    stationId: new FormControl<number | null>(null, [Validators.required]),
    startTime: new FormControl(new Date(), [Validators.required]),
    endTime: new FormControl(null),
    productIds: new FormControl([]),
  });

  ngOnInit() {
    const allStations = this.stations();

    if (allStations && allStations.length > 0) {
      this.createSessionForm.patchValue({
        stationId: allStations[0].id,
      });
    }
  }

  selectedStationName() {
    const selectedId = this.createSessionForm.controls.stationId.value;
    const matchingStation = this.stations().find((s) => s.id === selectedId);
    return matchingStation ? matchingStation.name : 'Select Station';
  }
  toggleStations() {
    this.isCustomSelectOpen.update((v) => !v);
  }

  selectStation(station: Station) {
    this.createSessionForm.patchValue({ stationId: station.id });
    this.isCustomSelectOpen.set(false);
  }

  onSubmit() {
    console.log(this.createSessionForm.value);
  }
  onCancel() {
    this.close.emit();
  }
}
