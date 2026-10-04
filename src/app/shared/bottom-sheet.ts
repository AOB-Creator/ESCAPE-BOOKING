import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';

let nextId = 0;

/**
 * Modal bottom sheet: slides up over a dimmed backdrop, traps focus,
 * closes on Escape / backdrop tap, restores focus on close.
 */
@Component({
  selector: 'app-bottom-sheet',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="sheet-backdrop" animate.enter="fade-in" animate.leave="fade-out" (click)="close()"></div>
      <section
        #panel
        class="sheet"
        [class.sheet--tall]="tall()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        tabindex="-1"
        animate.enter="sheet-in"
        animate.leave="sheet-out"
        (keydown)="onKeydown($event)"
      >
        <div class="sheet__grip" aria-hidden="true"></div>
        @if (title()) {
          <header class="sheet__header">
            <h2 class="sheet__title" [id]="titleId">{{ title() }}</h2>
            <button type="button" class="icon-btn icon-btn--plain sheet__close" aria-label="Yopish" (click)="close()">
              <app-icon name="x" [size]="22" />
            </button>
          </header>
        } @else {
          <span class="visually-hidden" [id]="titleId">{{ label() }}</span>
        }
        <div class="sheet__body">
          <ng-content />
        </div>
        <ng-content select="[sheet-footer]" />
      </section>
    }
  `,
})
export class BottomSheet {
  readonly open = model(false);
  readonly title = input('');
  /** Accessible name when there is no visible title. */
  readonly label = input('');
  readonly tall = input(false);
  protected readonly titleId = `sheet-title-${nextId++}`;
  private panel = viewChild<ElementRef<HTMLElement>>('panel');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      untracked(() => {
        document.body.classList.toggle('no-scroll', isOpen);
        if (isOpen) {
          this.returnFocus = document.activeElement as HTMLElement | null;
          queueMicrotask(() => setTimeout(() => this.panel()?.nativeElement.focus()));
        } else if (this.returnFocus) {
          this.returnFocus.focus?.();
          this.returnFocus = null;
        }
      });
    });
  }

  close() {
    this.open.set(false);
  }

  protected onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.close();
      return;
    }
    if (e.key !== 'Tab') return;
    const root = this.panel()?.nativeElement;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
