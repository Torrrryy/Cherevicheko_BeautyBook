import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const SALON_OPEN_HOUR = 9;
export const SALON_CLOSE_HOUR = 21;

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export function assertWithinSalonHours(startsAt: Date, durationMinutes: number) {
  const end = addMinutes(startsAt, durationMinutes);
  const open = new Date(startsAt);
  open.setHours(SALON_OPEN_HOUR, 0, 0, 0);
  const close = new Date(startsAt);
  close.setHours(SALON_CLOSE_HOUR, 0, 0, 0);
  if (startsAt < open || end > close) {
    throw new Error(`Запись возможна только с ${SALON_OPEN_HOUR}:00 до ${SALON_CLOSE_HOUR}:00`);
  }
}

export async function getStaffAppointmentsInRange(staffId: string, from: Date, to: Date) {
  return db.query.appointments.findMany({
    where: and(
      eq(schema.appointments.staffId, staffId),
      gte(schema.appointments.startsAt, from),
      lt(schema.appointments.startsAt, to),
      ne(schema.appointments.status, "cancelled")
    ),
    with: {
      service: true,
      client: true
    },
    orderBy: (a, { asc }) => [asc(a.startsAt)]
  });
}

export async function isStaffAvailable(
  staffId: string,
  startsAt: Date,
  durationMinutes: number,
  excludeAppointmentId?: string
) {
  assertWithinSalonHours(startsAt, durationMinutes);
  const end = addMinutes(startsAt, durationMinutes);
  const dayStart = new Date(startsAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startsAt);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await getStaffAppointmentsInRange(staffId, dayStart, dayEnd);
  for (const appt of existing) {
    if (excludeAppointmentId && appt.id === excludeAppointmentId) continue;
    const apptEnd = addMinutes(appt.startsAt, appt.service.durationMinutes);
    if (intervalsOverlap(startsAt, end, appt.startsAt, apptEnd)) {
      return false;
    }
  }
  return true;
}
