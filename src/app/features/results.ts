import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchCriteria } from '../core/models';
import { HotelStore, defaultCriteria, guestsOf } from '../core/state/hotel.store';
import { HotelCard } from '../shared/hotel-card';
import { Icon } from '../shared/icon';
import { RangePipe } from '../shared/pipes';
import { SearchFilters } from './search-filters';
import { SearchSheet } from './search-sheet';

@Component({
  selector: 'app-results',
  imports: [FormsModule, HotelCard, Icon, RangePipe, SearchFilters, SearchSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page page--tabs">
      <header class="topbar">
        <button type="button" class="icon-btn" aria-label="Orqaga" (click)="location.back()">
          <app-icon name="chevron-left" [size]="22" />
        </button>
        <div class="topbar__title">
          <h1 class="h3">{{ c().query || 'Barcha joylar' }}</h1>
          <p class="meta">{{ c().checkIn | range: c().checkOut }} · {{ guests() }} mehmon · {{ store.results().length }} ta joy</p>
        </div>
        <button type="button" class="icon-btn only-mobile" aria-label="Filtrlarni o‘zgartirish" (click)="sheet.set(true)">
          <app-icon name="sliders" />
        </button>
      </header>

      <div class="results-layout">
        <aside class="filters-panel only-desktop" aria-label="Filtrlar">
          <form (ngSubmit)="apply()">
            <app-search-filters [(criteria)]="draft" [compact]="true" prefix="side-" />
            <div class="filters-panel__actions">
              <button type="button" class="btn btn--outline" (click)="reset()">Tozalash</button>
              <button type="submit" class="btn btn--primary">Qo‘llash</button>
            </div>
          </form>
        </aside>

        <div class="results-main">
          @if (store.results().length) {
            <ul class="v-list v-list--grid">
              @for (h of store.results(); track h.id) {
                <li><app-hotel-card [hotel]="h" [guests]="guests()" [wide]="true" /></li>
              }
            </ul>
          } @else {
            <div class="empty">
              <app-icon name="search" [size]="28" />
              <h2 class="h3">Mos joy topilmadi</h2>
              <p class="muted">Narx oralig‘ini kengaytiring yoki boshqa shaharni tanlang</p>
              <button type="button" class="btn btn--primary" (click)="reset()">Filtrlarni tozalash</button>
            </div>
          }
        </div>
      </div>
    </main>
    <app-search-sheet [(open)]="sheet" />
  `,
})
export class Results {
  protected store = inject(HotelStore);
  protected location = inject(Location);
  protected sheet = signal(false);
  protected c = this.store.criteria;
  protected guests = computed(() => guestsOf(this.c()));
  /** Sidebar draft; applied on submit. */
  protected draft = signal<SearchCriteria>(this.c());

  constructor() {
    effect(() => this.draft.set(this.c()));
  }

  apply() {
    this.store.search(this.draft());
  }

  reset() {
    const d = defaultCriteria();
    this.store.search({ ...d, checkIn: this.c().checkIn, checkOut: this.c().checkOut });
  }
}
