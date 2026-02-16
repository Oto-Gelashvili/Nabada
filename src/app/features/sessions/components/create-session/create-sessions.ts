import { Component, computed, input, OnInit, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { Station } from '../../../../models/sessions';
import { Product } from '../../../../models/products.model';

@Component({
  selector: 'app-create-session',
  imports: [ReactiveFormsModule, CheckboxModule, DatePickerModule, FormsModule],
  templateUrl: './create-sessions.html',
  styleUrls: ['./create-sessions.css'],
})
export class CreateSessionComponent implements OnInit {
  stations = input<Station[]>([]);
  products = input<Product[]>([]);
  isCustomSelectOpen = signal(false);
  isCustomMultiSelectOpen = signal(false);
  close = output<void>();
  isSubmitting = signal(false);

  readonly createSessionForm = new FormGroup({
    stationId: new FormControl<number | null>(null, [Validators.required]),
    startTime: new FormControl(new Date(), [Validators.required]),
    endTime: new FormControl(null),
    productIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  ngOnInit() {
    const allStations = this.stations();

    if (allStations && allStations.length > 0) {
      this.createSessionForm.patchValue({
        stationId: allStations[0].id,
      });
    }
  }

  selectedStationName(): string {
    const selectedId = this.createSessionForm.controls.stationId.value;
    const matchingStation = this.stations().find((s) => s.id === selectedId);
    return matchingStation ? matchingStation.name : 'Select Station';
  }
  toggleCustomSelect() {
    this.isCustomSelectOpen.update((v) => !v);
    this.isCustomMultiSelectOpen.set(false);
  }
  toggleCustomMultiSelect() {
    this.isCustomMultiSelectOpen.update((v) => !v);
    this.isCustomSelectOpen.set(false);
  }

  selectStation(station: Station) {
    this.createSessionForm.patchValue({ stationId: station.id });
    this.isCustomSelectOpen.set(false);
  }

  isProductSelected(productId: number): boolean {
    const currentIds = this.createSessionForm.controls.productIds.value;
    return currentIds.includes(productId);
  }
  toggleProduct(product: Product) {
    const currentIds = this.createSessionForm.controls.productIds.value;
    const index = currentIds.indexOf(product.id);
    let newIds: number[];
    if (index > -1) {
      newIds = currentIds.filter((id) => id !== product.id);
    } else {
      newIds = [...currentIds, product.id];
    }

    this.createSessionForm.patchValue({ productIds: newIds });
  }

  selectedProductsList(): Product[] {
    const selectedIds = this.createSessionForm.controls.productIds.value;
    return this.products().filter((p) => selectedIds.includes(p.id));
  }
  removeProduct(productId: number) {
    const currentIds = this.createSessionForm.controls.productIds.value;
    const newIds = currentIds.filter((id) => id !== productId);

    this.createSessionForm.patchValue({ productIds: newIds });
  }

  onSubmit() {
    console.log(this.createSessionForm.value);
  }
  onCancel() {
    this.close.emit();
  }
}
