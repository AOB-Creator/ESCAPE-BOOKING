import { Injectable, Provider } from '@angular/core';
import { Booking, LoyaltyAccount, PaymentMethod, User } from '../models';
import { todayIso, uid } from '../util/format';
import { HOTELS } from './mock-data';
import {
  AuthRepository,
  BookingRepository,
  FavoritesRepository,
  HotelRepository,
  LoyaltyRepository,
  NewBooking,
  PaymentGateway,
  PaymentResult,
  StayStatusSource,
} from './repositories';

/** Prototype-only: everything lives in localStorage. */
const PREFIX = 'escape.';
const DEMO_CODE = '1234';
const latency = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — prototype keeps working in memory */
  }
}

@Injectable()
export class LocalAuthRepository extends AuthRepository {
  async requestCode(phone: string) {
    await latency();
    return { demoCode: DEMO_CODE, phone };
  }

  async verifyCode(phone: string, code: string) {
    await latency();
    if (code !== DEMO_CODE) return { ok: false, user: null };
    const user = read<User[]>('users', []).find((u) => u.phone === phone) ?? null;
    if (user) write('session', user.id);
    return { ok: true, user };
  }

  async register(phone: string, name: string) {
    await latency(150);
    const user: User = { id: uid('u_'), phone, name, createdAt: new Date().toISOString() };
    write('users', [...read<User[]>('users', []), user]);
    write('session', user.id);
    return user;
  }

  async updateUser(user: User) {
    write('users', read<User[]>('users', []).map((u) => (u.id === user.id ? user : u)));
    return user;
  }

  currentUser() {
    const id = read<string | null>('session', null);
    return read<User[]>('users', []).find((u) => u.id === id) ?? null;
  }

  signOut() {
    write('session', null);
  }
}

@Injectable()
export class LocalHotelRepository extends HotelRepository {
  async list() {
    return HOTELS;
  }
  async get(id: string) {
    return HOTELS.find((h) => h.id === id);
  }
}

@Injectable()
export class LocalBookingRepository extends BookingRepository {
  async list(userId: string) {
    return read<Booking[]>('bookings.' + userId, []);
  }

  async create(data: NewBooking) {
    await latency(400);
    const booking: Booking = { ...data, id: uid('b_'), status: 'pending', createdAt: new Date().toISOString() };
    write('bookings.' + data.userId, [booking, ...(await this.list(data.userId))]);
    return booking;
  }

  async update(booking: Booking) {
    const all = await this.list(booking.userId);
    write('bookings.' + booking.userId, all.map((b) => (b.id === booking.id ? booking : b)));
    return booking;
  }
}

/**
 * Stand-in for Exely PMS: a guest counts as checked in once the check-in
 * date has arrived, or when marked manually in the demo.
 */
@Injectable()
export class LocalStayStatusSource extends StayStatusSource {
  async isCheckedIn(booking: Booking) {
    return booking.checkIn <= todayIso() || read<string[]>('demoCheckedIn', []).includes(booking.id);
  }

  /** Demo helper — not part of the contract. */
  markCheckedIn(bookingId: string) {
    write('demoCheckedIn', [...read<string[]>('demoCheckedIn', []), bookingId]);
  }
}

@Injectable()
export class LocalLoyaltyRepository extends LoyaltyRepository {
  async get(userId: string): Promise<LoyaltyAccount> {
    return read<LoyaltyAccount | null>('loyalty.' + userId, null) ?? this.welcome(userId);
  }

  async save(userId: string, account: LoyaltyAccount) {
    write('loyalty.' + userId, account);
  }

  private welcome(userId: string): LoyaltyAccount {
    const account: LoyaltyAccount = {
      balance: 100,
      pending: 0,
      lifetime: 100,
      history: [{ id: uid('p_'), kind: 'bonus', points: 100, title: 'Xush kelibsiz bonusi', date: new Date().toISOString() }],
    };
    write('loyalty.' + userId, account);
    return account;
  }
}

@Injectable()
export class LocalFavoritesRepository extends FavoritesRepository {
  async list(userId: string) {
    return read<string[]>('favorites.' + userId, []);
  }
  async save(userId: string, ids: string[]) {
    write('favorites.' + userId, ids);
  }
}

/** Simulates Payme / Click / Uzum / card checkout. */
@Injectable()
export class FakePaymentGateway extends PaymentGateway {
  async pay(_method: PaymentMethod, amount: number): Promise<PaymentResult> {
    await latency(700);
    return amount >= 0 ? { ok: true, transactionId: uid('tx_') } : { ok: false, error: 'Noto‘g‘ri summa' };
  }
}

export const LOCAL_DATA_PROVIDERS: Provider[] = [
  { provide: AuthRepository, useClass: LocalAuthRepository },
  { provide: HotelRepository, useClass: LocalHotelRepository },
  { provide: BookingRepository, useClass: LocalBookingRepository },
  LocalStayStatusSource,
  { provide: StayStatusSource, useExisting: LocalStayStatusSource },
  { provide: LoyaltyRepository, useClass: LocalLoyaltyRepository },
  { provide: FavoritesRepository, useClass: LocalFavoritesRepository },
  { provide: PaymentGateway, useClass: FakePaymentGateway },
];
