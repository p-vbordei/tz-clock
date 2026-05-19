import { describe, it, expect } from "vitest";
import { at, now, format, offsetMinutes, listZones } from "../src/index.js";

// A fixed instant we'll project into multiple zones.
// 2026-05-19T12:00:00Z (Tuesday)
const INSTANT = Date.UTC(2026, 4, 19, 12, 0, 0);

describe("at: project instant into a zone", () => {
  it("UTC is identity", () => {
    const z = at(INSTANT, "UTC");
    expect(z.year).toBe(2026);
    expect(z.month).toBe(5);
    expect(z.day).toBe(19);
    expect(z.hour).toBe(12);
    expect(z.minute).toBe(0);
    expect(z.offsetMinutes).toBe(0);
    expect(z.iso).toBe("2026-05-19T12:00:00+00:00");
  });

  it("Europe/Bucharest in May = UTC+3 (DST)", () => {
    const z = at(INSTANT, "Europe/Bucharest");
    expect(z.hour).toBe(15);
    expect(z.offsetMinutes).toBe(180);
    expect(z.iso).toBe("2026-05-19T15:00:00+03:00");
  });

  it("America/Los_Angeles in May = UTC-7 (PDT)", () => {
    const z = at(INSTANT, "America/Los_Angeles");
    expect(z.hour).toBe(5);
    expect(z.offsetMinutes).toBe(-420);
  });

  it("Asia/Kolkata = UTC+5:30 (no DST)", () => {
    const z = at(INSTANT, "Asia/Kolkata");
    expect(z.hour).toBe(17);
    expect(z.minute).toBe(30);
    expect(z.offsetMinutes).toBe(330);
    expect(z.iso).toBe("2026-05-19T17:30:00+05:30");
  });

  it("weekday is correct", () => {
    const z = at(INSTANT, "UTC");
    expect(z.weekday).toBe(2); // Tuesday
  });

  it("accepts Date object", () => {
    const z = at(new Date(INSTANT), "UTC");
    expect(z.hour).toBe(12);
  });

  it("rejects unknown zone", () => {
    expect(() => at(INSTANT, "Not/AZone")).toThrow();
  });
});

describe("now", () => {
  it("returns a populated zoned time", () => {
    const z = now("UTC");
    expect(typeof z.year).toBe("number");
    expect(z.year).toBeGreaterThan(2020);
  });
});

describe("format", () => {
  it("delegates to Intl.DateTimeFormat with the zone applied", () => {
    const out = format(INSTANT, "Europe/Bucharest", {
      locale: "en-GB",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(out).toBe("15:00");
  });

  it("respects locale", () => {
    const out = format(INSTANT, "Europe/Bucharest", {
      locale: "ro",
      dateStyle: "long",
    });
    expect(out.toLowerCase()).toContain("mai");
  });
});

describe("offsetMinutes", () => {
  it("returns offset from UTC", () => {
    expect(offsetMinutes("UTC", INSTANT)).toBe(0);
    expect(offsetMinutes("Europe/Bucharest", INSTANT)).toBe(180);
    expect(offsetMinutes("America/Los_Angeles", INSTANT)).toBe(-420);
  });
});

describe("listZones", () => {
  it("returns a non-empty array including common zones", () => {
    const zones = listZones();
    expect(zones.length).toBeGreaterThan(100);
    expect(zones).toContain("Europe/Bucharest");
    expect(zones).toContain("America/Los_Angeles");
    expect(zones).toContain("Asia/Tokyo");
  });
});
