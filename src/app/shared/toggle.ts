import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" role="switch" class="switch" [attr.aria-checked]="checked()"
      [attr.aria-label]="label()" [disabled]="disabled()" (click)="checked.set(!checked())">
      <span class="switch__thumb"></span>
    </button>
  `,
})
export class Toggle {
  readonly checked = model(false);
  readonly label = input('');
  readonly disabled = input(false);
}
