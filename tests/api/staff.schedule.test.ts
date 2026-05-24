import { describe, expect, it } from "vitest";
import { createTestCaller, mockSession } from "../helpers/trpc";

describe("staff schedule", () => {
  it("scheduleByDay requires auth", async () => {
    const caller = createTestCaller(null);
    await expect(
      caller.staff.scheduleByDay({
        staffId: "00000000-0000-0000-0000-000000000001",
        date: "2026-05-20"
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("client cannot view arbitrary staff schedule", async () => {
    const { session } = mockSession("client");
    const caller = createTestCaller(session);
    await expect(
      caller.staff.scheduleByDay({
        staffId: "00000000-0000-0000-0000-000000000099",
        date: "2026-05-20"
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
