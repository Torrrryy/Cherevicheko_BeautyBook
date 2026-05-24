import { TRPCError } from "@trpc/server";
import { and, eq, gte, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { serviceInputSchema, serviceUpcomingSchema } from "@/server/api/schemas";
import { adminProcedure, protectedProcedure, router } from "@/server/api/trpc";

export const servicesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.query.services.findMany({
      orderBy: (s, { asc }) => [asc(s.name)]
    });
  }),

  create: adminProcedure.input(serviceInputSchema).mutation(async ({ input }) => {
    const [row] = await db.insert(schema.services).values(input).returning();
    return row;
  }),

  update: adminProcedure
    .input(serviceInputSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [row] = await db
        .update(schema.services)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.services.id, id))
        .returning();
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Услуга не найдена" });
      }
      return row;
    }),

  upcomingAppointments: protectedProcedure.input(serviceUpcomingSchema).query(async ({ input }) => {
    const now = new Date();
    return db.query.appointments.findMany({
      where: and(
        eq(schema.appointments.serviceId, input.serviceId),
        gte(schema.appointments.startsAt, now),
        ne(schema.appointments.status, "cancelled")
      ),
      with: {
        client: true,
        staffMember: true,
        service: true
      },
      orderBy: (a, { asc }) => [asc(a.startsAt)],
      limit: input.limit ?? 50
    });
  })
});
