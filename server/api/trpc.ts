import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "@/lib/auth";

export type UserRole = "admin" | "staff" | "client";

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers
  });
  return { session, req: opts.req };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

type SessionUser = NonNullable<TRPCContext["session"]>["user"] & { role?: UserRole };

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Требуется вход в систему" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user as SessionUser
    }
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if ((ctx.user as SessionUser).role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Раздел доступен только администратору" });
  }
  return next({ ctx });
});

export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if ((ctx.user as SessionUser).role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Раздел доступен только мастерам" });
  }
  return next({ ctx });
});

export const clientProcedure = protectedProcedure.use(({ ctx, next }) => {
  if ((ctx.user as SessionUser).role !== "client") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Раздел доступен только клиентам" });
  }
  return next({ ctx });
});

export const adminOrClientProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = (ctx.user as SessionUser).role;
  if (role !== "admin" && role !== "client") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав" });
  }
  return next({ ctx });
});
