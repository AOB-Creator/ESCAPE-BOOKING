import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PROPERTY_TYPES } from '../core/data/mock-data';
import { SearchCriteria } from '../core/models';
import { HotelStore, PRICE_MAX, PRICE_MIN, PRICE_STEP } from '../core/state/hotel.store';
import { addDays, formatSum, todayIso } from '../core/util/format';
import { Icon } from '../shared/icon';
import { Stepper } from '../shared/stepper';

const BINS = 26;

/** Search form fields; used inside the mobile sheet and the desktop sidebar. */
@Component({
  selector: 'app-search-filters',
  imports: [FormsModule, Icon, Stepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'stack' },
  template: `
    @if (!compact()) {
      <div>
        <h3 class="h2">Dam olish bir qadam narida</h3>
        <p class="muted sub">Sizga mos joylarni ko‘rish uchun parametrlarni tanlang</p>
      </div>
    }

    <label class="field">
      <span class="field__label">Joylashuv</span>
      <span class="input input--icon-end">
        <input [name]="prefix() + 'query'" placeholder="Shahar yoki mehmonxona" [ngModel]="c().query"
          (ngModelChange)="patch({ query: $event })" autocomplete="off" />
        <app-icon name="search" [size]="18" />
      </span>
    </label>

    <fieldset class="field">
      <legend class="field__label">Sanalar</legend>
      <div class="split">
        <label class="split__half">
          <span class="visually-hidden">Kelish sanasi</span>
          <input type="date" [name]="prefix() + 'in'" [min]="today" [ngModel]="c().checkIn" (ngModelChange)="setCheckIn($event)" />
        </label>
        <label class="split__half">
          <span class="visually-hidden">Ketish sanasi</span>
          <input type="date" [name]="prefix() + 'out'" [min]="minCheckOut()" [ngModel]="c().checkOut"
            (ngModelChange)="patch({ checkOut: $event })" />
        </label>
      </div>
    </fieldset>

    <div class="grid-2">
      <div class="field">
        <span class="field__label">Kattalar</span>
        <app-stepper label="Kattalar" [min]="1" [max]="8" [value]="c().adults" (valueChange)="patch({ adults: $event })" />
      </div>
      <div class="field">
        <span class="field__label">Bolalar</span>
        <app-stepper label="Bolalar" [min]="0" [max]="6" [value]="c().children" (valueChange)="patch({ children: $event })" />
      </div>
    </div>

    <fieldset class="field">
      <legend class="field__label">Narx oralig‘i (1 kecha)</legend>
      <div class="histogram" aria-hidden="true">
        @for (b of bars(); track $index) {
          <span class="histogram__bar" [class.is-in]="b.inRange" [style.height.%]="b.h"></span>
        }
      </div>
      <div class="range">
        <div class="range__track" aria-hidden="true">
          <span class="range__fill" [style.left.%]="pct(c().minPrice)" [style.right.%]="100 - pct(c().maxPrice)"></span>
        </div>
        <input type="range" [name]="prefix() + 'minR'" aria-label="Minimal narx" [min]="PRICE_MIN" [max]="PRICE_MAX" [step]="PRICE_STEP"
          [ngModel]="c().minPrice" (ngModelChange)="setMin(+$event)" [attr.aria-valuetext]="fmt(c().minPrice)" />
        <input type="range" [name]="prefix() + 'maxR'" aria-label="Maksimal narx" [min]="PRICE_MIN" [max]="PRICE_MAX" [step]="PRICE_STEP"
          [ngModel]="c().maxPrice" (ngModelChange)="setMax(+$event)" [attr.aria-valuetext]="fmt(c().maxPrice)" />
      </div>
      <div class="grid-2 prices">
        <label class="field">
          <span class="field__label field__label--sm">Min narx</span>
          <input class="input" [name]="prefix() + 'min'" inputmode="numeric" [value]="fmt(c().minPrice)"
            (change)="setMin(parse($any($event.target).value)); $any($event.target).value = fmt(c().minPrice)" />
        </label>
        <label class="field">
          <span class="field__label field__label--sm">Max narx</span>
          <input class="input" [name]="prefix() + 'max'" inputmode="numeric" [value]="fmt(c().maxPrice)"
            (change)="setMax(parse($any($event.target).value)); $any($event.target).value = fmt(c().maxPrice)" />
        </label>
      </div>
    </fieldset>

    <fieldset class="field">
      <legend class="field__label">Joy turi</legend>
      <div class="chip-wrap" role="radiogroup" aria-label="Joy turi">
        @for (t of types; track t.id) {
          <button type="button" role="radio" class="chip" [class.is-active]="c().type === t.id"
            [attr.aria-checked]="c().type === t.id" (click)="patch({ type: t.id })">{{ t.label }}</button>
        }
      </div>
    </fieldset>
  `,
  styles: `
    .sub { margin: 4px 0 0; }
    .prices { margin-top: 14px; }
    .histogram { display: flex; align-items: flex-end; gap: 3px; height: 72px; padding: 0 10px; }
    .histogram__bar { flex: 1; background: var(--border); border-radius: 3px 3px 0 0; min-height: 4px; }
    .histogram__bar.is-in { background: var(--text); }
    .range { position: relative; height: 22px; margin-top: -1px; }
    .range__track { position: absolute; left: 10px; right: 10px; top: 0; height: 2px; background: var(--border); }
    .range__fill { position: absolute; top: 0; bottom: 0; background: var(--text); }
    .range input { position: absolute; inset: -10px 0 auto; width: 100%; height: 22px; margin: 0;
      background: none; appearance: none; -webkit-appearance: none; pointer-events: none; }
    .range input::-webkit-slider-runnable-track { background: none; height: 22px; }
    .range input::-moz-range-track { background: none; }
    .range input::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 20px; height: 20px;
      margin-top: 1px; border-radius: 50%; background: var(--surface); border: 2px solid var(--text); cursor: grab; }
    .range input::-moz-range-thumb { pointer-events: auto; width: 16px; height: 16px; border-radius: 50%;
      background: var(--surface); border: 2px solid var(--text); cursor: grab; }
    .range input:focus-visible { outline: none; }
    .range input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--focus); }
    .range input:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--focus); }
  `,
})
export class SearchFilters {
  private store = inject(HotelStore);
  readonly c = model.required<SearchCriteria>({ alias: 'criteria' });
  /** Hides the intro heading (sidebar use). */
  readonly compact = input(false);
  /** Keeps control names unique when two forms are on the page. */
  readonly prefix = input('s-');

  protected readonly PRICE_MIN = PRICE_MIN;
  protected readonly PRICE_MAX = PRICE_MAX;
  protected readonly PRICE_STEP = PRICE_STEP;
  protected readonly types = PROPERTY_TYPES;
  protected readonly today = todayIso();
  protected minCheckOut = computed(() => addDays(this.c().checkIn, 1));

  /** Price distribution of all rooms, smoothed — bars inside the range are dark. */
  protected bars = computed(() => {
    const prices = this.store.allPrices();
    const width = (PRICE_MAX - PRICE_MIN) / BINS;
    const sigma = width * 1.6;
    const raw = Array.from({ length: BINS }, (_, i) => {
      const x = PRICE_MIN + width * (i + 0.5);
      return prices.reduce((sum, p) => sum + Math.exp(-(((x - p) / sigma) ** 2)), 0);
    });
    const max = Math.max(...raw, 1);
    const { minPrice, maxPrice } = this.c();
    return raw.map((v, i) => {
      const x = PRICE_MIN + width * (i + 0.5);
      return { h: 6 + (v / max) * 94, inRange: x >= minPrice && x <= maxPrice };
    });
  });

  patch(p: Partial<SearchCriteria>) {
    this.c.update((c) => ({ ...c, ...p }));
  }

  setCheckIn(checkIn: string) {
    if (!checkIn) return;
    const checkOut = this.c().checkOut > checkIn ? this.c().checkOut : addDays(checkIn, 1);
    this.patch({ checkIn, checkOut });
  }

  setMin(v: number) {
    this.patch({ minPrice: this.clamp(Math.min(v, this.c().maxPrice - PRICE_STEP)) });
  }

  setMax(v: number) {
    this.patch({ maxPrice: this.clamp(Math.max(v, this.c().minPrice + PRICE_STEP)) });
  }

  pct(v: number) {
    return ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  }

  fmt(v: number) {
    return formatSum(v);
  }

  parse(v: string) {
    return Number(v.replace(/\D/g, '')) || 0;
  }

  private clamp(v: number) {
    return Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(v / PRICE_STEP) * PRICE_STEP));
  }
}
