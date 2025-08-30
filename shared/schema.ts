import { pgTable, text, serial, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // medication|meal|appointment|task
  schedule_cron: text("schedule_cron").notNull(),
  next_run_at: timestamp("next_run_at").notNull(),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// Medications table
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

// Medication logs table
export const medication_logs = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  medication_id: integer("medication_id").notNull().references(() => medications.id),
  taken_at: timestamp("taken_at").notNull(),
  status: text("status").notNull(), // taken|missed
  created_at: timestamp("created_at").defaultNow(),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  relation: text("relation").notNull(),
  phone: text("phone"),
  email: text("email"),
  photo_path: text("photo_path"),
  created_at: timestamp("created_at").defaultNow(),
});

// Locations table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  context: text("context"),
  created_at: timestamp("created_at").defaultNow(),
});

// Location logs table
export const location_logs = pgTable("location_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  recorded_at: timestamp("recorded_at").defaultNow(),
});

// Journal entries table
export const journal_entries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // text|audio
  content_text: text("content_text"),
  audio_path: text("audio_path"),
  created_at: timestamp("created_at").defaultNow(),
});

// Memory items table
export const memory_items = pgTable("memory_items", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // photo|video|audio
  file_path: text("file_path").notNull(),
  title: text("title").notNull(),
  tags: text("tags"), // CSV format
  created_at: timestamp("created_at").defaultNow(),
});

// Routines table
export const routines = pgTable("routines", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  routine_id: integer("routine_id").notNull().references(() => routines.id),
  title: text("title").notNull(),
  done: boolean("done").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Quiz questions table
export const quiz_questions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Emergency alerts table
export const emergency_alerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  triggered_at: timestamp("triggered_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
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
