import { publicProcedure, router } from "@/server/api/trpc";
import { appointmentsRouter } from "@/server/api/routers/appointments";
import { clientsRouter } from "@/server/api/routers/clients";
import { servicesRouter } from "@/server/api/routers/services";
import { staffRouter } from "@/server/api/routers/staff";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, now: new Date().toISOString() })),
  appointments: appointmentsRouter,
  clients: clientsRouter,
  services: servicesRouter,
  staff: staffRouter
});

export type AppRouter = typeof appRouter;
