/**
 * APP_TZ-aware date boundary helpers.
 *
 * All "today / this week / this month" math for BizBook Pro is computed in a single
 * configurable timezone (APP_TZ, default "UTC") so that the Front Desk dashboard and the
 * revenue rollups agree regardless of the server's local zone. Week is Monday–Sunday;
 * month is the calendar month.
 *
 * The returned boundaries are UTC `Date` instances suitable for Prisma `gte`/`lt` filters
 * against `DateTime` columns.
 */

export const APP_TZ = process.env.APP_TZ || 'UTC';

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0=Sun .. 6=Sat
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function partsInTz(date: Date, tz: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) === 24 ? 0 : Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
}

/**
 * Convert a wall-clock datetime expressed in `tz` into the corresponding UTC instant.
 * Handles overflow in the day/month arguments via Date.UTC.
 */
function zonedWallTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  second: number,
  tz: string,
): Date {
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const guess = new Date(asIfUtc);
  const p = partsInTz(guess, tz);
  const guessWallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offset = guessWallAsUtc - asIfUtc;
  return new Date(asIfUtc - offset);
}

export interface Range {
  start: Date;
  end: Date; // exclusive upper bound
}

/** [startOfToday, startOfTomorrow) in APP_TZ, as UTC instants. */
export function todayRange(now: Date = new Date(), tz: string = APP_TZ): Range {
  const p = partsInTz(now, tz);
  const start = zonedWallTimeToUtc(p.year, p.month, p.day, 0, 0, 0, tz);
  const end = zonedWallTimeToUtc(p.year, p.month, p.day + 1, 0, 0, 0, tz);
  return { start, end };
}

/**
 * [00:00, next day 00:00) in APP_TZ for a calendar date given as "YYYY-MM-DD",
 * as UTC instants. Returns null when the string is not a valid date.
 */
export function dateStringRange(dateStr: string, tz: string = APP_TZ): Range | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const start = zonedWallTimeToUtc(year, month, day, 0, 0, 0, tz);
  const end = zonedWallTimeToUtc(year, month, day + 1, 0, 0, 0, tz);
  return { start, end };
}

/** [Monday 00:00, next Monday 00:00) in APP_TZ, as UTC instants. */
export function weekRange(now: Date = new Date(), tz: string = APP_TZ): Range {
  const p = partsInTz(now, tz);
  const daysFromMonday = (p.weekday + 6) % 7; // Mon->0, Sun->6
  const start = zonedWallTimeToUtc(p.year, p.month, p.day - daysFromMonday, 0, 0, 0, tz);
  const end = zonedWallTimeToUtc(p.year, p.month, p.day - daysFromMonday + 7, 0, 0, 0, tz);
  return { start, end };
}

/** [1st of month 00:00, 1st of next month 00:00) in APP_TZ, as UTC instants. */
export function monthRange(now: Date = new Date(), tz: string = APP_TZ): Range {
  const p = partsInTz(now, tz);
  const start = zonedWallTimeToUtc(p.year, p.month, 1, 0, 0, 0, tz);
  const end = zonedWallTimeToUtc(p.year, p.month + 1, 1, 0, 0, 0, tz);
  return { start, end };
}

/** e.g. "Mon Jul 13 – Sun Jul 19" for the given week range. */
export function weekLabel(range: Range, tz: string = APP_TZ): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  // range.end is exclusive (next Monday); the visible Sunday is one day earlier.
  const lastDay = new Date(range.end.getTime() - 24 * 60 * 60 * 1000);
  return `${fmt.format(range.start)} – ${fmt.format(lastDay)}`;
}

/** e.g. "July 2026" for the given month range. */
export function monthLabel(range: Range, tz: string = APP_TZ): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'long',
    year: 'numeric',
  });
  return fmt.format(range.start);
}
