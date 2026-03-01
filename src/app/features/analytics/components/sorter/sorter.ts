import { Component, input, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-sorter',
  imports: [],
  templateUrl: './sorter.html',
  styleUrl: './sorter.css',
})
export class SorterComponent implements OnInit {
  options = input.required<string[]>();
  sortChanged = output<string>();

  readonly isOpen = signal(false);
  readonly selectedOption = signal<string>('');

  ngOnInit() {
    const first = this.options()[0];
    if (first) this.selectedOption.set(first);
  }
  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  select(option: string): void {
    this.selectedOption.set(option);
    this.isOpen.set(false);
    this.sortChanged.emit(option);
  }
}
