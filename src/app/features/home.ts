import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CITIES } from '../core/data/mock-data';
import { City, Hotel } from '../core/models';
import { AuthStore } from '../core/state/auth.store';
import { BookingStore } from '../core/state/booking.store';
import { HotelStore, cheapestRoom, guestsOf } from '../core/state/hotel.store';
import { LoyaltyStore } from '../core/state/loyalty.store';
import { addDays, todayIso } from '../core/util/format';
import { Icon } from '../shared/icon';
import { HotelCard } from '../shared/hotel-card';
import { NumPipe, RangePipe } from '../shared/pipes';
import { NotificationsSheet } from './notifications-sheet';
import { SearchSheet } from './search-sheet';

type Sort = 'location' | 'price' | 'rating' | 'reviews';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, Icon, HotelCard, NumPipe, RangePipe, SearchSheet, NotificationsSheet],
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
        <form class="websearch only-desktop" role="search" (ngSubmit)="searchNow()">
          <label class="websearch__seg websearch__seg--grow">
            <span class="websearch__label">Joylashuv</span>
            <input name="q" placeholder="Shahar yoki mehmonxona" autocomplete="off"
              [ngModel]="c().query" (ngModelChange)="hotels.patch({ query: $event })" />
          </label>
          <label class="websearch__seg">
            <span class="websearch__label">Kelish</span>
            <input type="date" name="in" [min]="today" [ngModel]="c().checkIn" (ngModelChange)="setCheckIn($event)" />
          </label>
          <label class="websearch__seg">
            <span class="websearch__label">Ketish</span>
            <input type="date" name="out" [min]="minOut()" [ngModel]="c().checkOut"
              (ngModelChange)="$event && hotels.patch({ checkOut: $event })" />
          </label>
          <button type="button" class="websearch__seg websearch__seg--btn" (click)="searchOpen.set(true)">
            <span class="websearch__label">Mehmonlar va filtrlar</span>
            <span>{{ guests() }} mehmon</span>
          </button>
          <button type="submit" class="btn btn--primary websearch__go">
            <app-icon name="search" [size]="18" /> Qidirish
          </button>
        </form>
      </div>

      <div class="chips-row home__chips" role="radiogroup" aria-label="Saralash">
        @for (s of sorts; track s.id) {
          <button type="button" role="radio" class="chip" [class.is-active]="sort() === s.id"
            [attr.aria-checked]="sort() === s.id" (click)="sort.set(s.id)">
            {{ s.label }} <app-icon name="chevron-down" [size]="16" />
          </button>
        }
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
        <ul class="h-scroll h-scroll--grid">
          @for (h of popular(); track h.id) {
            <li><app-hotel-card [hotel]="h" [guests]="guests()" /></li>
          }
        </ul>
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
  protected readonly today = todayIso();
  protected minOut = computed(() => addDays(this.c().checkIn, 1));
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
  protected guests = computed(() => guestsOf(this.c()));
  protected badge = computed(() => this.bookings.upcoming().length);

  protected popular = computed(() => {
    const list = [...this.hotels.hotels()];
    const price = (h: Hotel) => cheapestRoom(h)?.pricePerNight ?? 0;
    const by: Record<Sort, (a: Hotel, b: Hotel) => number> = {
      location: (a, b) => a.distanceToCenterKm - b.distanceToCenterKm,
      price: (a, b) => price(a) - price(b),
      rating: (a, b) => b.rating - a.rating,
      reviews: (a, b) => b.reviewsCount - a.reviewsCount,
    };
    return list.sort(by[this.sort()]);
  });

  setCheckIn(v: string) {
    if (!v) return;
    const out = this.c().checkOut > v ? this.c().checkOut : addDays(v, 1);
    this.hotels.patch({ checkIn: v, checkOut: out });
  }

  searchNow() {
    this.hotels.search(this.c());
    this.router.navigateByUrl('/results');
  }

  openCity(city: City) {
    this.hotels.search({ ...this.c(), query: city.name });
    this.router.navigateByUrl('/results');
  }
}
