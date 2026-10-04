import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesStore } from '../core/state/favorites.store';
import { HotelStore, guestsOf } from '../core/state/hotel.store';
import { HotelCard } from '../shared/hotel-card';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, HotelCard, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page page--tabs">
      <header class="page-head">
        <h1 class="h1">Sevimlilar</h1>
      </header>
      @if (list().length) {
        <ul class="v-list">
          @for (h of list(); track h.id) {
            <li><app-hotel-card [hotel]="h" [guests]="guests()" [wide]="true" /></li>
          }
        </ul>
      } @else {
        <div class="empty">
          <app-icon name="heart" [size]="28" />
          <h2 class="h3">Sevimlilar bo‘sh</h2>
          <p class="muted">Yoqqan mehmonxonani yurakcha bilan belgilang</p>
          <a class="btn btn--primary" routerLink="/home">Mehmonxonalarni ko‘rish</a>
        </div>
      }
    </main>
  `,
})
export class Favorites {
  private favorites = inject(FavoritesStore);
  private hotels = inject(HotelStore);
  protected guests = computed(() => guestsOf(this.hotels.criteria()));
  protected list = computed(() =>
    this.favorites
      .ids()
      .map((id) => this.hotels.hotels().find((h) => h.id === id))
      .filter((h) => !!h),
  );
}
