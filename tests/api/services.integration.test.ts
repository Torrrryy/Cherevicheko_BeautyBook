import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestAppointment, deleteTestDataByPrefix } from "../helpers/db";
import { isDatabaseAvailable } from "../helpers/database";
import { sampleServiceInput, salonSlotAt } from "../helpers/fixtures";
import { createIntegrationFixture } from "../helpers/integration-fixture";
import { addDays } from "@/lib/utils";

const hasDatabase = await isDatabaseAvailable();

describe.skipIf(!hasDatabase)("services integration", () => {
  let fx: Awaited<ReturnType<typeof createIntegrationFixture>>;

  beforeAll(async () => {
    fx = await createIntegrationFixture();
  });

  afterAll(async () => {
    await deleteTestDataByPrefix();
  });

  it("client can list services", async () => {
    const list = await fx.clientCaller.services.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("upcomingAppointments excludes past and cancelled", async () => {
    const future = addDays(new Date(), 2);
    future.setHours(12, 0, 0, 0);

    await createTestAppointment({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt: future,
      status: "scheduled"
    });

    const past = salonSlotAt(12, 0);
    past.setDate(past.getDate() - 5);
    await createTestAppointment({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt: past,
      status: "scheduled"
    });

    const cancelledFuture = addDays(new Date(), 3);
    cancelledFuture.setHours(14, 0, 0, 0);
    await createTestAppointment({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt: cancelledFuture,
      status: "cancelled"
    });

    const upcoming = await fx.admin.services.upcomingAppointments({
      serviceId: fx.service.id
    });

    expect(upcoming.every((a) => a.startsAt >= new Date())).toBe(true);
    expect(upcoming.every((a) => a.status !== "cancelled")).toBe(true);
    expect(upcoming.some((a) => a.startsAt.getTime() === future.getTime())).toBe(true);
  });

  it("client cannot create service", async () => {
    await expect(fx.clientCaller.services.create(sampleServiceInput())).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });
});
