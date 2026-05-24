import { describe, expect, it } from "vitest";
import {
  appointmentCreateSchema,
  clientInputSchema,
  scheduleDaySchema,
  serviceInputSchema
} from "@/server/api/schemas";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("Zod schemas", () => {
  it("parses valid client input", () => {
    const result = clientInputSchema.safeParse({
      name: "Иван Иванов",
      phone: "+79001234567",
      email: "ivan@test.local"
    });
    expect(result.success).toBe(true);
  });

  it("rejects short client name", () => {
    const result = clientInputSchema.safeParse({
      name: "A",
      phone: "+79001234567",
      email: "ivan@test.local"
    });
    expect(result.success).toBe(false);
  });

  it("parses valid service input", () => {
    const result = serviceInputSchema.safeParse({
      name: "Стрижка",
      durationMinutes: 60,
      price: 2500
    });
    expect(result.success).toBe(true);
  });

  it("rejects duration below minimum", () => {
    const result = serviceInputSchema.safeParse({
      name: "Стрижка",
      durationMinutes: 10,
      price: 2500
    });
    expect(result.success).toBe(false);
  });

  it("parses appointment create without clientId", () => {
    const result = appointmentCreateSchema.safeParse({
      staffId: validUuid,
      serviceId: validUuid,
      startsAt: "2026-05-20T12:00:00"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientId).toBeUndefined();
    }
  });

  it("rejects invalid uuid in appointment create", () => {
    const result = appointmentCreateSchema.safeParse({
      staffId: "not-a-uuid",
      serviceId: validUuid,
      startsAt: "2026-05-20T12:00:00"
    });
    expect(result.success).toBe(false);
  });

  it("parses schedule day format", () => {
    const result = scheduleDaySchema.safeParse({
      staffId: validUuid,
      date: "2026-05-20"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid schedule day format", () => {
    const result = scheduleDaySchema.safeParse({
      staffId: validUuid,
      date: "20-05-2026"
    });
    expect(result.success).toBe(false);
  });
});
