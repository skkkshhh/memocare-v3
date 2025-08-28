import { db } from './db';
import { 
  users, reminders, medications, medication_logs, contacts, locations, location_logs,
  journal_entries, memory_items, routines, tasks, quiz_questions, emergency_alerts,
  type User, type NewUser, type Reminder, type NewReminder,
  type Medication, type NewMedication, type MedicationLog, type NewMedicationLog,
  type Contact, type NewContact, type Location, type NewLocation,
  type LocationLog, type NewLocationLog, type JournalEntry, type NewJournalEntry,
  type MemoryItem, type NewMemoryItem, type Routine, type NewRoutine,
  type Task, type NewTask, type QuizQuestion, type NewQuizQuestion,
  type EmergencyAlert, type NewEmergencyAlert
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: NewUser): Promise<User>;

  // Reminders
  getReminders(userId: number): Promise<Reminder[]>;
  getReminderById(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: NewReminder): Promise<Reminder>;
  updateReminder(id: number, updates: Partial<NewReminder>): Promise<Reminder>;
  deleteReminder(id: number): Promise<void>;

  // Medications
  getMedications(userId: number): Promise<Medication[]>;
  getMedicationById(id: number): Promise<Medication | undefined>;
  createMedication(medication: NewMedication): Promise<Medication>;
  updateMedication(id: number, updates: Partial<NewMedication>): Promise<Medication>;
  deleteMedication(id: number): Promise<void>;

  // Medication Logs
  getMedicationLogs(medicationId: number): Promise<MedicationLog[]>;
  createMedicationLog(log: NewMedicationLog): Promise<MedicationLog>;

  // Contacts
  getContacts(userId: number): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  createContact(contact: NewContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<NewContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Locations
  getLocations(userId: number): Promise<Location[]>;
  createLocation(location: NewLocation): Promise<Location>;
  getLocationLogs(userId: number): Promise<LocationLog[]>;
  createLocationLog(log: NewLocationLog): Promise<LocationLog>;

  // Journal
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: NewJournalEntry): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<void>;

  // Memory Items
  getMemoryItems(userId: number): Promise<MemoryItem[]>;
  createMemoryItem(item: NewMemoryItem): Promise<MemoryItem>;
  deleteMemoryItem(id: number): Promise<void>;

  // Routines & Tasks
  getRoutines(userId: number): Promise<Routine[]>;
  createRoutine(routine: NewRoutine): Promise<Routine>;
  getTasks(routineId: number): Promise<Task[]>;
  createTask(task: NewTask): Promise<Task>;
  updateTask(id: number, updates: Partial<NewTask>): Promise<Task>;

  // Quiz
  getQuizQuestions(userId: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: NewQuizQuestion): Promise<QuizQuestion>;

  // Emergency
  getEmergencyAlerts(userId: number): Promise<EmergencyAlert[]>;
  createEmergencyAlert(alert: NewEmergencyAlert): Promise<EmergencyAlert>;
  resolveEmergencyAlert(id: number): Promise<EmergencyAlert>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.user_id, userId));
  }

  async getReminderById(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [created] = await db.insert(reminders).values(reminder).returning();
    return created;
  }

  async updateReminder(id: number, updates: Partial<InsertReminder>): Promise<Reminder> {
    const [updated] = await db.update(reminders).set(updates).where(eq(reminders.id, id)).returning();
    return updated;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  async getMedications(userId: number): Promise<Medication[]> {
    return db.select().from(medications).where(eq(medications.user_id, userId));
  }

  async getMedicationById(id: number): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication;
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [created] = await db.insert(medications).values(medication).returning();
    return created;
  }

  async updateMedication(id: number, updates: Partial<InsertMedication>): Promise<Medication> {
    const [updated] = await db.update(medications).set(updates).where(eq(medications.id, id)).returning();
    return updated;
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  async getMedicationLogs(medicationId: number): Promise<MedicationLog[]> {
    return db.select().from(medication_logs).where(eq(medication_logs.medication_id, medicationId)).orderBy(desc(medication_logs.taken_at));
  }

  async createMedicationLog(log: InsertMedicationLog): Promise<MedicationLog> {
    const [created] = await db.insert(medication_logs).values(log).returning();
    return created;
  }

  async getContacts(userId: number): Promise<Contact[]> {
    return db.select().from(contacts).where(eq(contacts.user_id, userId));
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db.insert(contacts).values(contact).returning();
    return created;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact> {
    const [updated] = await db.update(contacts).set(updates).where(eq(contacts.id, id)).returning();
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async getLocations(userId: number): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.user_id, userId));
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [created] = await db.insert(locations).values(location).returning();
    return created;
  }

  async getLocationLogs(userId: number): Promise<LocationLog[]> {
    return db.select().from(location_logs).where(eq(location_logs.user_id, userId)).orderBy(desc(location_logs.recorded_at));
  }

  async createLocationLog(log: InsertLocationLog): Promise<LocationLog> {
    const [created] = await db.insert(location_logs).values(log).returning();
    return created;
  }

  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return db.select().from(journal_entries).where(eq(journal_entries.user_id, userId)).orderBy(desc(journal_entries.created_at));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [created] = await db.insert(journal_entries).values(entry).returning();
    return created;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    await db.delete(journal_entries).where(eq(journal_entries.id, id));
  }

  async getMemoryItems(userId: number): Promise<MemoryItem[]> {
    return db.select().from(memory_items).where(eq(memory_items.user_id, userId)).orderBy(desc(memory_items.created_at));
  }

  async createMemoryItem(item: InsertMemoryItem): Promise<MemoryItem> {
    const [created] = await db.insert(memory_items).values(item).returning();
    return created;
  }

  async deleteMemoryItem(id: number): Promise<void> {
    await db.delete(memory_items).where(eq(memory_items.id, id));
  }

  async getRoutines(userId: number): Promise<Routine[]> {
    return db.select().from(routines).where(eq(routines.user_id, userId));
  }

  async createRoutine(routine: InsertRoutine): Promise<Routine> {
    const [created] = await db.insert(routines).values(routine).returning();
    return created;
  }

  async getTasks(routineId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.routine_id, routineId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async getQuizQuestions(userId: number): Promise<QuizQuestion[]> {
    return db.select().from(quiz_questions).where(eq(quiz_questions.user_id, userId));
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [created] = await db.insert(quiz_questions).values(question).returning();
    return created;
  }

  async getEmergencyAlerts(userId: number): Promise<EmergencyAlert[]> {
    return db.select().from(emergency_alerts).where(eq(emergency_alerts.user_id, userId)).orderBy(desc(emergency_alerts.triggered_at));
  }

  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [created] = await db.insert(emergency_alerts).values(alert).returning();
    return created;
  }

  async resolveEmergencyAlert(id: number): Promise<EmergencyAlert> {
    const [resolved] = await db.update(emergency_alerts).set({ resolved: true }).where(eq(emergency_alerts.id, id)).returning();
    return resolved;
  }
}

export const storage = new DatabaseStorage();
