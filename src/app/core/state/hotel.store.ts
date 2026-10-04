import { Injectable, computed, inject, signal } from '@angular/core';
import { CITY_NAMES } from '../data/mock-data';
import { HotelRepository } from '../data/repositories';
import { Hotel, Room, SearchCriteria } from '../models';
import { addDays, todayIso } from '../util/format';

export const PRICE_MIN = 300_000;
export const PRICE_MAX = 3_000_000;
export const PRICE_STEP = 50_000;

export function defaultCriteria(): SearchCriteria {
  const checkIn = addDays(todayIso(), 7);
  return {
    query: '',
    checkIn,
    checkOut: addDays(checkIn, 3),
    adults: 2,
    children: 1,
    minPrice: PRICE_MIN,
    maxPrice: PRICE_MAX,
    type: 'all',
  };
}

export function guestsOf(c: SearchCriteria) {
  return c.adults + c.children;
}

export function cheapestRoom(hotel: Hotel, guests = 1): Room | undefined {
  return hotel.rooms
    .filter((r) => r.maxGuests >= guests)
    .reduce<Room | undefined>((min, r) => (!min || r.pricePerNight < min.pricePerNight ? r : min), undefined);
}

export function matches(hotel: Hotel, c: SearchCriteria): boolean {
  const q = c.query.trim().toLowerCase();
  if (q) {
    const hay = `${hotel.name} ${CITY_NAMES[hotel.city]} ${hotel.district}`.toLowerCase();
    const words = q.split(/[\s,]+/).filter((w) => w && w !== 'o‘zbekiston' && w !== 'uzbekistan');
    if (!words.every((w) => hay.includes(w))) return false;
  }
  if (c.type !== 'all' && hotel.type !== c.type) return false;
  const guests = guestsOf(c);
  return hotel.rooms.some(
    (r) => r.maxGuests >= guests && r.pricePerNight >= c.minPrice && r.pricePerNight <= c.maxPrice,
  );
}

@Injectable({ providedIn: 'root' })
export class HotelStore {
  private repo = inject(HotelRepository);
  readonly hotels = signal<Hotel[]>([]);
  readonly criteria = signal<SearchCriteria>(defaultCriteria());
  /** Whether the user has run a search (vs. default browse). */
  readonly searched = signal(false);
  readonly results = computed(() => this.hotels().filter((h) => matches(h, this.criteria())));
  readonly popular = computed(() => [...this.hotels()].sort((a, b) => b.reviewsCount - a.reviewsCount));
  readonly allPrices = computed(() => this.hotels().flatMap((h) => h.rooms.map((r) => r.pricePerNight)));

  constructor() {
    this.repo.list().then((h) => this.hotels.set(h));
  }

  byId(id: string) {
    return computed(() => this.hotels().find((h) => h.id === id));
  }

  search(c: SearchCriteria) {
    this.criteria.set(c);
    this.searched.set(true);
  }

  patch(p: Partial<SearchCriteria>) {
    this.criteria.update((c) => ({ ...c, ...p }));
  }
}
