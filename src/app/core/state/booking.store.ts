import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { LocalStayStatusSource } from '../data/local-adapters';
import { BookingRepository, PaymentGateway, StayStatusSource } from '../data/repositories';
import { priceBreakdown } from '../loyalty';
import { Booking, Hotel, PaymentMethod, Room } from '../models';
import { nightsBetween } from '../util/format';
import { AuthStore } from './auth.store';
import { LoyaltyStore } from './loyalty.store';

export interface BookingDraft {
  hotel: Hotel;
  room: Room;
  checkIn: string;
  checkOut: string;
  guests: number;
  usePoints: boolean;
  paymentMethod: PaymentMethod;
}

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private repo = inject(BookingRepository);
  private payments = inject(PaymentGateway);
  private stays = inject(StayStatusSource);
  private auth = inject(AuthStore);
  private loyalty = inject(LoyaltyStore);

  readonly bookings = signal<Booking[]>([]);
  readonly upcoming = computed(() => this.bookings().filter((b) => b.status === 'pending'));
  readonly past = computed(() => this.bookings().filter((b) => b.status !== 'pending'));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) return this.bookings.set([]);
      this.repo.list(user.id).then((list) => {
        this.bookings.set(list);
        this.syncStatuses();
      });
    });
  }

  async book(d: BookingDraft): Promise<{ ok: true; booking: Booking } | { ok: false; error: string }> {
    const user = this.auth.user();
    if (!user) return { ok: false, error: 'Avval tizimga kiring' };
    await this.loyalty.ready();

    const nights = nightsBetween(d.checkIn, d.checkOut);
    if (nights < 1) return { ok: false, error: 'Sanalarni tekshiring' };
    const price = priceBreakdown(nights * d.room.pricePerNight, this.loyalty.balance(), d.usePoints);

    const payment = await this.payments.pay(d.paymentMethod, price.paid, `${d.hotel.id}:${d.room.id}`);
    if (!payment.ok) return { ok: false, error: payment.error ?? 'To‘lov amalga oshmadi' };

    const booking = await this.repo.create({
      userId: user.id,
      hotelId: d.hotel.id,
      roomId: d.room.id,
      checkIn: d.checkIn,
      checkOut: d.checkOut,
      nights,
      guests: d.guests,
      pricePerNight: d.room.pricePerNight,
      subtotal: price.subtotal,
      pointsUsed: price.pointsUsed,
      paid: price.paid,
      pointsEarned: price.pointsEarned,
      paymentMethod: d.paymentMethod,
    });
    await this.loyalty.spend(price.pointsUsed, d.hotel.name, booking.id);
    await this.loyalty.addPending(price.pointsEarned, d.hotel.name, booking.id);
    this.bookings.update((list) => [booking, ...list]);
    await this.syncStatuses();
    return { ok: true, booking };
  }

  /** Pulls stay status (Exely PMS later) and credits points for checked-in guests. */
  async syncStatuses() {
    for (const b of this.bookings().filter((x) => x.status === 'pending')) {
      if (await this.stays.isCheckedIn(b)) await this.complete(b);
    }
  }

  /** Prototype only: simulate the PMS reporting a check-in. */
  async demoCheckIn(b: Booking) {
    if (this.stays instanceof LocalStayStatusSource) this.stays.markCheckedIn(b.id);
    await this.syncStatuses();
  }

  private async complete(b: Booking) {
    const done = await this.repo.update({ ...b, status: 'completed' });
    await this.loyalty.credit(b.id);
    this.bookings.update((list) => list.map((x) => (x.id === b.id ? done : x)));
  }
}
