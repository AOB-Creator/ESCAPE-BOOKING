import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { CITY_NAMES } from '../core/data/mock-data';
import { pointsForPayment } from '../core/loyalty';
import { Room } from '../core/models';
import { FavoritesStore } from '../core/state/favorites.store';
import { HotelStore, cheapestRoom, guestsOf } from '../core/state/hotel.store';
import { ToastStore } from '../core/state/toast.store';
import { nightsBetween } from '../core/util/format';
import { Icon } from '../shared/icon';
import { NumPipe, SumPipe } from '../shared/pipes';
import { BookingSheet } from './booking-sheet';

@Component({
  selector: 'app-hotel-detail',
  imports: [Icon, SumPipe, NumPipe, BookingSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hotel(); as h) {
      <main class="detail">
        <div class="hero">
          <img [src]="h.photos[0]" [alt]="h.name + ' binosi'" class="hero__img" />
          <div class="hero__actions">
            <button type="button" class="icon-btn icon-btn--lg" aria-label="Orqaga" (click)="back()">
              <app-icon name="chevron-left" [size]="22" />
            </button>
            <span class="hero__right">
              <button type="button" class="icon-btn icon-btn--lg fav-btn" [class.is-active]="isFav()"
                [attr.aria-pressed]="isFav()" [attr.aria-label]="isFav() ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'"
                (click)="favorites.toggle(h.id)">
                <app-icon name="heart" [size]="22" [class.filled]="isFav()" />
              </button>
              <button type="button" class="icon-btn icon-btn--lg" aria-label="Ulashish" (click)="share()">
                <app-icon name="share" [size]="20" />
              </button>
            </span>
          </div>
        </div>

        <article class="detail__sheet">
          <div class="detail__head">
            <h1 class="h2">{{ h.name }}</h1>
            @if (room(); as r) {
              <p class="detail__price"><span class="price-lg">{{ r.pricePerNight | sum }}</span><span class="muted">/kecha</span></p>
            }
          </div>
          <p class="muted detail__loc">{{ place() }}, O‘zbekiston · {{ h.ownership === 'own' ? 'Marmaris tarmog‘i' : 'Hamkor mehmonxona' }}</p>
          <p class="pill pill--soft points-pill">
            <app-icon name="gift" [size]="16" /> Bu bron uchun +{{ points() | num }} ball
          </p>

          <ul class="thumbs" aria-label="Rasmlar">
            @for (p of h.photos; track $index; let last = $last) {
              <li class="thumb" [class.thumb--more]="last">
                <img [src]="p" alt="" loading="lazy" />
                @if (last) {
                  <span>+{{ h.photosTotal - h.photos.length + 1 }}</span>
                }
              </li>
            }
          </ul>

          <section class="section" aria-labelledby="rooms-h">
            <h2 class="section__title" id="rooms-h">Xonalar</h2>
            <div class="rooms" role="radiogroup" aria-labelledby="rooms-h">
              @for (r of h.rooms; track r.id) {
                @let fits = r.maxGuests >= guests();
                <button type="button" role="radio" class="room" [class.is-active]="room()?.id === r.id"
                  [attr.aria-checked]="room()?.id === r.id" [disabled]="!fits" (click)="roomId.set(r.id)">
                  <span class="room__name">{{ r.name }}</span>
                  <span class="meta">{{ fits ? r.maxGuests + ' kishigacha' : 'Faqat ' + r.maxGuests + ' kishi uchun' }} · {{ r.areaM2 }} m²</span>
                  <span class="room__price">{{ r.pricePerNight | sum }}</span>
                </button>
              }
            </div>
          </section>

          @if (room(); as r) {
            <section class="section" aria-labelledby="details-h">
              <h2 class="section__title" id="details-h">Xona tafsilotlari</h2>
              <ul class="facts">
                <li class="fact"><app-icon name="area" [size]="16" /> {{ r.areaM2 }} m²</li>
                <li class="fact"><app-icon name="user" [size]="16" /> {{ r.maxGuests }} mehmon</li>
                <li class="fact"><app-icon name="bath" [size]="16" /> {{ r.baths }} hammom</li>
                <li class="fact"><app-icon name="bed" [size]="16" /> {{ r.beds }} karavot</li>
              </ul>
              <p class="desc" [class.desc--clamped]="!expanded()" id="desc">{{ h.description }}</p>
              <button type="button" class="link-btn" aria-controls="desc" [attr.aria-expanded]="expanded()"
                (click)="expanded.set(!expanded())">{{ expanded() ? 'Yopish' : 'Batafsil' }}</button>
            </section>
          }

          <section class="section" aria-labelledby="rating-h">
            <h2 class="section__title" id="rating-h">Reyting va sharhlar</h2>
            <p class="big-rating">
              <app-icon name="star" [size]="22" class="filled star" />
              <span>{{ h.rating.toFixed(2) }}</span>
              <span class="muted">· {{ h.reviewsCount }} sharh</span>
            </p>
            <dl class="bars">
              @for (row of ratingRows(); track row.label) {
                <div class="bars__row">
                  <dt>{{ row.label }}</dt>
                  <dd>
                    <span class="bars__track" aria-hidden="true"><span [style.width.%]="row.value * 20"></span></span>
                    <span>{{ row.value.toFixed(1) }}</span>
                  </dd>
                </div>
              }
            </dl>
          </section>
        </article>

        <div class="bookbar">
          <div>
            <p class="bookbar__total">{{ total() | sum }}</p>
            <p class="meta">{{ guests() }} mehmon · {{ nights() }} kecha</p>
          </div>
          <button type="button" class="btn btn--primary" [disabled]="!room()" (click)="bookOpen.set(true)">Bron qilish</button>
        </div>
      </main>

      @if (room(); as r) {
        <app-booking-sheet [(open)]="bookOpen" [hotel]="h" [room]="r" />
      }
    } @else if (store.hotels().length) {
      <main class="page">
        <div class="empty">
          <h1 class="h3">Mehmonxona topilmadi</h1>
          <button type="button" class="btn btn--primary" (click)="back()">Orqaga qaytish</button>
        </div>
      </main>
    }
  `,
})
export class HotelDetail {
  readonly id = input.required<string>();
  protected store = inject(HotelStore);
  protected favorites = inject(FavoritesStore);
  private toast = inject(ToastStore);
  private location = inject(Location);
  private router = inject(Router);

  protected hotel = computed(() => this.store.hotels().find((h) => h.id === this.id()));
  protected guests = computed(() => guestsOf(this.store.criteria()));
  protected nights = computed(() => {
    const c = this.store.criteria();
    return Math.max(1, nightsBetween(c.checkIn, c.checkOut));
  });
  protected roomId = signal<string | null>(null);
  protected room = computed<Room | undefined>(() => {
    const h = this.hotel();
    if (!h) return undefined;
    return h.rooms.find((r) => r.id === this.roomId()) ?? cheapestRoom(h, this.guests());
  });
  protected total = computed(() => (this.room()?.pricePerNight ?? 0) * this.nights());
  protected points = computed(() => pointsForPayment(this.total()));
  protected isFav = computed(() => this.favorites.ids().includes(this.id()));
  protected place = computed(() => {
    const h = this.hotel();
    if (!h) return '';
    const city = CITY_NAMES[h.city];
    return h.district === city ? city : `${h.district}, ${city}`;
  });
  protected ratingRows = computed(() => {
    const r = this.hotel()?.ratings;
    if (!r) return [];
    return [
      { label: 'Muloqot', value: r.communication },
      { label: 'Tozalik', value: r.cleanliness },
      { label: 'Joylashuv', value: r.location },
      { label: 'Narx/sifat', value: r.value },
    ];
  });
  protected expanded = signal(false);
  protected bookOpen = signal(false);

  constructor() {
    effect(() => {
      this.id();
      this.roomId.set(null);
    });
  }

  back() {
    if (history.length > 1) this.location.back();
    else this.router.navigateByUrl('/home');
  }

  async share() {
    const h = this.hotel();
    if (!h) return;
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: h.name, url });
      else {
        await navigator.clipboard.writeText(url);
        this.toast.show('Havola nusxalandi');
      }
    } catch {
      /* user cancelled */
    }
  }
}
