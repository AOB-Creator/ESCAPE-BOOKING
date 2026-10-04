import { Injectable, effect, inject, signal } from '@angular/core';
import { FavoritesRepository } from '../data/repositories';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private repo = inject(FavoritesRepository);
  private auth = inject(AuthStore);
  readonly ids = signal<string[]>([]);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) return this.ids.set([]);
      this.repo.list(user.id).then((ids) => this.ids.set(ids));
    });
  }

  has(id: string) {
    return this.ids().includes(id);
  }

  toggle(id: string) {
    const user = this.auth.user();
    const next = this.has(id) ? this.ids().filter((x) => x !== id) : [id, ...this.ids()];
    this.ids.set(next);
    if (user) this.repo.save(user.id, next);
  }
}
