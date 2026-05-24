import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import {
  assertAppointmentAccess,
  getClientIdForUser,
  getStaffIdForUser
} from "@/server/api/lib/access";
import {
  appointmentCreateSchema,
  appointmentListSchema,
  appointmentUpdateSchema,
  idSchema
} from "@/server/api/schemas";
import {
  adminOrClientProcedure,
  adminProcedure,
  protectedProcedure,
  router
} from "@/server/api/trpc";
import { isStaffAvailable } from "@/server/domain/availability";

async function resolveClientId(role: string, userId: string, clientId?: string) {
  if (role === "admin") {
    if (!clientId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Укажите clientId" });
    }
    return clientId;
  }
  const ownId = await getClientIdForUser(userId);
  if (!ownId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Профиль клиента не найден" });
  }
  return ownId;
}

export const appointmentsRouter = router({
  list: protectedProcedure.input(appointmentListSchema.optional()).query(async ({ ctx, input }) => {
    const role = ctx.user.role as "admin" | "staff" | "client";
    const filters = [];

    if (input?.status) filters.push(eq(schema.appointments.status, input.status));
    if (input?.from) filters.push(gte(schema.appointments.startsAt, input.from));
    if (input?.to) filters.push(lte(schema.appointments.startsAt, input.to));

    if (role === "client") {
      const clientId = await getClientIdForUser(ctx.user.id);
      if (!clientId) return [];
      filters.push(eq(schema.appointments.clientId, clientId));
    } else if (role === "staff") {
      const staffId = await getStaffIdForUser(ctx.user.id);
      if (!staffId) return [];
      filters.push(eq(schema.appointments.staffId, staffId));
    } else {
      if (input?.clientId) filters.push(eq(schema.appointments.clientId, input.clientId));
      if (input?.staffId) filters.push(eq(schema.appointments.staffId, input.staffId));
    }

    return db.query.appointments.findMany({
      where: filters.length ? and(...filters) : undefined,
      with: {
        client: true,
        staffMember: true,
        service: true
      },
      orderBy: (a, { asc }) => [asc(a.startsAt)]
    });
  }),

  create: adminOrClientProcedure.input(appointmentCreateSchema).mutation(async ({ ctx, input }) => {
    const clientId = await resolveClientId(ctx.user.role!, ctx.user.id, input.clientId);
    const service = await db.query.services.findFirst({
      where: eq(schema.services.id, input.serviceId)
    });
    if (!service) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Услуга не найдена" });
    }

    const available = await isStaffAvailable(input.staffId, input.startsAt, service.durationMinutes);
    if (!available) {
      throw new TRPCError({ code: "CONFLICT", message: "Мастер занят в это время" });
    }

    const [row] = await db
      .insert(schema.appointments)
      .values({
        clientId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        startsAt: input.startsAt,
        status: "scheduled"
      })
      .returning();

    return db.query.appointments.findFirst({
      where: eq(schema.appointments.id, row.id),
      with: { client: true, staffMember: true, service: true }
    });
  }),

  update: protectedProcedure.input(appointmentUpdateSchema).mutation(async ({ ctx, input }) => {
    const existing = await db.query.appointments.findFirst({
      where: eq(schema.appointments.id, input.id),
      with: { service: true }
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Запись не найдена" });
    }

    await assertAppointmentAccess(ctx.user.role as "admin" | "staff" | "client", ctx.user.id, existing);

    if (ctx.user.role === "client" && existing.status !== "scheduled") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Можно изменять только запланированные записи" });
    }

    const staffId = input.staffId ?? existing.staffId;
    const serviceId = input.serviceId ?? existing.serviceId;
    const startsAt = input.startsAt ?? existing.startsAt;

    const service = await db.query.services.findFirst({
      where: eq(schema.services.id, serviceId)
    });
    if (!service) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Услуга не найдена" });
    }

    if (input.startsAt || input.staffId || input.serviceId) {
      const available = await isStaffAvailable(
        staffId,
        startsAt,
        service.durationMinutes,
        existing.id
      );
      if (!available) {
        throw new TRPCError({ code: "CONFLICT", message: "Мастер занят в это время" });
      }
    }

    const [row] = await db
      .update(schema.appointments)
      .set({
        staffId,
        serviceId,
        startsAt,
        status: input.status ?? existing.status,
        updatedAt: new Date()
      })
      .where(eq(schema.appointments.id, input.id))
      .returning();

    return db.query.appointments.findFirst({
      where: eq(schema.appointments.id, row.id),
      with: { client: true, staffMember: true, service: true }
    });
  }),

  cancel: protectedProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const existing = await db.query.appointments.findFirst({
      where: eq(schema.appointments.id, input.id)
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Запись не найдена" });
    }

    await assertAppointmentAccess(ctx.user.role as "admin" | "staff" | "client", ctx.user.id, existing);

    if (existing.status === "cancelled") {
      return existing;
    }

    const [row] = await db
      .update(schema.appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.appointments.id, input.id))
      .returning();

    return row;
  }),

  upcomingByService: adminProcedure
    .input(z.object({ serviceId: z.string().uuid() }))
    .query(async ({ input }) => {
      const now = new Date();
      return db.query.appointments.findMany({
        where: and(
          eq(schema.appointments.serviceId, input.serviceId),
          gte(schema.appointments.startsAt, now),
          ne(schema.appointments.status, "cancelled")
        ),
        with: { client: true, staffMember: true, service: true },
        orderBy: (a, { asc }) => [asc(a.startsAt)]
      });
    })
});
