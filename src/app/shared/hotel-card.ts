import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CITY_NAMES } from '../core/data/mock-data';
import { Hotel } from '../core/models';
import { FavoritesStore } from '../core/state/favorites.store';
import { cheapestRoom } from '../core/state/hotel.store';
import { Icon } from './icon';
import { SumPipe } from './pipes';

@Component({
  selector: 'app-hotel-card',
  imports: [RouterLink, Icon, SumPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hotel-card', '[class.hotel-card--wide]': 'wide()' },
  template: `
    <div class="hotel-card__media">
      <img [src]="hotel().photos[0]" alt="" loading="lazy" class="hotel-card__img" />
      <span class="photo-tag">{{ hotel().ownership === 'own' ? 'Marmaris tarmog‘i' : 'Hamkor' }}</span>
      <button
        type="button"
        class="icon-btn fav-btn"
        [class.is-active]="isFav()"
        [attr.aria-pressed]="isFav()"
        [attr.aria-label]="(isFav() ? 'Sevimlilardan olib tashlash: ' : 'Sevimlilarga qo‘shish: ') + hotel().name"
        (click)="favorites.toggle(hotel().id)"
      >
        <app-icon name="heart" [size]="20" [class.filled]="isFav()" />
      </button>
    </div>
    <a class="hotel-card__body stretched" [routerLink]="['/hotel', hotel().id]">
      <h3 class="hotel-card__name">{{ hotel().name }}</h3>
      <p class="rating-line">
        <app-icon name="star" [size]="16" class="filled star" />
        <span>{{ hotel().rating.toFixed(2) }}</span>
        <span class="muted">({{ hotel().reviewsCount }} sharh)</span>
      </p>
      <p class="meta">{{ city() }} · markazgacha {{ hotel().distanceToCenterKm }} km</p>
      <ul class="tag-list" aria-label="Qulayliklar">
        @for (t of hotel().tags.slice(0, 2); track t) {
          <li class="tag">{{ t }}</li>
        }
      </ul>
      @if (from(); as room) {
        <p class="hotel-card__price">
          <span class="price">{{ room.pricePerNight | sum }}</span>
          <span class="muted"> / kecha</span>
        </p>
      }
    </a>
  `,
})
export class HotelCard {
  protected favorites = inject(FavoritesStore);
  readonly hotel = input.required<Hotel>();
  readonly guests = input(1);
  readonly wide = input(false);
  protected isFav = computed(() => this.favorites.ids().includes(this.hotel().id));
  protected city = computed(() => {
    const h = this.hotel();
    const city = CITY_NAMES[h.city];
    return h.district === city ? city : `${city}, ${h.district}`;
  });
  protected from = computed(() => cheapestRoom(this.hotel(), this.guests()) ?? cheapestRoom(this.hotel()));
}
