import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CITY_NAMES } from '../core/data/mock-data';
import { pointsForPayment } from '../core/loyalty';
import { Room } from '../core/models';
import { FavoritesStore } from '../core/state/favorites.store';
import { HotelStore, cheapestRoom, guestsOf } from '../core/state/hotel.store';
import { ToastStore } from '../core/state/toast.store';
import { addDays, nightsBetween, todayIso } from '../core/util/format';
import { Icon } from '../shared/icon';
import { NumPipe, SumPipe } from '../shared/pipes';
import { SiteHeader } from '../shared/site-header';
import { Stepper } from '../shared/stepper';
import { BookingSheet } from './booking-sheet';

@Component({
  selector: 'app-hotel-detail',
  imports: [FormsModule, Icon, SumPipe, NumPipe, BookingSheet, SiteHeader, Stepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    @if (hotel(); as h) {
      <main class="detail">
        <div class="hero only-mobile">
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

        <div class="detail__wrap">
        <div class="detail-top only-desktop">
          <button type="button" class="back-link" (click)="back()">
            <app-icon name="chevron-left" [size]="18" /> Orqaga
          </button>
          <div class="detail-top__row">
            <div>
              <h1 class="h1 detail-top__title">{{ h.name }}</h1>
              <p class="muted detail-top__meta">
                <app-icon name="star" [size]="16" class="filled star" /> {{ h.rating.toFixed(2) }} · {{ h.reviewsCount }} sharh ·
                {{ place() }}, O‘zbekiston · {{ h.ownership === 'own' ? 'Marmaris tarmog‘i' : 'Hamkor mehmonxona' }}
              </p>
            </div>
            <span class="hero__right">
              <button type="button" class="chip fav-btn" [class.is-active]="isFav()" [attr.aria-pressed]="isFav()"
                (click)="favorites.toggle(h.id)">
                <app-icon name="heart" [size]="18" [class.filled]="isFav()" /> {{ isFav() ? 'Saqlangan' : 'Saqlash' }}
              </button>
              <button type="button" class="chip" (click)="share()">
                <app-icon name="share" [size]="18" /> Ulashish
              </button>
            </span>
          </div>
        </div>

        <ul class="gallery only-desktop" aria-label="Rasmlar">
          @for (p of h.photos; track $index; let i = $index; let last = $last) {
            <li class="gallery__item" [class.thumb--more]="last">
              <img [src]="p" [alt]="i === 0 ? h.name + ' binosi' : ''" />
              @if (last) {
                <span>+{{ h.photosTotal - h.photos.length + 1 }} rasm</span>
              }
            </li>
          }
        </ul>

        <div class="detail__grid">
        <article class="detail__sheet">
          <div class="detail__head only-mobile">
            <h1 class="h2">{{ h.name }}</h1>
            @if (room(); as r) {
              <p class="detail__price"><span class="price-lg">{{ r.pricePerNight | sum }}</span><span class="muted">/kecha</span></p>
            }
          </div>
          <p class="muted detail__loc only-mobile">{{ place() }}, O‘zbekiston · {{ h.ownership === 'own' ? 'Marmaris tarmog‘i' : 'Hamkor mehmonxona' }}</p>
          <p class="pill pill--soft points-pill only-mobile">
            <app-icon name="gift" [size]="16" /> Bu bron uchun +{{ points() | num }} ball
          </p>

          <ul class="thumbs only-mobile" aria-label="Rasmlar">
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

        <aside class="book-card only-desktop" aria-label="Bron qilish">
          @if (room(); as r) {
            <p class="book-card__price"><span class="price-lg">{{ r.pricePerNight | sum }}</span><span class="muted"> / kecha</span></p>
            <p class="meta">{{ r.name }} · {{ r.areaM2 }} m²</p>
          }
          <div class="split book-card__dates">
            <label class="split__half split__half--labeled">
              <span class="websearch__label">Kelish</span>
              <input type="date" name="d-in" [min]="today" [ngModel]="store.criteria().checkIn" (ngModelChange)="setCheckIn($event)" />
            </label>
            <label class="split__half split__half--labeled">
              <span class="websearch__label">Ketish</span>
              <input type="date" name="d-out" [min]="minOut()" [ngModel]="store.criteria().checkOut" (ngModelChange)="setCheckOut($event)" />
            </label>
          </div>
          <div class="grid-2">
            <div class="field">
              <span class="field__label field__label--sm">Kattalar</span>
              <app-stepper label="Kattalar" [min]="1" [max]="8" [value]="store.criteria().adults" (valueChange)="store.patch({ adults: $event })" />
            </div>
            <div class="field">
              <span class="field__label field__label--sm">Bolalar</span>
              <app-stepper label="Bolalar" [min]="0" [max]="6" [value]="store.criteria().children" (valueChange)="store.patch({ children: $event })" />
            </div>
          </div>
          @if (room(); as r) {
            <dl class="book-card__rows">
              <div><dt>{{ nights() }} kecha × {{ r.pricePerNight | sum }}</dt><dd>{{ total() | sum }}</dd></div>
              <div class="book-card__total"><dt>Jami</dt><dd>{{ total() | sum }}</dd></div>
            </dl>
          } @else {
            <p class="error">{{ guests() }} mehmonga mos xona yo‘q</p>
          }
          <button type="button" class="btn btn--primary btn--block" [disabled]="!room()" (click)="bookOpen.set(true)">Bron qilish</button>
          <p class="meta book-card__note"><app-icon name="gift" [size]="16" /> Joylashgach +{{ points() | num }} ball</p>
        </aside>
        </div>
        </div>

        <div class="bookbar only-mobile">
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
  protected readonly today = todayIso();
  protected minOut = computed(() => addDays(this.store.criteria().checkIn, 1));
  protected expanded = signal(false);
  protected bookOpen = signal(false);

  constructor() {
    effect(() => {
      this.id();
      this.roomId.set(null);
    });
  }

  setCheckIn(v: string) {
    if (!v) return;
    const out = this.store.criteria().checkOut > v ? this.store.criteria().checkOut : addDays(v, 1);
    this.store.patch({ checkIn: v, checkOut: out });
  }

  setCheckOut(v: string) {
    if (v && v > this.store.criteria().checkIn) this.store.patch({ checkOut: v });
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
