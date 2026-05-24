import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestAppointment, deleteTestDataByPrefix } from "../helpers/db";
import { isDatabaseAvailable } from "../helpers/database";
import { sampleStaffInput, salonSlotAt, toDateString } from "../helpers/fixtures";
import { createIntegrationFixture } from "../helpers/integration-fixture";
import { createCallerForRole } from "../helpers/trpc";

const hasDatabase = await isDatabaseAvailable();

describe.skipIf(!hasDatabase)("staff integration", () => {
  let fx: Awaited<ReturnType<typeof createIntegrationFixture>>;

  beforeAll(async () => {
    fx = await createIntegrationFixture();
  });

  afterAll(async () => {
    await deleteTestDataByPrefix();
  });

  it("checkAvailability returns true for free slot", async () => {
    const startsAt = salonSlotAt(17, 0);
    const result = await fx.admin.staff.checkAvailability({
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });
    expect(result.available).toBe(true);
  });

  it("checkAvailability returns false for busy slot", async () => {
    const startsAt = salonSlotAt(17, 30);
    await fx.admin.appointments.create({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });

    const result = await fx.admin.staff.checkAvailability({
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });
    expect(result.available).toBe(false);
  });

  it("scheduleByDay returns only appointments for that day", async () => {
    const day = salonSlotAt(12, 0);
    const date = toDateString(day);

    await createTestAppointment({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt: day
    });

    const nextDay = salonSlotAt(12, 0, toDateString(new Date(day.getTime() + 86_400_000)));
    await createTestAppointment({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt: nextDay
    });

    const schedule = await fx.admin.staff.scheduleByDay({
      staffId: fx.staffId,
      date
    });

    expect(schedule.length).toBeGreaterThanOrEqual(1);
    expect(schedule.every((a) => toDateString(a.startsAt) === date)).toBe(true);
  });

  it("scheduleByWeek excludes cancelled appointments", async () => {
    const weekStart = fx.weekStart;
    const slot = salonSlotAt(12, 0, weekStart);

    const appt = await createTestAppointment({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt: slot,
      status: "cancelled"
    });

    const schedule = await fx.admin.staff.scheduleByWeek({
      staffId: fx.staffId,
      weekStart
    });

    expect(schedule.find((a) => a.id === appt.id)).toBeUndefined();
  });

  it("staff can view own schedule", async () => {
    const date = toDateString(salonSlotAt(12, 0));
    const schedule = await fx.staffCaller.staff.scheduleByDay({
      staffId: fx.staffId,
      date
    });
    expect(Array.isArray(schedule)).toBe(true);
  });

  it("staff cannot view another staff schedule", async () => {
    const otherProfile = await fx.admin.staff.create(sampleStaffInput());

    await expect(
      fx.staffCaller.staff.scheduleByDay({
        staffId: otherProfile.id,
        date: fx.weekStart
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

  });

  it("admin can view any staff schedule", async () => {
    const schedule = await fx.admin.staff.scheduleByWeek({
      staffId: fx.staffId,
      weekStart: fx.weekStart
    });
    expect(Array.isArray(schedule)).toBe(true);
  });
});
