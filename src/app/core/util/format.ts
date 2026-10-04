const NBSP = ' ';

/** 850000 → "850 000 so‘m" */
export function formatSum(value: number, withCurrency = true): string {
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return withCurrency ? `${digits}${NBSP}so‘m` : digits;
}

export function formatNumber(value: number): string {
  return formatSum(value, false);
}

const MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function todayIso(): string {
  return toIso(new Date());
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = parseIso(checkOut).getTime() - parseIso(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** "20 sen" */
export function formatShortDate(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "20 sentabr 2026" */
export function formatLongDate(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "20–29 sen" or "28 sen – 2 okt" */
export function formatRange(checkIn: string, checkOut: string): string {
  const a = parseIso(checkIn);
  const b = parseIso(checkOut);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`;
  return `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}`;
}

/** "+998901234567" → "+998 90 123 45 67" */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '').replace(/^998/, '');
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return `+998 ${parts.join(' ')}`.trim();
}

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const WEEKDAYS_SHORT = ['yak', 'dush', 'sesh', 'chor', 'pay', 'jum', 'shan'];

/** "17 okt, shan" */
export function formatDayDate(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${WEEKDAYS_SHORT[d.getDay()]}`;
}
