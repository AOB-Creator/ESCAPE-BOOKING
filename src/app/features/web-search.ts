import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CITIES } from '../core/data/mock-data';
import { City } from '../core/models';
import { HotelStore, PRICE_MAX, PRICE_MIN, guestsOf } from '../core/state/hotel.store';
import { addDays, formatDayDate, nightsBetween, todayIso } from '../core/util/format';
import { Icon } from '../shared/icon';
import { Stepper } from '../shared/stepper';
import { SearchSheet } from './search-sheet';

type Popover = 'where' | 'guests' | null;

/** Desktop inline search: location suggestions, date pickers, guests popover, filters dialog. */
@Component({
  selector: 'app-web-search',
  imports: [FormsModule, Icon, Stepper, SearchSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:pointerdown)': 'onOutside($event)',
    '(keydown.escape)': 'pop.set(null)',
  },
  template: `
    <form class="ws" role="search" aria-label="Mehmonxona qidirish" (ngSubmit)="search()">
      <!-- Where -->
      <div class="ws__seg ws__seg--where" [class.is-open]="pop() === 'where'" (focusout)="onWhereBlur($event)">
        <span class="ws__icon" aria-hidden="true"><app-icon name="map-pin" [size]="18" /></span>
        <label class="ws__text">
          <span class="ws__label">Qayerga</span>
          <input name="q" placeholder="Shahar yoki nom" autocomplete="off" role="combobox"
            aria-controls="ws-where-list" [attr.aria-expanded]="pop() === 'where'"
            [ngModel]="c().query" (ngModelChange)="store.patch({ query: $event })" (focus)="pop.set('where')" />
        </label>
        @if (c().query) {
          <button type="button" class="ws__clear" aria-label="Joylashuvni tozalash" (click)="store.patch({ query: '' })">
            <app-icon name="x" [size]="16" />
          </button>
        }
        @if (pop() === 'where') {
          <div class="ws__pop ws__pop--where" id="ws-where-list" role="listbox" aria-label="Shaharlar">
            <p class="ws__pop-title">Mashhur yo‘nalishlar</p>
            @for (city of cities(); track city.id) {
              <button type="button" role="option" class="ws__city" [attr.aria-selected]="c().query === city.name"
                (click)="pickCity(city)">
                <img [src]="city.photo" alt="" class="ws__city-img" />
                <span class="ws__city-text">
                  <span>{{ city.name }}</span>
                  <span class="meta">{{ city.count }} ta mehmonxona</span>
                </span>
                @if (c().query === city.name) {
                  <app-icon name="check" [size]="18" />
                }
              </button>
            }
          </div>
        }
      </div>

      <!-- Dates -->
      <div class="ws__dates">
        <div class="ws__seg ws__seg--date" (click)="openPicker(inEl)">
          <span class="ws__icon" aria-hidden="true"><app-icon name="calendar" [size]="18" /></span>
          <span class="ws__text">
            <span class="ws__label">Kelish</span>
            <span class="ws__value">{{ day(c().checkIn) }}</span>
          </span>
          <input #inEl type="date" class="ws__native" name="in" aria-label="Kelish sanasi" [min]="today"
            [ngModel]="c().checkIn" (ngModelChange)="setCheckIn($event)" />
        </div>
        <span class="ws__nights" aria-hidden="true">{{ nights() }} kecha</span>
        <div class="ws__seg ws__seg--date" (click)="openPicker(outEl)">
          <span class="ws__text">
            <span class="ws__label">Ketish</span>
            <span class="ws__value">{{ day(c().checkOut) }}</span>
          </span>
          <input #outEl type="date" class="ws__native" name="out" aria-label="Ketish sanasi" [min]="minOut()"
            [ngModel]="c().checkOut" (ngModelChange)="$event && store.patch({ checkOut: $event })" />
        </div>
      </div>

      <!-- Guests -->
      <div class="ws__seg-wrap">
        <button type="button" class="ws__seg ws__seg--btn" [class.is-open]="pop() === 'guests'"
          aria-haspopup="dialog" [attr.aria-expanded]="pop() === 'guests'" (click)="toggle('guests')">
          <span class="ws__icon" aria-hidden="true"><app-icon name="users" [size]="18" /></span>
          <span class="ws__text">
            <span class="ws__label">Mehmonlar</span>
            <span class="ws__value">{{ guestsText() }}</span>
          </span>
          <app-icon name="chevron-down" [size]="16" class="ws__chev" />
        </button>
        @if (pop() === 'guests') {
          <div class="ws__pop ws__pop--guests" role="dialog" aria-label="Mehmonlar soni">
            <div class="ws__row">
              <span><span class="ws__row-title">Kattalar</span><span class="meta">13 yoshdan katta</span></span>
              <app-stepper label="Kattalar" [min]="1" [max]="8" [value]="c().adults" (valueChange)="store.patch({ adults: $event })" />
            </div>
            <div class="ws__row">
              <span><span class="ws__row-title">Bolalar</span><span class="meta">2–12 yosh</span></span>
              <app-stepper label="Bolalar" [min]="0" [max]="6" [value]="c().children" (valueChange)="store.patch({ children: $event })" />
            </div>
            <button type="button" class="btn btn--primary btn--block ws__done" (click)="pop.set(null)">Tayyor</button>
          </div>
        }
      </div>

      <button type="button" class="ws__filters" (click)="filtersOpen.set(true)"
        [attr.aria-label]="'Narx va joy turi filtrlari' + (activeFilters() ? ': ' + activeFilters() + ' ta faol' : '')">
        <app-icon name="sliders" [size]="20" />
        @if (activeFilters()) {
          <span class="ws__badge" aria-hidden="true">{{ activeFilters() }}</span>
        }
      </button>

      <button type="submit" class="btn btn--primary ws__go">
        <app-icon name="search" [size]="18" /> Qidirish
      </button>
    </form>

    <app-search-sheet [(open)]="filtersOpen" />
  `,
  styles: `
    :host { display: block; }
    .ws { position: relative; display: flex; align-items: center; gap: 4px; padding: 8px;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-pill); }
    .ws__seg { position: relative; display: flex; align-items: center; gap: 12px; height: 64px; padding: 0 18px 0 10px;
      border: 0; border-radius: var(--r-pill); background: none; text-align: left; min-width: 0; cursor: pointer; }
    .ws__seg:hover, .ws__seg.is-open { background: var(--soft); }
    .ws__seg:focus-within { background: var(--soft); outline: 2px solid var(--focus); outline-offset: -2px; }
    .ws__seg--where { flex: 1.1; cursor: text; }
    .ws__seg-wrap { position: relative; flex: 1.1; min-width: 0; }
    .ws__seg-wrap .ws__seg { width: 100%; }
    .ws__icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
      background: var(--soft); flex-shrink: 0; }
    .ws__seg:hover .ws__icon, .ws__seg.is-open .ws__icon, .ws__seg:focus-within .ws__icon { background: var(--surface); }
    .ws__text { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
    .ws__label { font-size: 12.5px; color: var(--muted); }
    .ws__value { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ws__text input { border: 0; outline: 0; padding: 0; background: none; width: 100%; min-width: 0; font-size: 15px; }
    .ws__text input::placeholder { color: var(--muted); }
    .ws__clear { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 0;
      background: var(--border); color: var(--text); flex-shrink: 0; }
    .ws__chev { color: var(--muted); }

    .ws__dates { position: relative; display: flex; flex: 1.8; min-width: 0; }
    .ws__seg--date { flex: 1; }
    .ws__dates .ws__seg--date ~ .ws__seg--date { padding-left: 62px; }
    .ws__native { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; border: 0; padding: 0;
      cursor: pointer; }
    .ws__native::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: auto; height: auto; cursor: pointer; }
    .ws__nights { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 1;
      padding: 3px 9px; border-radius: var(--r-pill); background: var(--surface); border: 1px solid var(--border);
      font-size: 12px; white-space: nowrap; pointer-events: none; }

    .ws__filters { position: relative; display: grid; place-items: center; width: 52px; height: 52px; flex-shrink: 0;
      border-radius: 50%; border: 1px solid var(--border); background: var(--surface); }
    .ws__filters:hover { background: var(--soft); }
    .ws__badge { position: absolute; top: -2px; right: -2px; min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: var(--r-pill); background: var(--ink); color: var(--on-ink); font-size: 11px; line-height: 18px; }
    .ws__go { height: 60px; padding: 0 30px; margin-left: 4px; }

    .ws__pop { position: absolute; top: calc(100% + 10px); z-index: 30; background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--r-card); padding: 10px;
      box-shadow: 0 12px 32px rgba(20, 20, 20, 0.08); animation: pop-in 0.16s ease-out; }
    .ws__pop--where { left: -8px; width: 360px; }
    .ws__pop--guests { right: 0; width: 340px; padding: 18px; display: grid; gap: 16px; }
    .ws__pop-title { font-size: 13px; color: var(--muted); padding: 6px 10px 8px; }
    .ws__city { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 10px; border: 0;
      background: none; border-radius: 16px; text-align: left; }
    .ws__city:hover, .ws__city:focus-visible { background: var(--soft); }
    .ws__city-img { width: 48px; height: 48px; border-radius: var(--r-thumb); object-fit: cover; background: var(--soft); }
    .ws__city-text { display: flex; flex-direction: column; flex: 1; }
    .ws__row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .ws__row > span { display: flex; flex-direction: column; }
    .ws__row app-stepper { width: 150px; }
    .ws__row-title { font-weight: 500; }
    .ws__done { height: 46px; }
    @keyframes pop-in { from { opacity: 0; transform: translateY(-4px); } }
  `,
})
export class WebSearch {
  protected store = inject(HotelStore);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected c = this.store.criteria;
  protected pop = signal<Popover>(null);
  protected filtersOpen = signal(false);
  protected readonly today = todayIso();
  protected minOut = computed(() => addDays(this.c().checkIn, 1));
  protected nights = computed(() => nightsBetween(this.c().checkIn, this.c().checkOut));
  protected guestsText = computed(() => {
    const { adults, children } = this.c();
    return `${adults + children} mehmon`;
  });
  protected activeFilters = computed(() => {
    const c = this.c();
    return Number(c.minPrice !== PRICE_MIN || c.maxPrice !== PRICE_MAX) + Number(c.type !== 'all');
  });
  protected cities = computed(() =>
    CITIES.map((city) => ({ ...city, count: this.store.hotels().filter((h) => h.city === city.id).length })),
  );

  day(iso: string) {
    return formatDayDate(iso);
  }

  toggle(p: Exclude<Popover, null>) {
    this.pop.set(this.pop() === p ? null : p);
  }

  openPicker(input: HTMLInputElement) {
    this.pop.set(null);
    try {
      input.showPicker?.();
    } catch {
      /* showPicker needs a user gesture; ignore otherwise */
    }
  }

  pickCity(city: City) {
    this.store.patch({ query: city.name });
    this.pop.set(null);
  }

  setCheckIn(v: string) {
    if (!v) return;
    const out = this.c().checkOut > v ? this.c().checkOut : addDays(v, 1);
    this.store.patch({ checkIn: v, checkOut: out });
  }

  onWhereBlur(e: FocusEvent) {
    const next = e.relatedTarget as Node | null;
    if (this.pop() === 'where' && !(e.currentTarget as HTMLElement).contains(next)) this.pop.set(null);
  }

  onOutside(e: Event) {
    if (this.pop() && !this.host.nativeElement.contains(e.target as Node)) this.pop.set(null);
  }

  search() {
    this.pop.set(null);
    this.store.search(this.c());
    this.router.navigateByUrl('/results');
  }
}
