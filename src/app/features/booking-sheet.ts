import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MAX_REDEEM_SHARE, priceBreakdown } from '../core/loyalty';
import { Booking, Hotel, PaymentMethod, Room } from '../core/models';
import { BookingStore } from '../core/state/booking.store';
import { HotelStore, guestsOf } from '../core/state/hotel.store';
import { LoyaltyStore } from '../core/state/loyalty.store';
import { addDays, nightsBetween, todayIso } from '../core/util/format';
import { BottomSheet } from '../shared/bottom-sheet';
import { Icon } from '../shared/icon';
import { NumPipe, SumPipe } from '../shared/pipes';
import { Toggle } from '../shared/toggle';

@Component({
  selector: 'app-booking-sheet',
  imports: [FormsModule, BottomSheet, Icon, SumPipe, NumPipe, Toggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-bottom-sheet [(open)]="open" [title]="done() ? '' : 'Bronni tasdiqlash'" label="Bron tasdiqlandi">
      @if (!done()) {
        <div class="stack">
          <div class="bk-hotel">
            <img [src]="hotel().photos[0]" alt="" class="bk-hotel__img" />
            <div>
              <p class="bk-hotel__name">{{ hotel().name }}</p>
              <p class="meta">{{ room().name }} · {{ room().areaM2 }} m²</p>
            </div>
          </div>

          <dl class="rows">
            <div class="rows__row">
              <dt><label for="bk-in">Kelish</label></dt>
              <dd><input id="bk-in" type="date" class="date-inline" [min]="today" [ngModel]="checkIn()" (ngModelChange)="setCheckIn($event)" /></dd>
            </div>
            <div class="rows__row">
              <dt><label for="bk-out">Ketish</label></dt>
              <dd><input id="bk-out" type="date" class="date-inline" [min]="minOut()" [ngModel]="checkOut()" (ngModelChange)="setCheckOut($event)" /></dd>
            </div>
            <div class="rows__row"><dt>Mehmonlar</dt><dd>{{ guests() }} kishi</dd></div>
            <div class="rows__row"><dt>{{ nights() }} kecha × {{ room().pricePerNight | sum }}</dt><dd>{{ price().subtotal | sum }}</dd></div>
          </dl>

          <div class="points-box">
            <div class="points-box__row">
              <div>
                <p id="pts-l">Ball bilan to‘lash</p>
                <p class="meta">
                  Balansda {{ loyalty.balance() | num }} ball · ko‘pi bilan {{ sharePct }}%
                </p>
              </div>
              <app-toggle [(checked)]="usePoints" label="Ball bilan to‘lash" [disabled]="!canRedeem()" />
            </div>
            @if (usePoints() && price().pointsUsed) {
              <p class="meta points-box__used">−{{ price().pointsUsed | num }} ball = −{{ price().discount | sum }}</p>
            }
          </div>

          <div class="total-row">
            <span>Jami</span>
            <span class="price-lg">{{ price().paid | sum }}</span>
          </div>
          <p class="meta earn-note">Joylashganingizdan keyin +{{ price().pointsEarned | num }} ball beriladi</p>

          <fieldset class="field">
            <legend class="field__label">To‘lov usuli</legend>
            <div class="chip-wrap" role="radiogroup" aria-label="To‘lov usuli">
              @for (m of methods; track m.id) {
                <button type="button" role="radio" class="chip" [class.is-active]="method() === m.id"
                  [attr.aria-checked]="method() === m.id" (click)="method.set(m.id)">{{ m.label }}</button>
              }
            </div>
          </fieldset>
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
        </div>
      } @else if (done(); as b) {
        <div class="success" role="status">
          <span class="success__icon"><app-icon name="check" [size]="34" [stroke]="2" /></span>
          <h2 class="h2">Bron tasdiqlandi</h2>
          <p class="muted">
            {{ hotel().name }}, {{ b.nights }} kecha. Joylashganingizdan keyin
            {{ b.pointsEarned | num }} ball hisobingizga tushadi.
          </p>
        </div>
      }

      <div sheet-footer class="sheet__footer">
        @if (!done()) {
          <button type="button" class="btn btn--primary btn--block" [disabled]="busy() || nights() < 1" (click)="pay()">
            {{ busy() ? 'To‘lanmoqda…' : (price().paid | sum) + ' to‘lash' }}
          </button>
        } @else {
          <button type="button" class="btn btn--outline" (click)="open.set(false)">Yopish</button>
          <button type="button" class="btn btn--primary" (click)="goBookings()">Bronlarim</button>
        }
      </div>
    </app-bottom-sheet>
  `,
  styles: `
    .bk-hotel { display: flex; gap: 12px; align-items: center; }
    .bk-hotel__img { width: 64px; height: 64px; border-radius: 14px; object-fit: cover; background: var(--soft); }
    .bk-hotel__name { margin: 0 0 2px; font-weight: 500; }
    .date-inline { border: 0; background: none; color: inherit; font: inherit; text-align: right; padding: 0; }
    .points-box { background: var(--soft); border-radius: 22px; padding: 14px 16px; }
    .points-box__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .points-box__row p { margin: 0; }
    .points-box__used { margin: 8px 0 0; }
    .total-row { display: flex; justify-content: space-between; align-items: baseline; font-weight: 500; }
    .earn-note { margin: -8px 0 0; }
    .success { text-align: center; padding: 18px 8px 8px; }
    .success__icon { display: inline-grid; place-items: center; width: 76px; height: 76px; border-radius: 50%;
      background: var(--text); color: var(--bg); margin-bottom: 16px; }
    .success .h2 { margin: 0 0 8px; }
  `,
})
export class BookingSheet {
  readonly open = model(false);
  readonly hotel = input.required<Hotel>();
  readonly room = input.required<Room>();

  protected loyalty = inject(LoyaltyStore);
  private hotels = inject(HotelStore);
  private bookings = inject(BookingStore);
  private router = inject(Router);

  protected readonly today = todayIso();
  protected readonly sharePct = MAX_REDEEM_SHARE * 100;
  protected readonly methods: { id: PaymentMethod; label: string }[] = [
    { id: 'payme', label: 'Payme' },
    { id: 'click', label: 'Click' },
    { id: 'uzum', label: 'Uzum' },
    { id: 'card', label: 'Uzcard/Humo' },
  ];

  protected checkIn = computed(() => this.hotels.criteria().checkIn);
  protected checkOut = computed(() => this.hotels.criteria().checkOut);
  protected minOut = computed(() => addDays(this.checkIn(), 1));
  protected guests = computed(() => guestsOf(this.hotels.criteria()));
  protected nights = computed(() => nightsBetween(this.checkIn(), this.checkOut()));
  protected usePoints = signal(false);
  protected method = signal<PaymentMethod>('payme');
  protected busy = signal(false);
  protected done = signal<Booking | null>(null);
  protected error = signal('');
  protected price = computed(() =>
    priceBreakdown(this.nights() * this.room().pricePerNight, this.loyalty.balance(), this.usePoints()),
  );
  protected canRedeem = computed(() => priceBreakdown(this.price().subtotal, this.loyalty.balance(), true).pointsUsed > 0);

  constructor() {
    effect(() => {
      if (this.open()) untracked(() => {
        this.done.set(null);
        this.error.set('');
        this.usePoints.set(false);
      });
    });
  }

  setCheckIn(v: string) {
    if (!v) return;
    const out = this.checkOut() > v ? this.checkOut() : addDays(v, 1);
    this.hotels.patch({ checkIn: v, checkOut: out });
  }

  setCheckOut(v: string) {
    if (v && v > this.checkIn()) this.hotels.patch({ checkOut: v });
  }

  async pay() {
    this.busy.set(true);
    this.error.set('');
    const res = await this.bookings.book({
      hotel: this.hotel(),
      room: this.room(),
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      guests: this.guests(),
      usePoints: this.usePoints(),
      paymentMethod: this.method(),
    });
    this.busy.set(false);
    if (res.ok) this.done.set(res.booking);
    else this.error.set(res.error);
  }

  goBookings() {
    this.open.set(false);
    this.router.navigateByUrl('/bookings');
  }
}
