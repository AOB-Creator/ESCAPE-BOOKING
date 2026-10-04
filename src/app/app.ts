import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from './core/state/theme.store';
import { ToastStore } from './core/state/toast.store';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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
    // Swap failed images for a blank pixel so the soft placeholder shows, not the broken-image glyph.
    document.addEventListener(
      'error',
      (e) => {
        const img = e.target;
        if (!(img instanceof HTMLImageElement) || img.classList.contains('img-failed')) return;
        img.classList.add('img-failed');
        img.src = BLANK;
      },
      true,
    );
  }
}
