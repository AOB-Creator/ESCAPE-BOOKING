import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { LoyaltyRepository } from '../data/repositories';
import { POINT_VALUE, tierProgress } from '../loyalty';
import { LoyaltyAccount, PointsEntry } from '../models';
import { uid } from '../util/format';
import { AuthStore } from './auth.store';

const EMPTY: LoyaltyAccount = { balance: 0, pending: 0, lifetime: 0, history: [] };

@Injectable({ providedIn: 'root' })
export class LoyaltyStore {
  private repo = inject(LoyaltyRepository);
  private auth = inject(AuthStore);
  readonly account = signal<LoyaltyAccount>(EMPTY);
  readonly balance = computed(() => this.account().balance);
  readonly balanceValue = computed(() => this.account().balance * POINT_VALUE);
  readonly progress = computed(() => tierProgress(this.account().lifetime));
  private loadedFor: string | null = null;
  private loading: Promise<void> = Promise.resolve();

  constructor() {
    effect(() => {
      this.auth.user();
      this.ready();
    });
  }

  /** Resolves once the signed-in user's account is loaded. */
  ready(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.loadedFor = null;
      this.account.set(EMPTY);
      return Promise.resolve();
    }
    if (this.loadedFor !== user.id) {
      this.loadedFor = user.id;
      this.loading = this.repo.get(user.id).then((a) => this.account.set(a));
    }
    return this.loading;
  }

  async spend(points: number, title: string, bookingId: string) {
    if (points <= 0) return;
    await this.ready();
    this.mutate((a) => ({
      ...a,
      balance: a.balance - points,
      history: [this.entry('spent', points, title, bookingId), ...a.history],
    }));
  }

  async addPending(points: number, title: string, bookingId: string) {
    if (points <= 0) return;
    await this.ready();
    this.mutate((a) => ({
      ...a,
      pending: a.pending + points,
      history: [this.entry('pending', points, title, bookingId), ...a.history],
    }));
  }

  /** Moves a booking's pending points into the balance (after check-in). */
  async credit(bookingId: string) {
    await this.ready();
    this.mutate((a) => {
      const entry = a.history.find((e) => e.bookingId === bookingId && e.kind === 'pending');
      if (!entry) return a;
      return {
        balance: a.balance + entry.points,
        pending: a.pending - entry.points,
        lifetime: a.lifetime + entry.points,
        history: a.history.map((e) =>
          e === entry ? { ...e, kind: 'earned', date: new Date().toISOString() } : e,
        ),
      };
    });
  }

  private entry(kind: PointsEntry['kind'], points: number, title: string, bookingId: string): PointsEntry {
    return { id: uid('p_'), kind, points, title, bookingId, date: new Date().toISOString() };
  }

  private mutate(fn: (a: LoyaltyAccount) => LoyaltyAccount) {
    const user = this.auth.user();
    const next = fn(this.account());
    this.account.set(next);
    if (user) this.repo.save(user.id, next);
  }
}
