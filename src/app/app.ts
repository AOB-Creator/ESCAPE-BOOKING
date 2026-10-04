import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from './core/state/theme.store';
import { ToastStore } from './core/state/toast.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <router-outlet />
    </div>
    <div class="toast-region" role="status" aria-live="polite">
      @if (toast.message()) {
        <p class="toast">{{ toast.message() }}</p>
      }
    </div>
  `,
})
export class App {
  protected toast = inject(ToastStore);
  // Instantiated eagerly so the saved theme applies on first paint.
  private theme = inject(ThemeStore);

  constructor() {
    // Hide the browser's broken-image glyph; the soft placeholder behind stays.
    document.addEventListener(
      'error',
      (e) => {
        if (e.target instanceof HTMLImageElement) e.target.classList.add('img-failed');
      },
      true,
    );
  }
}
