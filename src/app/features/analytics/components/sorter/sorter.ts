import { Component, output, signal } from '@angular/core';
import { SortOption } from '../../models/analytics.models';

@Component({
  selector: 'app-sorter',
  imports: [],
  templateUrl: './sorter.html',
  styleUrl: './sorter.css',
})
export class SorterComponent {
  sortChanged = output<SortOption>();

  readonly isOpen = signal(false);

  readonly options: SortOption[] = [
    'Decreasing total',
    'Increasing total',
    'Decreasing gaming',
    'Increasing gaming',
    'Decreasing products',
    'Increasing products',
  ];

  readonly selectedOption = signal<SortOption>('Decreasing total');

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  select(option: SortOption): void {
    this.selectedOption.set(option);
    this.isOpen.set(false);
    this.sortChanged.emit(option);
  }
}
