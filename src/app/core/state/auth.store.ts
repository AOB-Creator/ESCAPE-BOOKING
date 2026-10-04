import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthRepository } from '../data/repositories';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private repo = inject(AuthRepository);
  readonly user = signal<User | null>(this.repo.currentUser());
  readonly isSignedIn = computed(() => this.user() !== null);
  readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? '');

  requestCode(phone: string) {
    return this.repo.requestCode(phone);
  }

  /** `needsName` is true when the phone number is new. */
  async verify(phone: string, code: string): Promise<{ ok: boolean; needsName: boolean }> {
    const res = await this.repo.verifyCode(phone, code);
    if (res.ok && res.user) this.user.set(res.user);
    return { ok: res.ok, needsName: res.ok && !res.user };
  }

  async register(phone: string, name: string) {
    this.user.set(await this.repo.register(phone, name.trim()));
  }

  async rename(name: string) {
    const user = this.user();
    if (!user) return;
    this.user.set(await this.repo.updateUser({ ...user, name: name.trim() }));
  }

  signOut() {
    this.repo.signOut();
    this.user.set(null);
  }
}
