/**
 * Domain types. Kept free of storage concerns so the local prototype
 * adapters can be replaced by Exely PMS / booking engine and payment
 * provider adapters without touching UI code.
 */

export type PropertyType = 'hotel' | 'boutique' | 'resort' | 'apartment';

/** `own` — Marmaris tarmog‘i mehmonxonasi; `partner` — hamkor mehmonxona. */
export type HotelOwnership = 'own' | 'partner';

export type CityId = 'toshkent' | 'samarqand' | 'chimyon' | 'buxoro';

export interface City {
  id: CityId;
  name: string;
  photo: string;
}

export interface Room {
  id: string;
  name: string;
  areaM2: number;
  maxGuests: number;
  beds: number;
  baths: number;
  pricePerNight: number;
  /** Exely room type code — filled by the real adapter. */
  externalId?: string;
}

export interface RatingBreakdown {
  communication: number;
  cleanliness: number;
  location: number;
  value: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: CityId;
  district: string;
  distanceToCenterKm: number;
  ownership: HotelOwnership;
  type: PropertyType;
  rating: number;
  reviewsCount: number;
  ratings: RatingBreakdown;
  tags: string[];
  description: string;
  photos: string[];
  /** Total photo count on the provider side (only a few are shipped). */
  photosTotal: number;
  rooms: Room[];
}

export interface SearchCriteria {
  query: string;
  checkIn: string; // ISO yyyy-mm-dd
  checkOut: string;
  adults: number;
  children: number;
  minPrice: number;
  maxPrice: number;
  type: PropertyType | 'all';
}

export interface User {
  id: string;
  phone: string; // +998XXXXXXXXX
  name: string;
  createdAt: string;
}

export type PaymentMethod = 'payme' | 'click' | 'uzum' | 'card';

export type BookingStatus = 'pending' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  /** nights × pricePerNight */
  subtotal: number;
  pointsUsed: number;
  /** subtotal − pointsUsed × POINT_VALUE */
  paid: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
}

export type PointsEntryKind = 'earned' | 'spent' | 'pending' | 'bonus';

export interface PointsEntry {
  id: string;
  kind: PointsEntryKind;
  points: number; // always positive; sign comes from kind
  title: string;
  bookingId?: string;
  date: string;
}

export interface LoyaltyAccount {
  /** Spendable points. */
  balance: number;
  /** Points awarded but not yet credited (guest not checked in). */
  pending: number;
  /** All points ever credited — drives the tier. */
  lifetime: number;
  history: PointsEntry[];
}

export type TierId = 'silver' | 'gold' | 'platinum';

export interface Tier {
  id: TierId;
  name: string;
  min: number;
}
