import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled"
]);

export const salonClients = pgTable(
  "salon_clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    email: text("email").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("salon_clients_user_idx").on(t.userId)]
);

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    specialization: text("specialization").notNull(),
    userId: text("user_id")
      .unique()
      .references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("staff_user_idx").on(t.userId)]
);

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => salonClients.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").default("scheduled").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index("appointments_staff_starts_idx").on(t.staffId, t.startsAt),
    index("appointments_client_starts_idx").on(t.clientId, t.startsAt),
    index("appointments_service_starts_idx").on(t.serviceId, t.startsAt)
  ]
);

export const salonClientsRelations = relations(salonClients, ({ one, many }) => ({
  user: one(user, { fields: [salonClients.userId], references: [user.id] }),
  appointments: many(appointments)
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(user, { fields: [staff.userId], references: [user.id] }),
  appointments: many(appointments)
}));

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments)
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(salonClients, { fields: [appointments.clientId], references: [salonClients.id] }),
  staffMember: one(staff, { fields: [appointments.staffId], references: [staff.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] })
}));
