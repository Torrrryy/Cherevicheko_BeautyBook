import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addMinutes } from "@/server/domain/availability";
import { deleteTestDataByPrefix } from "../helpers/db";
import { isDatabaseAvailable } from "../helpers/database";
import { sampleClientInput, salonSlotAt } from "../helpers/fixtures";
import { createIntegrationFixture } from "../helpers/integration-fixture";
import { createCallerForRole } from "../helpers/trpc";

const hasDatabase = await isDatabaseAvailable();

describe.skipIf(!hasDatabase)("appointments integration", () => {
  let fx: Awaited<ReturnType<typeof createIntegrationFixture>>;

  beforeAll(async () => {
    fx = await createIntegrationFixture();
  });

  afterAll(async () => {
    await deleteTestDataByPrefix();
  });

  it("admin creates appointment with scheduled status", async () => {
    const startsAt = salonSlotAt(14, 0);
    const appt = await fx.admin.appointments.create({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });

    expect(appt).toBeTruthy();
    expect(appt!.status).toBe("scheduled");
    expect(appt!.client.id).toBe(fx.clientId);
    expect(appt!.staffMember.id).toBe(fx.staffId);
    expect(appt!.service.id).toBe(fx.service.id);
  });

  it("rejects second booking on occupied slot", async () => {
    const startsAt = salonSlotAt(15, 0);
    await fx.admin.appointments.create({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });

    await expect(
      fx.admin.appointments.create({
        clientId: fx.clientId,
        staffId: fx.staffId,
        serviceId: fx.service.id,
        startsAt
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects booking outside salon hours", async () => {
    const startsAt = salonSlotAt(8, 0);
    await expect(
      fx.admin.appointments.create({
        clientId: fx.clientId,
        staffId: fx.staffId,
        serviceId: fx.service.id,
        startsAt
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("cancels appointment and frees slot", async () => {
    const startsAt = salonSlotAt(16, 0);
    const appt = await fx.admin.appointments.create({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });

    const cancelled = await fx.admin.appointments.cancel({ id: appt!.id });
    expect(cancelled.status).toBe("cancelled");

    const availability = await fx.admin.staff.checkAvailability({
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });
    expect(availability.available).toBe(true);
  });

  it("updates appointment time excluding self", async () => {
    const startsAt = salonSlotAt(11, 0);
    const appt = await fx.admin.appointments.create({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });

    const newStart = addMinutes(startsAt, 120);
    const updated = await fx.admin.appointments.update({
      id: appt!.id,
      startsAt: newStart
    });

    expect(updated!.startsAt.getTime()).toBe(newStart.getTime());
  });

  it("client list returns only own appointments", async () => {
    const list = await fx.clientCaller.appointments.list();
    expect(list.every((a) => a.clientId === fx.clientId || a.client?.id === fx.clientId)).toBe(true);
  });

  it("staff list returns only own staff appointments", async () => {
    const list = await fx.staffCaller.appointments.list();
    expect(list.every((a) => a.staffId === fx.staffId || a.staffMember?.id === fx.staffId)).toBe(true);
  });

  it("client cannot update another clients appointment", async () => {
    const otherAdmin = await createCallerForRole("admin");
    const otherClient = await fx.admin.clients.create(sampleClientInput());

    const appt = await otherAdmin.appointments.create({
      clientId: otherClient.id,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt: salonSlotAt(13, 0)
    });

    await expect(
      fx.clientCaller.appointments.update({
        id: appt!.id,
        startsAt: salonSlotAt(13, 30)
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("client cannot update completed appointment", async () => {
    const startsAt = salonSlotAt(10, 0);
    const appt = await fx.admin.appointments.create({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt
    });

    await fx.admin.appointments.update({
      id: appt!.id,
      status: "completed"
    });

    await expect(
      fx.clientCaller.appointments.update({
        id: appt!.id,
        startsAt: addMinutes(startsAt, 30)
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
