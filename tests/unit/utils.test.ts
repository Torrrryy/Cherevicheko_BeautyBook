import { describe, expect, it } from "vitest";
import {
  addDays,
  endOfDay,
  formatDateTime,
  formatPrice,
  startOfDay,
  toDateStringLocal
} from "@/lib/utils";

describe("lib/utils", () => {
  it("formatPrice formats RUB without decimals", () => {
    const formatted = formatPrice(2500);
    expect(formatted).toMatch(/2\s?500/);
    expect(formatted).toMatch(/₽|RUB/);
  });

  it("formatDateTime returns non-empty string", () => {
    const result = formatDateTime(new Date("2026-05-20T14:30:00"));
    expect(result.length).toBeGreaterThan(5);
  });

  it("startOfDay resets time to midnight", () => {
    const d = startOfDay(new Date("2026-05-20T15:45:30"));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it("endOfDay sets time to end of day", () => {
    const d = endOfDay(new Date("2026-05-20T08:00:00"));
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
  });

  it("addDays shifts calendar date", () => {
    const base = new Date("2026-05-20T12:00:00");
    const next = addDays(base, 3);
    expect(next.getDate()).toBe(23);
  });

  it("toDateStringLocal uses local calendar date", () => {
    const d = new Date(2026, 4, 22, 23, 30);
    expect(toDateStringLocal(d)).toBe("2026-05-22");
  });
});
