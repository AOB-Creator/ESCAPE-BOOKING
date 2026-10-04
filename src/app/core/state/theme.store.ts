import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  readonly mode = signal<ThemeMode>(this.load());

  constructor() {
    effect(() => {
      const mode = this.mode();
      const root = document.documentElement;
      if (mode === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', mode);
      try {
        localStorage.setItem('escape.theme', mode);
      } catch {
        /* ignore */
      }
    });
  }

  private load(): ThemeMode {
    try {
      const v = localStorage.getItem('escape.theme');
      return v === 'light' || v === 'dark' ? v : 'system';
    } catch {
      return 'system';
    }
  }
}
