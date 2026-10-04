import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Booking } from '../core/models';
import { BookingStore } from '../core/state/booking.store';
import { HotelStore } from '../core/state/hotel.store';
import { Icon } from '../shared/icon';
import { NumPipe, RangePipe, SumPipe } from '../shared/pipes';

@Component({
  selector: 'app-bookings',
  imports: [RouterLink, Icon, NumPipe, RangePipe, SumPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page page--tabs">
      <header class="page-head">
        <h1 class="h1">Bronlarim</h1>
      </header>

      @if (store.bookings().length) {
        <ul class="v-list v-list--grid">
          @for (b of store.bookings(); track b.id) {
            @let h = hotel(b);
            <li class="booking">
              <a class="booking__link" [routerLink]="['/hotel', b.hotelId]">
                <img class="booking__img" [src]="h?.photos?.[0]" alt="" loading="lazy" />
                <span class="booking__main">
                  <span class="booking__name">{{ h?.name }}</span>
                  <span class="meta">{{ room(b) }} · {{ b.checkIn | range: b.checkOut }} · {{ b.guests }} mehmon</span>
                  <span class="booking__total">{{ b.paid | sum }}</span>
                </span>
              </a>
              <div class="booking__foot">
                @if (b.status === 'pending') {
                  <span class="pill pill--soft">Kutilmoqda · +{{ b.pointsEarned | num }} ball</span>
                  <button type="button" class="link-btn meta" (click)="store.demoCheckIn(b)"
                    title="Prototip: PMS joylashuv holatini yuborishini taqlid qiladi">Demo: joylashdim</button>
                } @else if (b.status === 'completed') {
                  <span class="pill pill--dark">Yakunlandi</span>
                  <span class="meta">+{{ b.pointsEarned | num }} ball hisoblandi</span>
                } @else {
                  <span class="pill pill--soft">Bekor qilingan</span>
                }
              </div>
            </li>
          }
        </ul>
      } @else {
        <div class="empty">
          <app-icon name="luggage" [size]="28" />
          <h2 class="h3">Hali bron yo‘q</h2>
          <p class="muted">Mehmonxona tanlang va birinchi broningiz uchun ball oling</p>
          <a class="btn btn--primary" routerLink="/home">Mehmonxona tanlash</a>
        </div>
      }
    </main>
  `,
})
export class Bookings {
  protected store = inject(BookingStore);
  private hotels = inject(HotelStore);
  private map = computed(() => new Map(this.hotels.hotels().map((h) => [h.id, h])));

  hotel(b: Booking) {
    return this.map().get(b.hotelId);
  }

  room(b: Booking) {
    return this.hotel(b)?.rooms.find((r) => r.id === b.roomId)?.name ?? '';
  }
}
