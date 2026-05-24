import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { UserRole } from "@/server/api/trpc";

export async function getClientIdForUser(userId: string) {
  const row = await db.query.salonClients.findFirst({
    where: eq(schema.salonClients.userId, userId),
    columns: { id: true }
  });
  return row?.id ?? null;
}

export async function getStaffIdForUser(userId: string) {
  const row = await db.query.staff.findFirst({
    where: eq(schema.staff.userId, userId),
    columns: { id: true }
  });
  return row?.id ?? null;
}

export async function assertClientAccess(role: UserRole, userId: string, clientId: string) {
  if (role === "admin" || role === "staff") return;
  const ownId = await getClientIdForUser(userId);
  if (ownId !== clientId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Нет доступа к данным клиента" });
  }
}

export async function assertStaffAccess(role: UserRole, userId: string, staffId: string) {
  if (role === "admin") return;
  if (role === "staff") {
    const ownId = await getStaffIdForUser(userId);
    if (ownId !== staffId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Нет доступа к расписанию мастера" });
    }
    return;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав" });
}

export async function assertAppointmentAccess(
  role: UserRole,
  userId: string,
  appointment: { clientId: string; staffId: string }
) {
  if (role === "admin") return;
  if (role === "client") {
    const ownClientId = await getClientIdForUser(userId);
    if (ownClientId !== appointment.clientId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Нет доступа к записи" });
    }
    return;
  }
  if (role === "staff") {
    const ownStaffId = await getStaffIdForUser(userId);
    if (ownStaffId !== appointment.staffId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Нет доступа к записи" });
    }
    return;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав" });
}
