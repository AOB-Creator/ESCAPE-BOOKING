import { ChangeDetectionStrategy, Component, effect, inject, model, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchCriteria } from '../core/models';
import { HotelStore, defaultCriteria } from '../core/state/hotel.store';
import { BottomSheet } from '../shared/bottom-sheet';
import { SearchFilters } from './search-filters';

/** Bottom sheet on phones, centered dialog on desktop (see styles.scss). */
@Component({
  selector: 'app-search-sheet',
  imports: [FormsModule, BottomSheet, SearchFilters],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-bottom-sheet [(open)]="open" title="Joy qidirish" [tall]="true">
      <form id="search-form" (ngSubmit)="submit()">
        <app-search-filters [(criteria)]="c" prefix="sheet-" />
      </form>
      <div sheet-footer class="sheet__footer">
        <button type="button" class="btn btn--outline" (click)="c.set(defaults())">Tozalash</button>
        <button type="submit" form="search-form" class="btn btn--primary">Qidirish</button>
      </div>
    </app-bottom-sheet>
  `,
})
export class SearchSheet {
  private store = inject(HotelStore);
  private router = inject(Router);
  readonly open = model(false);
  protected c = signal<SearchCriteria>(this.store.criteria());
  protected defaults = defaultCriteria;

  constructor() {
    // Re-sync the draft with the store each time the sheet opens.
    effect(() => {
      if (this.open()) this.c.set(untracked(() => this.store.criteria()));
    });
  }

  submit() {
    this.store.search(this.c());
    this.open.set(false);
    this.router.navigateByUrl('/results');
  }
}
