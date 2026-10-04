import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-stepper',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" role="group" [attr.aria-label]="label()">
      <button type="button" class="stepper__btn" [attr.aria-label]="label() + ': kamaytirish'"
        [disabled]="value() <= min()" (click)="value.set(value() - 1)">
        <app-icon name="minus" />
      </button>
      <output class="stepper__value" aria-live="polite">{{ value() }}</output>
      <button type="button" class="stepper__btn" [attr.aria-label]="label() + ': oshirish'"
        [disabled]="value() >= max()" (click)="value.set(value() + 1)">
        <app-icon name="plus" />
      </button>
    </div>
  `,
})
export class Stepper {
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(10);
  readonly label = input('');
}
