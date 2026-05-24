import { createTestService, ensureTestClient, ensureTestStaff, ensureTestUser } from "./db";
import { salonSlotAt, toDateString } from "./fixtures";
import { createCallerForRole, createTestCaller, mockSession } from "./trpc";

export async function createIntegrationFixture() {
  const admin = await createCallerForRole("admin");

  const clientUser = await ensureTestUser("client");
  const staffUser = await ensureTestUser("staff");
  const clientRow = await ensureTestClient(clientUser.id);
  const staffRow = await ensureTestStaff(staffUser.id);

  const { session: clientSession } = mockSession("client", {
    id: clientUser.id,
    email: clientUser.email,
    name: clientUser.name
  });
  const { session: staffSession } = mockSession("staff", {
    id: staffUser.id,
    email: staffUser.email,
    name: staffUser.name
  });

  const clientCaller = createTestCaller(clientSession);
  const staffCaller = createTestCaller(staffSession);

  const service = await createTestService({ durationMinutes: 60 });
  const slot = salonSlotAt(12, 0);
  const weekStart = toDateString(slot);

  return {
    admin,
    clientCaller,
    staffCaller,
    clientId: clientRow.id,
    staffId: staffRow.id,
    service,
    slot,
    weekStart
  };
}
