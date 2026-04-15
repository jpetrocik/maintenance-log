import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mileage',
  standalone: false,
  pure: true
})
export class MileagePipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    return value != null ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value) : '0';
  }
}