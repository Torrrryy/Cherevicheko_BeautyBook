import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestAppointment, deleteTestDataByPrefix } from "../helpers/db";
import { isDatabaseAvailable } from "../helpers/database";
import { sampleClientInput, salonSlotAt } from "../helpers/fixtures";
import { createIntegrationFixture } from "../helpers/integration-fixture";

const hasDatabase = await isDatabaseAvailable();

describe.skipIf(!hasDatabase)("clients integration", () => {
  let fx: Awaited<ReturnType<typeof createIntegrationFixture>>;

  beforeAll(async () => {
    fx = await createIntegrationFixture();
  });

  afterAll(async () => {
    await deleteTestDataByPrefix();
  });

  it("admin creates client and lists it", async () => {
    const input = sampleClientInput();
    const created = await fx.admin.clients.create(input);
    const list = await fx.admin.clients.list();

    expect(list.some((c) => c.id === created.id)).toBe(true);
    expect(created.email).toBe(input.email);
  });

  it("clients.history returns appointments with relations", async () => {
    const startsAt = salonSlotAt(12, 0);
    await createTestAppointment({
      clientId: fx.clientId,
      staffId: fx.staffId,
      serviceId: fx.service.id,
      startsAt,
      status: "completed"
    });

    const history = await fx.admin.clients.history({ clientId: fx.clientId });
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].service).toBeTruthy();
    expect(history[0].staffMember).toBeTruthy();
  });

  it("client can read own history", async () => {
    const history = await fx.clientCaller.clients.history({ clientId: fx.clientId });
    expect(Array.isArray(history)).toBe(true);
  });

  it("client cannot read another client history", async () => {
    const other = await fx.admin.clients.create(sampleClientInput());
    await expect(fx.clientCaller.clients.history({ clientId: other.id })).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("staff can read any client history", async () => {
    const history = await fx.staffCaller.clients.history({ clientId: fx.clientId });
    expect(Array.isArray(history)).toBe(true);
  });
});
