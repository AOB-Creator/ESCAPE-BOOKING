import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../core/state/auth.store';
import { BookingStore } from '../core/state/booking.store';
import { LoyaltyStore } from '../core/state/loyalty.store';
import { ThemeMode, ThemeStore } from '../core/state/theme.store';
import { formatPhone } from '../core/util/format';
import { BottomSheet } from '../shared/bottom-sheet';
import { Icon } from '../shared/icon';
import { NumPipe } from '../shared/pipes';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, BottomSheet, Icon, NumPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page page--tabs page--narrow">
      <header class="page-head">
        <h1 class="h1">Profil</h1>
      </header>

      @if (auth.user(); as u) {
        <section class="profile-head">
          <span class="avatar" aria-hidden="true">{{ u.name.charAt(0).toUpperCase() }}</span>
          <div>
            <p class="profile-head__name">{{ u.name }}</p>
            <p class="meta">{{ phone(u.phone) }}</p>
          </div>
        </section>

        <ul class="list-card">
          <li>
            <button type="button" class="list-row" (click)="startEdit(u.name)">
              <span class="list-row__icon"><app-icon name="edit" [size]="18" /></span>
              <span class="list-row__main">Ismni o‘zgartirish</span>
              <app-icon name="chevron-right" [size]="18" class="muted" />
            </button>
          </li>
          <li>
            <a class="list-row" routerLink="/bookings">
              <span class="list-row__icon"><app-icon name="luggage" [size]="18" /></span>
              <span class="list-row__main">Bronlarim</span>
              <span class="meta">{{ bookings.bookings().length }}</span>
              <app-icon name="chevron-right" [size]="18" class="muted" />
            </a>
          </li>
          <li>
            <a class="list-row" routerLink="/bonuses">
              <span class="list-row__icon"><app-icon name="gift" [size]="18" /></span>
              <span class="list-row__main">Bonuslar</span>
              <span class="meta">{{ loyalty.balance() | num }} ball · {{ loyalty.progress().tier.name }}</span>
              <app-icon name="chevron-right" [size]="18" class="muted" />
            </a>
          </li>
        </ul>

        <section class="section" aria-labelledby="theme-h">
          <h2 class="section__title" id="theme-h">Ko‘rinish</h2>
          <div class="chip-wrap" role="radiogroup" aria-labelledby="theme-h">
            @for (m of modes; track m.id) {
              <button type="button" role="radio" class="chip" [class.is-active]="theme.mode() === m.id"
                [attr.aria-checked]="theme.mode() === m.id" (click)="theme.mode.set(m.id)">{{ m.label }}</button>
            }
          </div>
        </section>

        <ul class="list-card">
          <li>
            <button type="button" class="list-row" (click)="signOut()">
              <span class="list-row__icon"><app-icon name="logout" [size]="18" /></span>
              <span class="list-row__main">Chiqish</span>
            </button>
          </li>
        </ul>
      }
    </main>

    <app-bottom-sheet [(open)]="editing" title="Ismni o‘zgartirish">
      <form id="name-form" class="stack" (ngSubmit)="save()">
        <label class="field">
          <span class="field__label">Ism</span>
          <input class="input" name="name" autocomplete="given-name" [(ngModel)]="draft" required />
        </label>
      </form>
      <div sheet-footer class="sheet__footer">
        <button type="submit" form="name-form" class="btn btn--primary btn--block" [disabled]="draft.trim().length < 2">Saqlash</button>
      </div>
    </app-bottom-sheet>
  `,
  styles: `
    .profile-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
    .profile-head p { margin: 0; }
    .profile-head__name { font-size: 18px; font-weight: 500; }
    .avatar { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%;
      background: var(--text); color: var(--bg); font-size: 22px; font-weight: 500; }
    .list-card + .section, .section + .list-card { margin-top: 22px; }
  `,
})
export class Profile {
  protected auth = inject(AuthStore);
  protected bookings = inject(BookingStore);
  protected loyalty = inject(LoyaltyStore);
  protected theme = inject(ThemeStore);
  private router = inject(Router);
  protected editing = signal(false);
  protected draft = '';
  protected readonly modes: { id: ThemeMode; label: string }[] = [
    { id: 'system', label: 'Tizim' },
    { id: 'light', label: 'Yorug‘' },
    { id: 'dark', label: 'Qorong‘i' },
  ];

  phone(p: string) {
    return formatPhone(p);
  }

  startEdit(name: string) {
    this.draft = name;
    this.editing.set(true);
  }

  async save() {
    await this.auth.rename(this.draft);
    this.editing.set(false);
  }

  signOut() {
    this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
