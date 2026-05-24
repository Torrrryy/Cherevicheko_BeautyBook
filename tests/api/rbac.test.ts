import { afterAll, describe, expect, it } from "vitest";
import { deleteTestDataByPrefix } from "../helpers/db";
import { isDatabaseAvailable } from "../helpers/database";
import { sampleClientInput, sampleServiceInput, sampleStaffInput } from "../helpers/fixtures";
import { createIntegrationFixture } from "../helpers/integration-fixture";
import { createCallerForRole, createTestCaller } from "../helpers/trpc";

const hasDatabase = await isDatabaseAvailable();

describe.skipIf(!hasDatabase)("RBAC integration", () => {
  afterAll(async () => {
    await deleteTestDataByPrefix();
  });

  it("staff cannot list clients", async () => {
    const staff = await createCallerForRole("staff");
    await expect(staff.clients.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("client cannot create clients", async () => {
    const client = await createCallerForRole("client");
    await expect(client.clients.create(sampleClientInput())).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("staff cannot create staff", async () => {
    const staff = await createCallerForRole("staff");
    await expect(staff.staff.create(sampleStaffInput())).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("client cannot view another staff week schedule", async () => {
    const fx = await createIntegrationFixture();
    const client = await createCallerForRole("client");
    const otherStaff = await fx.admin.staff.create(sampleStaffInput());

    await expect(
      client.staff.scheduleByWeek({
        staffId: otherStaff.id,
        weekStart: fx.weekStart
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin health is public", async () => {
    const caller = createTestCaller(null);
    const health = await caller.health();
    expect(health.ok).toBe(true);
  });

  it("client can list services", async () => {
    const client = await createCallerForRole("client");
    const list = await client.services.list();
    expect(Array.isArray(list)).toBe(true);
  });
});
