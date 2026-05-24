import { describe, expect, it } from "vitest";
import { createTestCaller, mockSession } from "../helpers/trpc";

describe("appointments.create", () => {
  it("requires authentication", async () => {
    const caller = createTestCaller(null);
    await expect(
      caller.appointments.create({
        staffId: "00000000-0000-0000-0000-000000000001",
        serviceId: "00000000-0000-0000-0000-000000000002",
        startsAt: new Date()
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("admin without clientId returns BAD_REQUEST", async () => {
    const { session } = mockSession("admin");
    const caller = createTestCaller(session);
    await expect(
      caller.appointments.create({
        staffId: "00000000-0000-0000-0000-000000000001",
        serviceId: "00000000-0000-0000-0000-000000000002",
        startsAt: new Date()
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
