import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { assertClientAccess } from "@/server/api/lib/access";
import { clientHistorySchema, clientInputSchema, idSchema } from "@/server/api/schemas";
import { adminProcedure, protectedProcedure, router } from "@/server/api/trpc";

export const clientsRouter = router({
  list: adminProcedure.query(async () => {
    return db.query.salonClients.findMany({
      orderBy: (c, { asc }) => [asc(c.name)]
    });
  }),

  create: adminProcedure.input(clientInputSchema).mutation(async ({ input }) => {
    const [row] = await db.insert(schema.salonClients).values(input).returning();
    return row;
  }),

  update: adminProcedure
    .input(clientInputSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [row] = await db
        .update(schema.salonClients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.salonClients.id, id))
        .returning();
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Клиент не найден" });
      }
      return row;
    }),

  history: protectedProcedure.input(clientHistorySchema).query(async ({ ctx, input }) => {
    await assertClientAccess(ctx.user.role as "admin" | "staff" | "client", ctx.user.id, input.clientId);
    return db.query.appointments.findMany({
      where: eq(schema.appointments.clientId, input.clientId),
      with: {
        service: true,
        staffMember: true
      },
      orderBy: (a, { desc: d }) => [d(a.startsAt)],
      limit: input.limit ?? 50
    });
  }),

  byId: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const row = await db.query.salonClients.findFirst({
      where: eq(schema.salonClients.id, input.id)
    });
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Клиент не найден" });
    }
    await assertClientAccess(ctx.user.role as "admin" | "staff" | "client", ctx.user.id, input.id);
    return row;
  })
});
