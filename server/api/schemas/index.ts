import { z } from "zod";

export const appointmentStatusSchema = z.enum(["scheduled", "completed", "cancelled"]);

export const idSchema = z.object({ id: z.string().uuid() });

export const clientInputSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(10).max(20),
  email: z.string().email()
});

export const staffInputSchema = z.object({
  name: z.string().min(2).max(120),
  specialization: z.string().min(2).max(120)
});

export const serviceInputSchema = z.object({
  name: z.string().min(2).max(120),
  durationMinutes: z.number().int().min(15).max(480),
  price: z.number().int().min(0)
});

export const appointmentCreateSchema = z.object({
  clientId: z.string().uuid().optional(),
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.coerce.date()
});

export const appointmentUpdateSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  startsAt: z.coerce.date().optional(),
  status: appointmentStatusSchema.optional()
});

export const appointmentListSchema = z.object({
  status: appointmentStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  staffId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional()
});

export const availabilitySchema = z.object({
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.coerce.date(),
  excludeAppointmentId: z.string().uuid().optional()
});

export const scheduleDaySchema = z.object({
  staffId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const scheduleWeekSchema = z.object({
  staffId: z.string().uuid(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const clientHistorySchema = z.object({
  clientId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).optional()
});

export const serviceUpcomingSchema = z.object({
  serviceId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).optional()
});
