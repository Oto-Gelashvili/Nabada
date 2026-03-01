import { Component, input, OnInit, output, signal } from '@angular/core';
import { SortOption } from '../../models/analytics.models';

@Component({
  selector: 'app-sorter',
  imports: [],
  templateUrl: './sorter.html',
  styleUrl: './sorter.css',
})
export class SorterComponent implements OnInit {
  options = input.required<SortOption[]>();
  sortChanged = output<string>();

  readonly isOpen = signal(false);
  readonly selectedOption = signal<SortOption | null>(null);

  ngOnInit() {
    const first = this.options()[0];
    if (first) this.selectedOption.set(first);
  }
  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  select(option: SortOption): void {
    this.selectedOption.set(option);
    this.isOpen.set(false);
    this.sortChanged.emit(option.key);
  }
}
