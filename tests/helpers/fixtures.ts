export const TEST_PREFIX = "test-api";

export function uniqueTestId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function testEmail(suffix: string) {
  return `${TEST_PREFIX}-${suffix}@test.local`;
}

export function testPhone(suffix: string) {
  const digits = suffix.replace(/\D/g, "").padStart(7, "0").slice(-7);
  return `+7900${digits}${String(Date.now()).slice(-3)}`;
}

export function sampleClientInput(overrides?: Partial<{ name: string; phone: string; email: string }>) {
  const id = uniqueTestId("client");
  return {
    name: overrides?.name ?? `Клиент ${id}`,
    phone: overrides?.phone ?? testPhone(id),
    email: overrides?.email ?? testEmail(id)
  };
}

export function sampleStaffInput(overrides?: Partial<{ name: string; specialization: string }>) {
  const id = uniqueTestId("staff");
  return {
    name: overrides?.name ?? `${TEST_PREFIX} Мастер ${id}`,
    specialization: overrides?.specialization ?? "Парикмахер"
  };
}

export function sampleServiceInput(
  overrides?: Partial<{ name: string; durationMinutes: number; price: number }>
) {
  const id = uniqueTestId("svc");
  return {
    name: overrides?.name ?? `Услуга ${id}`,
    durationMinutes: overrides?.durationMinutes ?? 60,
    price: overrides?.price ?? 2000
  };
}

/** Дата в рабочих часах салона (по умолчанию завтра 12:00). */
export function salonSlotAt(hour = 12, minute = 0, dateStr?: string) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  if (!dateStr) {
    base.setDate(base.getDate() + 1);
  }
  base.setHours(hour, minute, 0, 0);
  return base;
}

export function sampleAppointmentInput(params: {
  clientId: string;
  staffId: string;
  serviceId: string;
  startsAt?: Date;
}) {
  return {
    clientId: params.clientId,
    staffId: params.staffId,
    serviceId: params.serviceId,
    startsAt: params.startsAt ?? salonSlotAt(12, 0)
  };
}

export function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}
