import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Reminders table
export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // medication|meal|appointment|task
  schedule_cron: text("schedule_cron").notNull(),
  next_run_at: integer("next_run_at", { mode: "timestamp" }).notNull(),
  active: integer("active", { mode: "boolean" }).default(true),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Medications table
export const medications = sqliteTable("medications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  notes: text("notes"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Medication logs table
export const medication_logs = sqliteTable("medication_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medication_id: integer("medication_id").notNull().references(() => medications.id),
  taken_at: integer("taken_at", { mode: "timestamp" }).notNull(),
  status: text("status").notNull(), // taken|missed
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Contacts table
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  relation: text("relation").notNull(),
  phone: text("phone"),
  email: text("email"),
  photo_path: text("photo_path"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Locations table
export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  context: text("context"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Location logs table
export const location_logs = sqliteTable("location_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  recorded_at: integer("recorded_at", { mode: "timestamp" }).defaultNow(),
});

// Journal entries table
export const journal_entries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // text|audio
  content_text: text("content_text"),
  audio_path: text("audio_path"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Memory items table
export const memory_items = sqliteTable("memory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // photo|video|audio
  file_path: text("file_path").notNull(),
  title: text("title").notNull(),
  tags: text("tags"), // CSV format
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Routines table
export const routines = sqliteTable("routines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Tasks table
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routine_id: integer("routine_id").notNull().references(() => routines.id),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).default(false),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Quiz questions table
export const quiz_questions = sqliteTable("quiz_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Emergency alerts table
export const emergency_alerts = sqliteTable("emergency_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id),
  triggered_at: integer("triggered_at", { mode: "timestamp" }).defaultNow(),
  resolved_at: integer("resolved_at", { mode: "timestamp" }),
  status: text("status").notNull().default("active"), // active|resolved
});

// Schemas for validation
export const loginSchema = createInsertSchema(users).pick({
  email: true,
  password_hash: true,
});

export const registerSchema = createInsertSchema(users).pick({
  email: true,
  password_hash: true,
  name: true,
});

export const reminderSchema = createInsertSchema(reminders).omit({
  id: true,
  created_at: true,
});

export const medicationSchema = createInsertSchema(medications).omit({
  id: true,
  created_at: true,
});

export const contactSchema = createInsertSchema(contacts).omit({
  id: true,
  created_at: true,
});

export const locationSchema = createInsertSchema(locations).omit({
  id: true,
  created_at: true,
});

export const journalSchema = createInsertSchema(journal_entries).omit({
  id: true,
  created_at: true,
});

export const memoryItemSchema = createInsertSchema(memory_items).omit({
  id: true,
  created_at: true,
});

export const routineSchema = createInsertSchema(routines).omit({
  id: true,
  created_at: true,
});

export const taskSchema = createInsertSchema(tasks).omit({
  id: true,
  created_at: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
export type MedicationLog = typeof medication_logs.$inferSelect;
export type NewMedicationLog = typeof medication_logs.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type LocationLog = typeof location_logs.$inferSelect;
export type NewLocationLog = typeof location_logs.$inferInsert;
export type JournalEntry = typeof journal_entries.$inferSelect;
export type NewJournalEntry = typeof journal_entries.$inferInsert;
export type MemoryItem = typeof memory_items.$inferSelect;
export type NewMemoryItem = typeof memory_items.$inferInsert;
export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type QuizQuestion = typeof quiz_questions.$inferSelect;
export type NewQuizQuestion = typeof quiz_questions.$inferInsert;
export type EmergencyAlert = typeof emergency_alerts.$inferSelect;
export type NewEmergencyAlert = typeof emergency_alerts.$inferInsert;
