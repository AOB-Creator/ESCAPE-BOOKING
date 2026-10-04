import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastStore {
  readonly message = signal('');
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string) {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(''), 2600);
  }
}
