import { Pipe, PipeTransform } from '@angular/core';
import { formatLongDate, formatNumber, formatRange, formatShortDate, formatSum } from '../core/util/format';

@Pipe({ name: 'sum' })
export class SumPipe implements PipeTransform {
  transform(value: number | null | undefined, withCurrency = true): string {
    return formatSum(value ?? 0, withCurrency);
  }
}

@Pipe({ name: 'num' })
export class NumPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatNumber(value ?? 0);
  }
}

@Pipe({ name: 'shortDate' })
export class ShortDatePipe implements PipeTransform {
  transform(iso: string): string {
    return formatShortDate(iso.slice(0, 10));
  }
}

@Pipe({ name: 'longDate' })
export class LongDatePipe implements PipeTransform {
  transform(iso: string): string {
    return formatLongDate(iso.slice(0, 10));
  }
}

@Pipe({ name: 'range' })
export class RangePipe implements PipeTransform {
  transform(checkIn: string, checkOut: string): string {
    return formatRange(checkIn, checkOut);
  }
}
