import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "dev-only-better-auth-secret-min-32-characters-long!!";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  secret: authSecret,
  baseURL,
  trustedOrigins: [baseURL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "client",
        input: false
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          if (createdUser.role !== "client") return;
          const existing = await db.query.salonClients.findFirst({
            where: eq(schema.salonClients.userId, createdUser.id)
          });
          if (existing) return;
          await db.insert(schema.salonClients).values({
            name: createdUser.name ?? createdUser.email.split("@")[0] ?? "Клиент",
            phone: `+7${createdUser.id.replace(/\D/g, "").slice(0, 10).padStart(10, "0")}`,
            email: createdUser.email,
            userId: createdUser.id
          });
        }
      }
    }
  },
  plugins: [nextCookies()]
});
