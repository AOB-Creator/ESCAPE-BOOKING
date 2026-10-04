import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAX_REDEEM_SHARE, POINT_VALUE, SPEND_PER_POINT, TIERS } from '../core/loyalty';
import { PointsEntry } from '../core/models';
import { LoyaltyStore } from '../core/state/loyalty.store';
import { Icon } from '../shared/icon';
import { LongDatePipe, NumPipe, SumPipe } from '../shared/pipes';

@Component({
  selector: 'app-bonuses',
  imports: [Icon, NumPipe, SumPipe, LongDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page page--tabs">
      <header class="page-head">
        <h1 class="h1">Bonuslar</h1>
      </header>

      <div class="two-col">
      <div class="two-col__main">
      <section class="loyalty-card" aria-label="Ball hisobi">
        <span class="pill pill--light">{{ loyalty.progress().tier.name }}</span>
        <p class="loyalty-card__balance"><span>{{ loyalty.balance() | num }}</span> ball</p>
        <p class="loyalty-card__value">≈ {{ loyalty.balanceValue() | sum }} chegirma</p>
        @if (loyalty.account().pending) {
          <p class="loyalty-card__value">{{ loyalty.account().pending | num }} ball kutilmoqda</p>
        }
        <div class="progress progress--dark" role="progressbar" aria-label="Keyingi darajagacha"
          [attr.aria-valuenow]="round(loyalty.progress().ratio * 100)" aria-valuemin="0" aria-valuemax="100">
          <span class="progress__bar" [style.width.%]="loyalty.progress().ratio * 100"></span>
        </div>
        <p class="loyalty-card__next">
          @if (loyalty.progress().next; as next) {
            {{ next.name }} darajasigacha {{ loyalty.progress().remaining | num }} ball
          } @else {
            Siz eng yuqori darajadasiz
          }
        </p>
      </section>

      <section class="section" aria-labelledby="how-h">
        <h2 class="section__title" id="how-h">Qanday ishlaydi</h2>
        <ol class="steps">
          <li class="steps__item">
            <span class="steps__num">1</span>
            <div><p>Bron qiling</p><p class="meta">Har {{ spendPerPoint | sum }} uchun 1 ball</p></div>
          </li>
          <li class="steps__item">
            <span class="steps__num">2</span>
            <div><p>Mehmonxonaga joylashing</p><p class="meta">Ball shu paytgacha “kutilmoqda” holatida turadi</p></div>
          </li>
          <li class="steps__item">
            <span class="steps__num">3</span>
            <div><p>Ball hisobingizga tushadi</p>
              <p class="meta">1 ball = {{ pointValue | sum }}, bronning {{ sharePct }}% gacha</p></div>
          </li>
        </ol>
      </section>

      <section class="section" aria-labelledby="tiers-h">
        <h2 class="section__title" id="tiers-h">Darajalar</h2>
        <ul class="tier-row">
          @for (t of tiers; track t.id) {
            <li class="tier" [class.is-active]="t.id === loyalty.progress().tier.id">
              <span>{{ t.name }}</span><span class="meta">{{ t.min | num }}+ ball</span>
            </li>
          }
        </ul>
      </section>

      </div>
      <div class="two-col__side">
      <section class="section" aria-labelledby="hist-h">
        <h2 class="section__title" id="hist-h">Ballar tarixi</h2>
        @if (loyalty.account().history.length) {
          <ul class="list-card">
            @for (e of loyalty.account().history; track e.id) {
              <li class="list-row">
                <span class="list-row__icon"><app-icon [name]="icon(e)" [size]="18" /></span>
                <span class="list-row__main">
                  <span>{{ e.title }}</span>
                  <span class="meta">{{ label(e) }} · {{ e.date | longDate }}</span>
                </span>
                <span class="points" [class.points--minus]="e.kind === 'spent'" [class.points--pending]="e.kind === 'pending'">
                  {{ e.kind === 'spent' ? '−' : '+' }}{{ e.points | num }}
                </span>
              </li>
            }
          </ul>
        } @else {
          <p class="muted">Hali ball harakati yo‘q</p>
        }
      </section>
      </div>
      </div>
    </main>
  `,
})
export class Bonuses {
  protected loyalty = inject(LoyaltyStore);
  protected readonly tiers = TIERS;
  protected readonly spendPerPoint = SPEND_PER_POINT;
  protected readonly pointValue = POINT_VALUE;
  protected readonly sharePct = MAX_REDEEM_SHARE * 100;

  round(v: number) {
    return Math.round(v);
  }

  icon(e: PointsEntry) {
    return e.kind === 'spent' ? 'credit-card' : e.kind === 'pending' ? 'clock' : e.kind === 'bonus' ? 'gift' : 'coins';
  }

  label(e: PointsEntry) {
    return { earned: 'Hisoblandi', spent: 'Sarflandi', pending: 'Kutilmoqda', bonus: 'Bonus' }[e.kind];
  }
}
