# tz-clock

[![ci](https://github.com/p-vbordei/tz-clock/actions/workflows/ci.yml/badge.svg)](https://github.com/p-vbordei/tz-clock/actions/workflows/ci.yml)

[![npm](https://img.shields.io/npm/v/tz-clock.svg)](https://www.npmjs.com/package/tz-clock)
[![downloads](https://img.shields.io/npm/dm/tz-clock.svg)](https://www.npmjs.com/package/tz-clock)
[![bundle](https://img.shields.io/bundlejs/size/tz-clock)](https://bundlejs.com/?q=tz-clock)

Project moments into IANA timezones — get wall-clock fields, UTC offset, formatted output. Built on the `Intl` APIs already in your runtime. Zero dependencies. No 7MB tzdata bundle, no plugins, no temporal polyfills.

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

### `listZones(): string[]`

Returns the runtime's known IANA zones, via `Intl.supportedValuesOf("timeZone")`. Throws on older runtimes.

## Why not Day.js / date-fns-tz / moment-timezone?

They all ship tzdata. The runtime already has it. This package is ~150 lines and uses what's there.

## Caveats

- Pre-1970 dates may be inaccurate for some zones — the `Intl` implementation depends on the host's ICU/CLDR data.
- We expose `offsetMinutes` as a plain number; `+03:30` is `210`, `-04:00` is `-240`.

## License

Apache-2.0 © Vlad Bordei
