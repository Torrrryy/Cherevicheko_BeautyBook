import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/routers/app";
import type { TRPCContext } from "@/server/api/trpc";
import { ensureTestClient, ensureTestStaff, ensureTestUser } from "./db";

export type TestRole = "admin" | "staff" | "client";

export function mockSession(role: TestRole, overrides?: Partial<{ id: string; email: string; name: string }>) {
  const id = overrides?.id ?? `test-${role}-id`;
  return {
    session: {
      user: {
        id,
        email: overrides?.email ?? `${id}@test.local`,
        name: overrides?.name ?? `Test ${role}`,
        role,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      session: {
        id: `session-${id}`,
        userId: id,
        expiresAt: new Date(Date.now() + 86_400_000),
        token: `token-${id}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  };
}

export function createTestContext(session: TRPCContext["session"] | null = null): TRPCContext {
  const req = new Request("http://localhost:3001/api/trpc");
  const opts = { req, resHeaders: new Headers() } as FetchCreateContextFnOptions;
  void opts;
  return { session, req };
}

export function createTestCaller(session: TRPCContext["session"] | null = null) {
  return appRouter.createCaller(createTestContext(session));
}

export async function createCallerForRole(
  role: TestRole,
  overrides?: Partial<{ id: string; email: string; name: string }>
) {
  const user = await ensureTestUser(role, overrides);
  if (role === "client") {
    await ensureTestClient(user.id, overrides?.email ? { email: overrides.email } : undefined);
  }
  if (role === "staff") {
    await ensureTestStaff(user.id, overrides?.name ? { name: overrides.name } : undefined);
  }
  const { session } = mockSession(role, { id: user.id, email: user.email, name: user.name });
  return createTestCaller(session);
}
