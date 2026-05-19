const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export interface ZonedTime {
  year: number;
  month: number;       // 1..12
  day: number;         // 1..31
  hour: number;        // 0..23
  minute: number;      // 0..59
  second: number;      // 0..59
  weekday: number;     // 0 = Sunday ... 6 = Saturday
  /** Offset from UTC in minutes (e.g. +120 for CEST, -480 for PST). */
  offsetMinutes: number;
  /** ISO-8601 string in the zone (e.g. `2026-05-19T15:30:00+02:00`). */
  iso: string;
}

const partsFmt = (tz: string) => new Intl.DateTimeFormat("en-US", {
  timeZone: tz,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
  hour12: false,
  timeZoneName: "shortOffset",
});

function parseOffset(raw: string): number {
  // raw is like "GMT+2", "GMT+05:30", "GMT-08:00", or "GMT" (== UTC)
  const m = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "+" ? 1 : -1;
  const h = parseInt(m[2]!, 10);
  const mn = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (h * 60 + mn);
}

function isoFromOffset(z: Omit<ZonedTime, "iso">): string {
  const sign = z.offsetMinutes >= 0 ? "+" : "-";
  const off = Math.abs(z.offsetMinutes);
  const oh = String(Math.floor(off / 60)).padStart(2, "0");
  const om = String(off % 60).padStart(2, "0");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${z.year}-${pad(z.month)}-${pad(z.day)}T${pad(z.hour)}:${pad(z.minute)}:${pad(z.second)}${sign}${oh}:${om}`;
}

/**
 * Project a moment (Date or unix ms) into a given IANA timezone.
 *
 * ```
 * at(Date.now(), "Europe/Bucharest")
 * // { year: 2026, month: 5, day: 19, hour: 15, minute: 0, second: 0,
 * //   weekday: 2, offsetMinutes: 180,
 * //   iso: "2026-05-19T15:00:00+03:00" }
 * ```
 *
 * Throws if `tz` is not a recognized IANA timezone.
 */
export function at(date: Date | number, tz: string): ZonedTime {
  const d = typeof date === "number" ? new Date(date) : date;
  const parts = partsFmt(tz).formatToParts(d);
  const lookup = new Map<string, string>();
  for (const p of parts) if (p.type !== "literal") lookup.set(p.type, p.value);
  const z: Omit<ZonedTime, "iso"> = {
    year: Number(lookup.get("year")),
    month: Number(lookup.get("month")),
    day: Number(lookup.get("day")),
    hour: Number(lookup.get("hour")) % 24, // some locales render midnight as "24"
    minute: Number(lookup.get("minute")),
    second: Number(lookup.get("second")),
    weekday: WEEKDAY_MAP[lookup.get("weekday") ?? ""] ?? 0,
    offsetMinutes: parseOffset(lookup.get("timeZoneName") ?? "GMT"),
  };
  return { ...z, iso: isoFromOffset(z) };
}

/** Sugar: `at(new Date(), tz)`. */
export function now(tz: string): ZonedTime {
  return at(new Date(), tz);
}

export interface FormatOptions extends Intl.DateTimeFormatOptions {
  /**
   * BCP 47 locale. Default: runtime default. The output of `Intl.DateTimeFormat`
   * depends on this — for example `"en"` writes "May 19, 2026" while `"ro"` writes
   * "19 mai 2026".
   */
  locale?: string | string[];
}

/**
 * Format a moment in a given timezone using `Intl.DateTimeFormat`. Any
 * `Intl.DateTimeFormatOptions` field is accepted in `opts`.
 *
 * ```
 * format(Date.now(), "Europe/Bucharest", { dateStyle: "long", timeStyle: "short" })
 * // "May 19, 2026, 3:00 PM"
 * ```
 */
export function format(date: Date | number, tz: string, opts: FormatOptions = {}): string {
  const { locale, ...intlOpts } = opts;
  const d = typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { ...intlOpts, timeZone: tz }).format(d);
}

/** Offset of `tz` from UTC at a given instant (default: now), in minutes. */
export function offsetMinutes(tz: string, date: Date | number = Date.now()): number {
  return at(date, tz).offsetMinutes;
}

/**
 * Returns all IANA timezones the runtime recognizes. Requires
 * `Intl.supportedValuesOf` (Node 18+, modern browsers). Throws otherwise.
 */
export function listZones(): string[] {
  type WithSupported = typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  const intl = Intl as WithSupported;
  if (typeof intl.supportedValuesOf !== "function") {
    throw new Error("Intl.supportedValuesOf is not available in this runtime");
  }
  return intl.supportedValuesOf("timeZone");
}
