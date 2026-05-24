import { describe, expect, it } from "vitest";
import {
  addMinutes,
  assertWithinSalonHours,
  intervalsOverlap,
  SALON_CLOSE_HOUR,
  SALON_OPEN_HOUR
} from "@/server/domain/availability";

describe("availability domain", () => {
  it("detects overlapping intervals", () => {
    const startA = new Date("2026-05-20T10:00:00");
    const endA = addMinutes(startA, 60);
    const startB = new Date("2026-05-20T10:30:00");
    const endB = addMinutes(startB, 60);
    expect(intervalsOverlap(startA, endA, startB, endB)).toBe(true);
  });

  it("non-overlapping intervals do not conflict", () => {
    const startA = new Date("2026-05-20T10:00:00");
    const endA = addMinutes(startA, 60);
    const startB = new Date("2026-05-20T11:00:00");
    const endB = addMinutes(startB, 60);
    expect(intervalsOverlap(startA, endA, startB, endB)).toBe(false);
  });

  it("adjacent slots 10:00-11:00 and 11:00-12:00 do not overlap", () => {
    const startA = new Date("2026-05-20T10:00:00");
    const endA = addMinutes(startA, 60);
    const startB = new Date("2026-05-20T11:00:00");
    const endB = addMinutes(startB, 60);
    expect(intervalsOverlap(startA, endA, startB, endB)).toBe(false);
  });

  it("detects full containment overlap", () => {
    const outerStart = new Date("2026-05-20T09:00:00");
    const outerEnd = addMinutes(outerStart, 180);
    const innerStart = new Date("2026-05-20T10:00:00");
    const innerEnd = addMinutes(innerStart, 60);
    expect(intervalsOverlap(outerStart, outerEnd, innerStart, innerEnd)).toBe(true);
  });

  it("allows booking within salon hours", () => {
    const startsAt = new Date("2026-05-20T12:00:00");
    expect(() => assertWithinSalonHours(startsAt, 60)).not.toThrow();
  });

  it("allows service ending exactly at close hour", () => {
    const startsAt = new Date("2026-05-20T20:00:00");
    expect(() => assertWithinSalonHours(startsAt, 60)).not.toThrow();
  });

  it("rejects booking outside salon hours (too early)", () => {
    const startsAt = new Date("2026-05-20T08:00:00");
    expect(() => assertWithinSalonHours(startsAt, 60)).toThrow();
    expect(SALON_OPEN_HOUR).toBe(9);
    expect(SALON_CLOSE_HOUR).toBe(21);
  });

  it("rejects booking extending past close hour", () => {
    const startsAt = new Date("2026-05-20T20:30:00");
    expect(() => assertWithinSalonHours(startsAt, 60)).toThrow();
  });

  it("addMinutes offsets correctly", () => {
    const start = new Date("2026-05-20T10:00:00");
    const end = addMinutes(start, 45);
    expect(end.getTime() - start.getTime()).toBe(45 * 60_000);
  });
});
