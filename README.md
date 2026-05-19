# tz-clock

[![ci](https://github.com/p-vbordei/tz-clock/actions/workflows/ci.yml/badge.svg)](https://github.com/p-vbordei/tz-clock/actions/workflows/ci.yml)

[![npm](https://img.shields.io/npm/v/tz-clock.svg)](https://www.npmjs.com/package/tz-clock)
[![downloads](https://img.shields.io/npm/dm/tz-clock.svg)](https://www.npmjs.com/package/tz-clock)
[![bundle](https://img.shields.io/bundlejs/size/tz-clock)](https://bundlejs.com/?q=tz-clock)

> Project moments into IANA timezones — wall-clock fields, UTC offset, formatted output. Built on the `Intl` APIs already in your runtime. Zero dependencies. No 7MB tzdata bundle, no plugins, no temporal polyfills.

```ts
import { at, now, format, offsetMinutes } from "tz-clock";

now("Europe/Bucharest");
// {
//   year: 2026, month: 5, day: 19,
//   hour: 15, minute: 0, second: 0,
//   weekday: 2,             // Tuesday
//   offsetMinutes: 180,     // +03:00 (DST)
//   iso: "2026-05-19T15:00:00+03:00"
// }

format(Date.now(), "Asia/Tokyo", { dateStyle: "long", timeStyle: "short" });
// "May 19, 2026, 9:00 PM"

offsetMinutes("America/Los_Angeles");  // -420 in summer (PDT), -480 in winter (PST)
```

## Install

```sh
npm install tz-clock
```

Works with Node 20+, browsers, Bun, Deno. ESM + CJS.

## Why

Day.js + tz plugin: ~7KB minified. Moment-timezone: ~30KB. date-fns-tz: ~5KB. All ship their own tzdata.

`tz-clock` does this in ~150 lines because **your runtime already has tzdata**. `Intl.DateTimeFormat` knows every IANA zone and handles DST correctly. The hard part is extracting structured fields out of `Intl`'s rendered output — that's what this package does.

## Recipes

### "What time is it in our user's timezone?"

```ts
import { format } from "tz-clock";

const greeting = `Good morning, it's ${format(Date.now(), user.timezone, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})}`;
```

### Meeting times across team members

```ts
import { format } from "tz-clock";

function meetingTimes(meetingUtc: Date, timezones: string[]) {
  return timezones.map((tz) => ({
    tz,
    local: format(meetingUtc, tz, { weekday: "short", hour: "numeric", minute: "2-digit" }),
  }));
}

meetingTimes(new Date("2026-05-20T15:00:00Z"), [
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Singapore",
]);
// [
//   { tz: "America/Los_Angeles", local: "Wed, 8:00 AM" },
//   { tz: "Europe/London",       local: "Wed, 4:00 PM" },
//   { tz: "Asia/Singapore",      local: "Wed, 11:00 PM" },
// ]
```

### Schedule a job at 9am in a specific zone

```ts
import { at, offsetMinutes } from "tz-clock";

function nextNineAm(tz: string): Date {
  const z = at(Date.now(), tz);
  const localNineUtc = Date.UTC(z.year, z.month - 1, z.day, 9) - z.offsetMinutes * 60_000;
  if (localNineUtc <= Date.now()) return new Date(localNineUtc + 86_400_000);
  return new Date(localNineUtc);
}
```

### Detect DST transitions

```ts
import { offsetMinutes } from "tz-clock";

const summer = offsetMinutes("Europe/Berlin", new Date("2026-07-01Z"));  // 120
const winter = offsetMinutes("Europe/Berlin", new Date("2026-01-01Z"));  // 60
console.log(`DST shift: ${summer - winter} minutes`);  // 60
```

## API

### `at(date, tz): ZonedTime`

```ts
type ZonedTime = {
  year: number;
  month: number;       // 1..12
  day: number;
  hour: number;        // 0..23
  minute: number;
  second: number;
  weekday: number;     // 0 = Sunday ... 6 = Saturday
  offsetMinutes: number;
  iso: string;         // ISO-8601 with offset
};
```

`date` is a `Date` or unix-ms `number`. Throws on unknown timezone.

### `now(tz): ZonedTime`

Sugar for `at(new Date(), tz)`.

### `format(date, tz, opts?): string`

Delegates to `Intl.DateTimeFormat`. Pass any `Intl.DateTimeFormatOptions` field (plus `locale`).

### `offsetMinutes(tz, date?): number`

Returns the zone's UTC offset, in minutes, at the given instant. Handles DST correctly.

```ts
offsetMinutes("UTC");                    //    0
offsetMinutes("Europe/Bucharest");       //  180 in summer, 120 in winter
offsetMinutes("America/Los_Angeles");    // -420 in summer, -480 in winter
offsetMinutes("Asia/Kolkata");           //  330 (no DST)
```

### `listZones(): string[]`

Returns the runtime's known IANA zones via `Intl.supportedValuesOf("timeZone")`. Throws on older runtimes that don't support it.

## Conversion patterns

`tz-clock` gives you wall-clock fields for a given zone. To **construct** a UTC `Date` from "9am in Bucharest", do the math yourself:

```ts
import { offsetMinutes } from "tz-clock";

const localNineAm = new Date(2026, 4, 19, 9);
const off = offsetMinutes("Europe/Bucharest", localNineAm);
const bucharestNineAmUtc = new Date(Date.UTC(2026, 4, 19, 9) - off * 60_000);
```

This is intentionally manual — adding a `fromZoned()` helper would require dealing with DST-transition ambiguity (the "spring forward" hour doesn't exist; the "fall back" hour exists twice) which is library-territory complexity.

## Caveats

- **Pre-1970 dates may be inaccurate** for some zones — depends on the host's ICU/CLDR data.
- **No reverse conversion** for now — see "Conversion patterns" above.
- **Output strings depend on Node/ICU version.** Don't snapshot them in tests across runtimes; use the structured `at()` fields instead.

## License

Apache-2.0 © Vlad Bordei
