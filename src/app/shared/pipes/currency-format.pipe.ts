import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatCurrency', standalone: true })
export class FormatCurrencyPipe implements PipeTransform {
  transform(value: number): string {
    if (value >= 1000) {
      const k = value / 1000;
      return '₾' + (k % 1 === 0 ? k : k.toFixed(1)) + 'k';
    }
    return '₾' + Math.round(value);
  }
}
