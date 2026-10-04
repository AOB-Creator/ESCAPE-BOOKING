import { Booking, Hotel, LoyaltyAccount, PaymentMethod, User } from '../models';

/**
 * Data-access contracts. UI and stores depend only on these abstract
 * classes (used as DI tokens). The prototype binds them to local
 * adapters in `local-adapters.ts`; production binds them to HTTP
 * adapters for Exely PMS / booking engine and payment providers.
 */

export abstract class AuthRepository {
  /** Sends an SMS code. Resolves with a hint only in the prototype. */
  abstract requestCode(phone: string): Promise<{ demoCode?: string }>;
  /** Verifies the code; returns the user or `null` for a new phone number. */
  abstract verifyCode(phone: string, code: string): Promise<{ ok: boolean; user: User | null }>;
  abstract register(phone: string, name: string): Promise<User>;
  abstract updateUser(user: User): Promise<User>;
  abstract currentUser(): User | null;
  abstract signOut(): void;
}

export abstract class HotelRepository {
  abstract list(): Promise<Hotel[]>;
  abstract get(id: string): Promise<Hotel | undefined>;
}

export type NewBooking = Omit<Booking, 'id' | 'status' | 'createdAt'>;

export abstract class BookingRepository {
  abstract list(userId: string): Promise<Booking[]>;
  abstract create(booking: NewBooking): Promise<Booking>;
  abstract update(booking: Booking): Promise<Booking>;
}

/**
 * Guest stay status from the PMS. Points stay pending until the PMS
 * reports the guest as checked in.
 */
export abstract class StayStatusSource {
  abstract isCheckedIn(booking: Booking): Promise<boolean>;
}

export abstract class LoyaltyRepository {
  abstract get(userId: string): Promise<LoyaltyAccount>;
  abstract save(userId: string, account: LoyaltyAccount): Promise<void>;
}

export abstract class FavoritesRepository {
  abstract list(userId: string): Promise<string[]>;
  abstract save(userId: string, ids: string[]): Promise<void>;
}

export interface PaymentResult {
  ok: boolean;
  transactionId?: string;
  error?: string;
}

export abstract class PaymentGateway {
  abstract pay(method: PaymentMethod, amount: number, reference: string): Promise<PaymentResult>;
}
