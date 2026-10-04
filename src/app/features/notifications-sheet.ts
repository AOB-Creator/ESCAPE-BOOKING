import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingStore } from '../core/state/booking.store';
import { HotelStore } from '../core/state/hotel.store';
import { LoyaltyStore } from '../core/state/loyalty.store';
import { BottomSheet } from '../shared/bottom-sheet';
import { NumPipe, RangePipe } from '../shared/pipes';

@Component({
  selector: 'app-notifications-sheet',
  imports: [BottomSheet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-bottom-sheet [(open)]="open" title="Bildirishnomalar">
      @if (items().length) {
        <ul class="list-card">
          @for (n of items(); track n.id) {
            <li>
              <a class="list-row" [routerLink]="n.link" (click)="open.set(false)">
                <span class="list-row__main">
                  <span>{{ n.title }}</span>
                  <span class="meta">{{ n.meta }}</span>
                </span>
              </a>
            </li>
          }
        </ul>
      } @else {
        <p class="muted empty-note">Hozircha yangi xabar yo‘q</p>
      }
    </app-bottom-sheet>
  `,
  styles: `.empty-note { text-align: center; padding: 24px 0 32px; }`,
})
export class NotificationsSheet {
  readonly open = model(false);
  private bookings = inject(BookingStore);
  private hotels = inject(HotelStore);
  private loyalty = inject(LoyaltyStore);
  private num = new NumPipe();
  private range = new RangePipe();

  protected items = computed(() => [
    ...this.bookings.upcoming().map((b) => ({
      id: b.id,
      title: `Bron tasdiqlandi: ${this.hotels.hotels().find((h) => h.id === b.hotelId)?.name ?? ''}`,
      meta: `${this.range.transform(b.checkIn, b.checkOut)} · joylashgach +${this.num.transform(b.pointsEarned)} ball`,
      link: '/bookings',
    })),
    ...this.loyalty
      .account()
      .history.filter((e) => e.kind === 'earned' || e.kind === 'bonus')
      .slice(0, 3)
      .map((e) => ({ id: e.id, title: `+${this.num.transform(e.points)} ball hisobingizga tushdi`, meta: e.title, link: '/bonuses' })),
  ]);
}
