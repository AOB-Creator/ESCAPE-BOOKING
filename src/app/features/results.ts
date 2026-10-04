import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { HotelStore, defaultCriteria, guestsOf } from '../core/state/hotel.store';
import { HotelCard } from '../shared/hotel-card';
import { Icon } from '../shared/icon';
import { RangePipe } from '../shared/pipes';
import { SearchSheet } from './search-sheet';

@Component({
  selector: 'app-results',
  imports: [HotelCard, Icon, RangePipe, SearchSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page page--tabs">
      <header class="topbar">
        <button type="button" class="icon-btn" aria-label="Orqaga" (click)="location.back()">
          <app-icon name="chevron-left" [size]="22" />
        </button>
        <div class="topbar__title">
          <h1 class="h3">{{ c().query || 'Barcha joylar' }}</h1>
          <p class="meta">{{ c().checkIn | range: c().checkOut }} · {{ guests() }} mehmon</p>
        </div>
        <button type="button" class="icon-btn" aria-label="Filtrlarni o‘zgartirish" (click)="sheet.set(true)">
          <app-icon name="sliders" />
        </button>
      </header>

      <p class="meta results-count" aria-live="polite">{{ store.results().length }} ta joy topildi</p>

      @if (store.results().length) {
        <ul class="v-list">
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
    </main>
    <app-search-sheet [(open)]="sheet" />
  `,
  styles: `.results-count { margin: 4px 0 12px; }`,
})
export class Results {
  protected store = inject(HotelStore);
  protected location = inject(Location);
  protected sheet = signal(false);
  protected c = this.store.criteria;
  protected guests = computed(() => guestsOf(this.c()));

  reset() {
    const d = defaultCriteria();
    this.store.search({ ...d, checkIn: this.c().checkIn, checkOut: this.c().checkOut });
  }
}
