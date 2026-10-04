import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CITIES, PROPERTY_TYPES } from '../core/data/mock-data';
import { City, Hotel, PropertyType } from '../core/models';
import { AuthStore } from '../core/state/auth.store';
import { BookingStore } from '../core/state/booking.store';
import { HotelStore, cheapestRoom, guestsOf } from '../core/state/hotel.store';
import { LoyaltyStore } from '../core/state/loyalty.store';
import { Icon } from '../shared/icon';
import { HotelCard } from '../shared/hotel-card';
import { NumPipe, RangePipe } from '../shared/pipes';
import { NotificationsSheet } from './notifications-sheet';
import { SearchSheet } from './search-sheet';
import { WebSearch } from './web-search';

type Sort = 'location' | 'price' | 'rating' | 'reviews';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, HotelCard, NumPipe, RangePipe, SearchSheet, NotificationsSheet, WebSearch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page page--tabs home">
      <header class="greeting home__greet">
        <div>
          <h1 class="h1">Salom, {{ auth.firstName() }}</h1>
          <p class="muted">Keyingi safaringiz uchun mehmonxona toping</p>
        </div>
        <button type="button" class="icon-btn icon-btn--lg only-mobile" (click)="notifOpen.set(true)"
          [attr.aria-label]="'Bildirishnomalar' + (badge() ? ': ' + badge() + ' ta yangi' : '')">
          <app-icon name="bell" [size]="22" />
          @if (badge()) {
            <span class="badge" aria-hidden="true">{{ badge() }}</span>
          }
        </button>
      </header>

      <div class="home__search">
        <!-- Phone: one pill that opens the search sheet -->
        <div class="searchbar only-mobile">
          <button type="button" class="searchbar__main" (click)="searchOpen.set(true)">
            <app-icon name="search" />
            <span class="searchbar__text" [class.muted-2]="!c().query">{{ c().query || 'O‘zbekiston' }}</span>
          </button>
          <button type="button" class="icon-btn icon-btn--plain" aria-label="Filtrlar" (click)="searchOpen.set(true)">
            <app-icon name="sliders" />
          </button>
        </div>

        <!-- Desktop: inline segmented search -->
        <app-web-search class="only-desktop" />
      </div>

      <div class="chips-row home__chips only-mobile" role="radiogroup" aria-label="Saralash">
        @for (s of sorts; track s.id) {
          <button type="button" role="radio" class="chip" [class.is-active]="sort() === s.id"
            [attr.aria-checked]="sort() === s.id" (click)="sort.set(s.id)">
            {{ s.label }} <app-icon name="chevron-down" [size]="16" />
          </button>
        }
      </div>

      <div class="toolbar home__chips only-desktop">
        <div class="toolbar__group">
          <span class="toolbar__label" id="sort-l">Saralash</span>
          <div class="segmented" role="radiogroup" aria-labelledby="sort-l">
            @for (s of sorts; track s.id) {
              <button type="button" role="radio" class="segmented__item" [class.is-active]="sort() === s.id"
                [attr.aria-checked]="sort() === s.id" (click)="sort.set(s.id)">{{ s.label }}</button>
            }
          </div>
        </div>
        <div class="toolbar__group">
          <span class="toolbar__label" id="type-l">Joy turi</span>
          <div class="chip-wrap" role="radiogroup" aria-labelledby="type-l">
            @for (t of types; track t.id) {
              <button type="button" role="radio" class="chip chip--sm" [class.is-active]="type() === t.id"
                [attr.aria-checked]="type() === t.id" (click)="type.set(t.id)">{{ t.label }}</button>
            }
          </div>
        </div>
      </div>

      <a class="loyalty-strip home__loyalty" routerLink="/bonuses" [attr.aria-label]="'Bonuslar: ' + loyalty.balance() + ' ball'">
        <div class="loyalty-strip__top">
          <span class="loyalty-strip__points"><strong>{{ loyalty.balance() | num }}</strong> ball</span>
          <span class="pill pill--dark">{{ loyalty.progress().tier.name }}</span>
        </div>
        <div class="progress" aria-hidden="true">
          <span class="progress__bar" [style.width.%]="loyalty.progress().ratio * 100"></span>
        </div>
        <p class="meta">
          @if (loyalty.progress().next; as next) {
            {{ next.name }} darajasigacha {{ loyalty.progress().remaining | num }} ball
          } @else {
            Eng yuqori daraja
          }
          @if (loyalty.account().pending) {
            · {{ loyalty.account().pending | num }} ball kutilmoqda
          }
        </p>
      </a>

      <section class="section home__recent" aria-labelledby="recent-h">
        <h2 class="section__title" id="recent-h">Yaqinda ko‘rilgan</h2>
        <ul class="h-scroll h-scroll--grid-4">
          @for (city of cities; track city.id) {
            <li>
              <button type="button" class="city-card" (click)="openCity(city)">
                <img [src]="city.photo" alt="" loading="lazy" />
                <span class="photo-tag">Borishni xohlayman</span>
                <span class="city-card__text">
                  <span class="city-card__name">{{ city.name }}</span>
                  <span class="city-card__dates">{{ c().checkIn | range: c().checkOut }}</span>
                </span>
              </button>
            </li>
          }
        </ul>
      </section>

      <section class="section home__popular" aria-labelledby="popular-h">
        <h2 class="section__title" id="popular-h">Mashhur mehmonxonalar</h2>
        @if (popular().length) {
          <ul class="h-scroll h-scroll--grid">
            @for (h of popular(); track h.id) {
              <li><app-hotel-card [hotel]="h" [guests]="guests()" /></li>
            }
          </ul>
        } @else {
          <p class="muted">Bu turdagi joy hozircha yo‘q</p>
        }
      </section>
    </main>

    <app-search-sheet [(open)]="searchOpen" />
    <app-notifications-sheet [(open)]="notifOpen" />
  `,
})
export class Home {
  protected auth = inject(AuthStore);
  protected hotels = inject(HotelStore);
  protected loyalty = inject(LoyaltyStore);
  private bookings = inject(BookingStore);
  private router = inject(Router);

  protected c = this.hotels.criteria;
  protected searchOpen = signal(false);
  protected notifOpen = signal(false);
  protected sort = signal<Sort>('location');
  protected readonly sorts: { id: Sort; label: string }[] = [
    { id: 'location', label: 'Joylashuv' },
    { id: 'price', label: 'Narx' },
    { id: 'rating', label: 'Reyting' },
    { id: 'reviews', label: 'Sharhlar' },
  ];
  protected readonly cities = CITIES;
  protected readonly types = PROPERTY_TYPES;
  /** Quick type filter for the popular list (desktop toolbar). */
  protected type = signal<PropertyType | 'all'>('all');
  protected guests = computed(() => guestsOf(this.c()));
  protected badge = computed(() => this.bookings.upcoming().length);

  protected popular = computed(() => {
    const type = this.type();
    const list = this.hotels.hotels().filter((h) => type === 'all' || h.type === type);
    const price = (h: Hotel) => cheapestRoom(h)?.pricePerNight ?? 0;
    const by: Record<Sort, (a: Hotel, b: Hotel) => number> = {
      location: (a, b) => a.distanceToCenterKm - b.distanceToCenterKm,
      price: (a, b) => price(a) - price(b),
      rating: (a, b) => b.rating - a.rating,
      reviews: (a, b) => b.reviewsCount - a.reviewsCount,
    };
    return list.sort(by[this.sort()]);
  });

  openCity(city: City) {
    this.hotels.search({ ...this.c(), query: city.name });
    this.router.navigateByUrl('/results');
  }
}
