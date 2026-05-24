import { eq, inArray, like, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  sampleClientInput,
  sampleStaffInput,
  TEST_PREFIX,
  testEmail,
  uniqueTestId
} from "./fixtures";
import type { TestRole } from "./trpc";

export async function ensureTestUser(
  role: TestRole,
  overrides?: Partial<{ id: string; email: string; name: string }>
) {
  const id = overrides?.id ?? `${TEST_PREFIX}-user-${role}-${uniqueTestId("u")}`;
  const email = overrides?.email ?? testEmail(`${role}-${id.slice(-8)}`);
  const name = overrides?.name ?? `Test ${role}`;

  const byId = await db.query.user.findFirst({ where: eq(schema.user.id, id) });
  if (byId) {
    await db
      .update(schema.user)
      .set({ role, name, emailVerified: true, updatedAt: new Date() })
      .where(eq(schema.user.id, id));
    return { id, email: byId.email, name, role };
  }

  const byEmail = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (byEmail) {
    await db
      .update(schema.user)
      .set({ role, name, emailVerified: true, updatedAt: new Date() })
      .where(eq(schema.user.id, byEmail.id));
    return { id: byEmail.id, email, name, role };
  }

  await db.insert(schema.user).values({
    id,
    email,
    name,
    role,
    emailVerified: true
  });

  return { id, email, name, role };
}

export async function ensureTestClient(
  userId?: string | null,
  overrides?: Partial<{ name: string; phone: string; email: string }>
) {
  const input = sampleClientInput(overrides);

  if (userId) {
    const linked = await db.query.salonClients.findFirst({
      where: eq(schema.salonClients.userId, userId)
    });
    if (linked) return linked;
  }

  const byEmail = await db.query.salonClients.findFirst({
    where: eq(schema.salonClients.email, input.email)
  });
  if (byEmail) {
    if (userId && !byEmail.userId) {
      const [updated] = await db
        .update(schema.salonClients)
        .set({ userId, updatedAt: new Date() })
        .where(eq(schema.salonClients.id, byEmail.id))
        .returning();
      return updated;
    }
    return byEmail;
  }

  const [row] = await db
    .insert(schema.salonClients)
    .values({ ...input, userId: userId ?? null })
    .returning();
  return row;
}

export async function ensureTestStaff(
  userId?: string | null,
  overrides?: Partial<{ name: string; specialization: string }>
) {
  const input = sampleStaffInput(overrides);

  if (userId) {
    const linked = await db.query.staff.findFirst({
      where: eq(schema.staff.userId, userId)
    });
    if (linked) return linked;
  }

  const [row] = await db.insert(schema.staff).values({ ...input, userId: userId ?? null }).returning();
  return row;
}

export async function createTestService(
  overrides?: Partial<{ name: string; durationMinutes: number; price: number }>
) {
  const input = {
    name: overrides?.name ?? `${TEST_PREFIX}-service-${uniqueTestId("s")}`,
    durationMinutes: overrides?.durationMinutes ?? 60,
    price: overrides?.price ?? 1500
  };
  const [row] = await db.insert(schema.services).values(input).returning();
  return row;
}

export async function createTestAppointment(params: {
  clientId: string;
  staffId: string;
  serviceId: string;
  startsAt: Date;
  status?: "scheduled" | "completed" | "cancelled";
}) {
  const [row] = await db
    .insert(schema.appointments)
    .values({
      clientId: params.clientId,
      staffId: params.staffId,
      serviceId: params.serviceId,
      startsAt: params.startsAt,
      status: params.status ?? "scheduled"
    })
    .returning();
  return row;
}

export async function deleteTestDataByPrefix(prefix: string = TEST_PREFIX) {
  const clients = await db.query.salonClients.findMany({
    where: or(
      like(schema.salonClients.email, `${prefix}%`),
      like(schema.salonClients.phone, `+7900%`)
    ),
    columns: { id: true, email: true }
  });
  const testClients = clients.filter((c) => c.email.includes(prefix));
  const clientIds = testClients.map((c) => c.id);

  if (clientIds.length > 0) {
    await db.delete(schema.appointments).where(inArray(schema.appointments.clientId, clientIds));
  }

  await db.delete(schema.salonClients).where(like(schema.salonClients.email, `${prefix}%`));

  const staffRows = await db.query.staff.findMany({
    where: like(schema.staff.name, `%${prefix}%`),
    columns: { id: true }
  });
  const staffIds = staffRows.map((s) => s.id);
  if (staffIds.length > 0) {
    await db.delete(schema.appointments).where(inArray(schema.appointments.staffId, staffIds));
    await db.delete(schema.staff).where(inArray(schema.staff.id, staffIds));
  }

  await db.delete(schema.services).where(like(schema.services.name, `${prefix}%`));
  await db.delete(schema.user).where(like(schema.user.email, `${prefix}%`));
}
