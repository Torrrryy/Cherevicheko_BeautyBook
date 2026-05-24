import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { addDays } from "@/lib/utils";
import { addMinutes } from "@/server/domain/availability";

const PASSWORD = "Salon123!";

async function setDemoPassword(userId: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(PASSWORD);
  await ctx.internalAdapter.updatePassword(userId, hash);
}

async function ensureUser(email: string, name: string, role: "admin" | "staff" | "client") {
  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, email)
  });
  if (existing) {
    await setDemoPassword(existing.id);
    return existing;
  }

  const res = await auth.api.signUpEmail({
    body: { email, password: PASSWORD, name, role }
  });
  if (!res.user) {
    throw new Error(`Не удалось создать пользователя ${email}`);
  }
  return res.user;
}

async function main() {
  console.log("Seeding salon data...");

  const admin = await ensureUser("admin@salon.local", "Администратор", "admin");

  const staffUsers = await Promise.all([
    ensureUser("anna@salon.local", "Анна Иванова", "staff"),
    ensureUser("maria@salon.local", "Мария Петрова", "staff"),
    ensureUser("elena@salon.local", "Елена Сидорова", "staff")
  ]);

  const clientUsers = await Promise.all([
    ensureUser("client1@salon.local", "Ольга Клиентова", "client"),
    ensureUser("client2@salon.local", "Игорь Клиентов", "client"),
    ensureUser("client3@salon.local", "Наталья Смирнова", "client")
  ]);

  const staffRows = [
    { name: "Анна Иванова", specialization: "Парикмахер", userId: staffUsers[0]!.id },
    { name: "Мария Петрова", specialization: "Маникюр", userId: staffUsers[1]!.id },
    { name: "Елена Сидорова", specialization: "Косметолог", userId: staffUsers[2]!.id }
  ];

  const masters = [];
  for (const s of staffRows) {
    const existing = await db.query.staff.findFirst({ where: eq(schema.staff.userId, s.userId) });
    if (existing) {
      masters.push(existing);
    } else {
      const [row] = await db.insert(schema.staff).values(s).returning();
      masters.push(row);
    }
  }

  const serviceData = [
    { name: "Женская стрижка", durationMinutes: 60, price: 2500 },
    { name: "Мужская стрижка", durationMinutes: 45, price: 1500 },
    { name: "Окрашивание", durationMinutes: 120, price: 5500 },
    { name: "Маникюр классический", durationMinutes: 60, price: 1800 },
    { name: "Педикюр", durationMinutes: 90, price: 2400 },
    { name: "Чистка лица", durationMinutes: 75, price: 3200 }
  ];

  let serviceRows = await db.query.services.findMany();
  if (serviceRows.length === 0) {
    serviceRows = await db.insert(schema.services).values(serviceData).returning();
  }

  const clients = await db.query.salonClients.findMany();
  let clientRows = clients;
  const demoExists = await db.query.salonClients.findFirst({
    where: eq(schema.salonClients.email, "demo@salon.local")
  });
  if (!demoExists) {
    const [demo] = await db
      .insert(schema.salonClients)
      .values({
        name: "Демо Клиент",
        phone: "+79001112233",
        email: "demo@salon.local",
        userId: null
      })
      .returning();
    clientRows = [...clientRows, demo];
  }

  const existingAppts = await db.query.appointments.findMany({ limit: 1 });
  if (existingAppts.length === 0 && clientRows[0] && masters[0] && serviceRows[0]) {
    const base = addDays(new Date(), 1);
    base.setHours(10, 0, 0, 0);

    const samples = [
      {
        clientId: clientRows[0]!.id,
        staffId: masters[0]!.id,
        serviceId: serviceRows[0]!.id,
        startsAt: base,
        status: "scheduled" as const
      },
      {
        clientId: clientRows[1]?.id ?? clientRows[0]!.id,
        staffId: masters[1]?.id ?? masters[0]!.id,
        serviceId: serviceRows[3]?.id ?? serviceRows[0]!.id,
        startsAt: addMinutes(addDays(base, 0), 120),
        status: "scheduled" as const
      },
      {
        clientId: clientRows[2]?.id ?? clientRows[0]!.id,
        staffId: masters[2]?.id ?? masters[0]!.id,
        serviceId: serviceRows[5]?.id ?? serviceRows[0]!.id,
        startsAt: addDays(base, 2),
        status: "scheduled" as const
      },
      {
        clientId: clientRows[0]!.id,
        staffId: masters[0]!.id,
        serviceId: serviceRows[1]!.id,
        startsAt: addDays(new Date(), -3),
        status: "completed" as const
      },
      {
        clientId: clientRows[0]!.id,
        staffId: masters[0]!.id,
        serviceId: serviceRows[0]!.id,
        startsAt: addDays(new Date(), -7),
        status: "cancelled" as const
      }
    ];

    await db.insert(schema.appointments).values(samples);
  }

  console.log("Seed complete.");
  console.log("Admin:", admin.email, PASSWORD);
  console.log("Staff:", staffUsers.map((u) => u.email).join(", "), PASSWORD);
  console.log("Clients:", clientUsers.map((u) => u.email).join(", "), PASSWORD);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
