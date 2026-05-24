import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { addDays, startOfDay } from "@/lib/utils";
import {
  assertStaffAccess,
  getStaffIdForUser
} from "@/server/api/lib/access";
import {
  availabilitySchema,
  scheduleDaySchema,
  scheduleWeekSchema,
  staffInputSchema
} from "@/server/api/schemas";
import {
  adminProcedure,
  adminOrClientProcedure,
  protectedProcedure,
  router,
  staffProcedure
} from "@/server/api/trpc";
import {
  getStaffAppointmentsInRange,
  isStaffAvailable
} from "@/server/domain/availability";

export const staffRouter = router({
  list: protectedProcedure.query(async () => {
    return db.query.staff.findMany({
      orderBy: (s, { asc }) => [asc(s.name)]
    });
  }),

  create: adminProcedure.input(staffInputSchema).mutation(async ({ input }) => {
    const [row] = await db.insert(schema.staff).values(input).returning();
    return row;
  }),

  update: adminProcedure
    .input(staffInputSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [row] = await db
        .update(schema.staff)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.staff.id, id))
        .returning();
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Мастер не найден" });
      }
      return row;
    }),

  checkAvailability: adminOrClientProcedure
    .input(availabilitySchema)
    .query(async ({ input }) => {
      const service = await db.query.services.findFirst({
        where: eq(schema.services.id, input.serviceId)
      });
      if (!service) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Услуга не найдена" });
      }
      try {
        const available = await isStaffAvailable(
          input.staffId,
          input.startsAt,
          service.durationMinutes,
          input.excludeAppointmentId
        );
        return { available };
      } catch (e) {
        return { available: false, reason: e instanceof Error ? e.message : "Недоступно" };
      }
    }),

  scheduleByDay: protectedProcedure.input(scheduleDaySchema).query(async ({ ctx, input }) => {
    await assertStaffAccess(ctx.user.role as "admin" | "staff" | "client", ctx.user.id, input.staffId);
    const day = new Date(`${input.date}T00:00:00`);
    return getStaffAppointmentsInRange(
      input.staffId,
      startOfDay(day),
      startOfDay(addDays(day, 1))
    );
  }),

  scheduleByWeek: protectedProcedure.input(scheduleWeekSchema).query(async ({ ctx, input }) => {
    await assertStaffAccess(ctx.user.role as "admin" | "staff" | "client", ctx.user.id, input.staffId);
    const weekStart = new Date(`${input.weekStart}T00:00:00`);
    const from = startOfDay(weekStart);
    const to = startOfDay(addDays(weekStart, 7));
    return getStaffAppointmentsInRange(input.staffId, from, to);
  }),

  myProfile: staffProcedure.query(async ({ ctx }) => {
    const staffId = await getStaffIdForUser(ctx.user.id);
    if (!staffId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Профиль мастера не привязан" });
    }
    return db.query.staff.findFirst({
      where: eq(schema.staff.id, staffId)
    });
  })
});
