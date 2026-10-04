import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../core/state/auth.store';
import { BookingStore } from '../core/state/booking.store';
import { LoyaltyStore } from '../core/state/loyalty.store';
import { NotificationsSheet } from '../features/notifications-sheet';
import { Icon } from './icon';
import { NumPipe } from './pipes';

/** Desktop top navigation. Hidden below the desktop breakpoint (the dock takes over). */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Icon, NumPipe, NotificationsSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'site-header' },
  template: `
    <div class="site-header__inner">
      <a routerLink="/home" class="logo" aria-label="Escape — bosh sahifa">ESCAPE<span class="logo__dot" aria-hidden="true"></span></a>

      <nav aria-label="Asosiy menyu">
        <ul class="site-nav">
          @for (item of items; track item.path) {
            <li>
              <a class="site-nav__link" [routerLink]="item.path" routerLinkActive="is-active"
                #rla="routerLinkActive" [attr.aria-current]="rla.isActive ? 'page' : null">{{ item.label }}</a>
            </li>
          }
        </ul>
      </nav>

      <div class="site-header__end">
        <a routerLink="/bonuses" class="chip chip--sm">
          <app-icon name="gift" [size]="18" /> {{ loyalty.balance() | num }} ball
        </a>
        <button type="button" class="icon-btn" (click)="notifOpen.set(true)"
          [attr.aria-label]="'Bildirishnomalar' + (badge() ? ': ' + badge() + ' ta yangi' : '')">
          <app-icon name="bell" />
          @if (badge()) {
            <span class="badge" aria-hidden="true">{{ badge() }}</span>
          }
        </button>
        <a routerLink="/profile" class="avatar-sm" [attr.aria-label]="'Profil: ' + auth.firstName()">
          {{ auth.firstName().charAt(0).toUpperCase() }}
        </a>
      </div>
    </div>
    <app-notifications-sheet [(open)]="notifOpen" />
  `,
})
export class SiteHeader {
  protected auth = inject(AuthStore);
  protected loyalty = inject(LoyaltyStore);
  private bookings = inject(BookingStore);
  protected notifOpen = signal(false);
  protected badge = computed(() => this.bookings.upcoming().length);
  protected readonly items = [
    { path: '/home', label: 'Asosiy' },
    { path: '/favorites', label: 'Sevimlilar' },
    { path: '/bonuses', label: 'Bonuslar' },
    { path: '/bookings', label: 'Bronlarim' },
  ];
}
