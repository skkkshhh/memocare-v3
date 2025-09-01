import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
import cors from "cors";
import path from "path";
import fs from "fs";

import { storage } from "./storage";
import { config } from "./config";
import { ensureAuth } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { hashPassword, verifyPassword } from "./utils/password";
import { loginSchema, registerSchema, reminderSchema, medicationLogSchema, locationLogSchema } from "./utils/validators";
import { initializeScheduler } from "./utils/scheduler";

const SqliteStore = SQLiteStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup CORS
  app.use(cors({
    origin: config.clientOrigin,
    credentials: true
  }));

  // Setup session store
  app.use(session({
    store: new SqliteStore({ db: 'sessions.db' }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup Socket.IO
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.clientOrigin,
      credentials: true
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-user', (userId: number) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Initialize scheduler with socket.io
  initializeScheduler(io);

  // Serve uploaded files
  const uploadsDir = path.join(process.cwd(), 'server/public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const password_hash = await hashPassword(password);
      const user = await storage.createUser({ email, password_hash, name });
      
      req.session.userId = user.id;
      res.json({ id: user.id, email: user.email, name: user.name });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.password_hash))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, email: user.email, name: user.name });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out' });
    });
  });

  app.get('/api/auth/me', ensureAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ id: user.id, email: user.email, name: user.name });
  });

  // Reminders routes
  app.get('/api/reminders', ensureAuth, async (req: Request, res: Response) => {
    const reminders = await storage.getReminders(req.session.userId!);
    res.json(reminders);
  });

  app.post('/api/reminders', ensureAuth, async (req: Request, res: Response) => {
    try {
      const data = reminderSchema.parse(req.body);
      const reminder = await storage.createReminder({
        ...data,
        user_id: req.session.userId!,
        next_run_at: new Date(data.next_run_at)
      });
      res.json(reminder);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.put('/api/reminders/:id', ensureAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const reminder = await storage.updateReminder(id, updates);
      res.json(reminder);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.delete('/api/reminders/:id', ensureAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReminder(id);
      res.json({ message: 'Reminder deleted' });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Medications routes
  app.get('/api/medications', ensureAuth, async (req: Request, res: Response) => {
    const medications = await storage.getMedications(req.session.userId!);
    res.json(medications);
  });

  app.post('/api/medications', ensureAuth, async (req: Request, res: Response) => {
    try {
      const medication = await storage.createMedication({
        ...req.body,
        user_id: req.session.userId!
      });
      res.json(medication);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.get('/api/medications/:id/logs', ensureAuth, async (req: Request, res: Response) => {
    const medicationId = parseInt(req.params.id);
    const logs = await storage.getMedicationLogs(medicationId);
    res.json(logs);
  });

  app.post('/api/medications/:id/logs', ensureAuth, async (req: Request, res: Response) => {
    try {
      const medicationId = parseInt(req.params.id);
      const { status, taken_at } = medicationLogSchema.parse(req.body);
      const log = await storage.createMedicationLog({
        medication_id: medicationId,
        status,
        taken_at: new Date(taken_at)
      });
      res.json(log);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Contacts routes
  app.get('/api/contacts', ensureAuth, async (req: Request, res: Response) => {
    const contacts = await storage.getContacts(req.session.userId!);
    res.json(contacts);
  });

  app.post('/api/contacts', ensureAuth, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      const contact = await storage.createContact({
        ...req.body,
        user_id: req.session.userId!,
        photo_path: req.file ? `/uploads/${req.file.filename}` : null
      });
      res.json(contact);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Locations routes
  app.get('/api/locations', ensureAuth, async (req: Request, res: Response) => {
    const locations = await storage.getLocations(req.session.userId!);
    res.json(locations);
  });

  app.post('/api/locations', ensureAuth, async (req: Request, res: Response) => {
    try {
      const location = await storage.createLocation({
        ...req.body,
        user_id: req.session.userId!
      });
      res.json(location);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.get('/api/locations/logs', ensureAuth, async (req: Request, res: Response) => {
    const logs = await storage.getLocationLogs(req.session.userId!);
    res.json(logs);
  });

  app.post('/api/locations/logs', ensureAuth, async (req: Request, res: Response) => {
    try {
      const { lat, lng } = locationLogSchema.parse(req.body);
      const log = await storage.createLocationLog({
        user_id: req.session.userId!,
        lat,
        lng
      });
      res.json(log);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Journal routes
  app.get('/api/journal', ensureAuth, async (req: Request, res: Response) => {
    const entries = await storage.getJournalEntries(req.session.userId!);
    res.json(entries);
  });

  app.post('/api/journal', ensureAuth, upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const entry = await storage.createJournalEntry({
        user_id: req.session.userId!,
        type: req.body.type,
        content_text: req.body.content_text,
        audio_path: req.file ? `/uploads/${req.file.filename}` : null
      });
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Memory wall routes
  app.get('/api/memory', ensureAuth, async (req: Request, res: Response) => {
    const items = await storage.getMemoryItems(req.session.userId!);
    res.json(items);
  });

  app.post('/api/memory', ensureAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required' });
      }

      const item = await storage.createMemoryItem({
        user_id: req.session.userId!,
        type: req.body.type,
        file_path: `/uploads/${req.file.filename}`,
        title: req.body.title,
        tags: req.body.tags
      });
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Routines routes
  app.get('/api/routines', ensureAuth, async (req: Request, res: Response) => {
    const routines = await storage.getRoutines(req.session.userId!);
    res.json(routines);
  });

  app.post('/api/routines', ensureAuth, async (req: Request, res: Response) => {
    try {
      const routine = await storage.createRoutine({
        ...req.body,
        user_id: req.session.userId!
      });
      res.json(routine);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.get('/api/routines/:id/tasks', ensureAuth, async (req: Request, res: Response) => {
    const routineId = parseInt(req.params.id);
    const tasks = await storage.getTasks(routineId);
    res.json(tasks);
  });

  app.post('/api/routines/:id/tasks', ensureAuth, async (req: Request, res: Response) => {
    try {
      const routineId = parseInt(req.params.id);
      const task = await storage.createTask({
        ...req.body,
        routine_id: routineId
      });
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.put('/api/tasks/:id', ensureAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Games/Quiz routes
  app.get('/api/games/quiz', ensureAuth, async (req: Request, res: Response) => {
    try {
      // Generate quiz questions from contacts, medications, and memory items
      const contacts = await storage.getContacts(req.session.userId!);
      const medications = await storage.getMedications(req.session.userId!);
      const memoryItems = await storage.getMemoryItems(req.session.userId!);

      const questions = [];

      // Helper function to generate wrong options that are similar but different
      const generateOptions = (correct: string, type: string, allData: any[]) => {
        const options = [correct];
        const similar = allData.map(item => {
          if (type === 'relation') return item.relation;
          if (type === 'dosage') return item.dosage;
          if (type === 'frequency') return item.frequency;
          if (type === 'name') return item.name;
          return '';
        }).filter(val => val && val !== correct);
        
        // Add some generic options if not enough similar ones
        const genericOptions = {
          relation: ['Daughter', 'Son', 'Friend', 'Doctor', 'Neighbor', 'Spouse', 'Caregiver'],
          dosage: ['5mg', '10mg', '15mg', '20mg', '25mg', '50mg', '100mg'],
          frequency: ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'],
          name: ['John', 'Mary', 'David', 'Sarah', 'Michael', 'Lisa']
        };
        
        const pool = [...similar, ...(genericOptions[type] || [])].filter(opt => opt !== correct);
        
        // Randomly select 3 wrong options
        while (options.length < 4 && pool.length > 0) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          const option = pool.splice(randomIndex, 1)[0];
          if (!options.includes(option)) {
            options.push(option);
          }
        }
        
        // Shuffle the options
        return options.sort(() => 0.5 - Math.random());
      };

      // Generate questions from contacts
      contacts.slice(0, 3).forEach(contact => {
        if (contact.name && contact.relation) {
          questions.push({
            type: 'contact',
            question: `What is ${contact.name}'s relationship to you?`,
            answer: contact.relation,
            options: generateOptions(contact.relation, 'relation', contacts)
          });
        }

        if (contact.name && contact.phone) {
          // Create phone number questions (last 4 digits for privacy)
          const lastFour = contact.phone.slice(-4);
          questions.push({
            type: 'contact',
            question: `What are the last four digits of ${contact.name}'s phone number?`,
            answer: lastFour,
            options: [lastFour, 
              Math.floor(Math.random() * 9000 + 1000).toString(),
              Math.floor(Math.random() * 9000 + 1000).toString(),
              Math.floor(Math.random() * 9000 + 1000).toString()
            ].sort(() => 0.5 - Math.random())
          });
        }
      });

      // Generate questions from medications
      medications.slice(0, 3).forEach(med => {
        if (med.name && med.dosage) {
          questions.push({
            type: 'medication',
            question: `What is the dosage for ${med.name}?`,
            answer: med.dosage,
            options: generateOptions(med.dosage, 'dosage', medications)
          });
        }

        if (med.name && med.frequency) {
          questions.push({
            type: 'medication',
            question: `How often should you take ${med.name}?`,
            answer: med.frequency,
            options: generateOptions(med.frequency, 'frequency', medications)
          });
        }

        if (med.name && med.time) {
          questions.push({
            type: 'medication',
            question: `What time should you take ${med.name}?`,
            answer: med.time,
            options: [med.time, '8:00 AM', '12:00 PM', '6:00 PM', '9:00 PM'].filter((time, index, arr) => arr.indexOf(time) === index).slice(0, 4).sort(() => 0.5 - Math.random())
          });
        }
      });

      // Generate questions from memory items
      memoryItems.slice(0, 2).forEach(memory => {
        if (memory.title && memory.tags) {
          const tags = memory.tags.split(',').map(tag => tag.trim()).filter(Boolean);
          if (tags.length > 0) {
            const correctTag = tags[0];
            questions.push({
              type: 'memory',
              question: `Which tag is associated with the memory "${memory.title}"?`,
              answer: correctTag,
              options: [correctTag, 'family', 'vacation', 'celebration', 'friends'].filter((tag, index, arr) => arr.indexOf(tag) === index).slice(0, 4).sort(() => 0.5 - Math.random())
            });
          }
        }

        if (memory.title && memory.type) {
          questions.push({
            type: 'memory',
            question: `What type of file is "${memory.title}"?`,
            answer: memory.type,
            options: [memory.type, 'photo', 'video', 'audio'].filter((type, index, arr) => arr.indexOf(type) === index).slice(0, 4).sort(() => 0.5 - Math.random())
          });
        }
      });

      // If no user data, provide default questions
      if (questions.length === 0) {
        questions.push(
          {
            type: 'general',
            question: 'What should you do if you miss a medication dose?',
            answer: 'Take it as soon as you remember',
            options: ['Take it as soon as you remember', 'Skip it and wait for next dose', 'Take double dose next time', 'Stop taking the medication']
          },
          {
            type: 'general',
            question: 'How often should you review your medication list with your doctor?',
            answer: 'At every visit',
            options: ['At every visit', 'Once a year', 'Only when sick', 'Never needed']
          },
          {
            type: 'general',
            question: 'What is the most important thing to remember about emergency contacts?',
            answer: 'Keep them easily accessible',
            options: ['Keep them easily accessible', 'Memorize all numbers', 'Only use family members', 'Update them monthly']
          }
        );
      }

      // Shuffle and limit to 6 questions
      const shuffled = questions.sort(() => 0.5 - Math.random());
      res.json(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      res.status(500).json({ message: 'Failed to generate quiz questions' });
    }
  });

  // Emergency routes
  app.get('/api/emergency', ensureAuth, async (req: Request, res: Response) => {
    const alerts = await storage.getEmergencyAlerts(req.session.userId!);
    res.json(alerts);
  });

  app.post('/api/emergency', ensureAuth, async (req: Request, res: Response) => {
    try {
      const alert = await storage.createEmergencyAlert({
        user_id: req.session.userId!
      });

      // Emit emergency alert via socket.io
      io.to(`user_${req.session.userId}`).emit('emergency:alert', {
        id: alert.id,
        message: 'Emergency alert triggered',
        timestamp: alert.triggered_at
      });

      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create emergency alert' });
    }
  });

  app.post('/api/emergency/:id/resolve', ensureAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.resolveEmergencyAlert(id);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: 'Failed to resolve emergency alert' });
    }
  });

  // Identify route (for photo tagging and object recognition)
  app.post('/api/identify', ensureAuth, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Photo is required' });
      }

      const userId = req.session.userId!;
      const { tags, notes, linked_contact_id, detected_objects, visual_features } = req.body;

      // Store object recognition data if provided
      if (detected_objects && visual_features && tags) {
        const objectRecognition = await storage.createObjectRecognition({
          user_id: userId,
          photo_path: `/uploads/${req.file.filename}`,
          user_tag: tags,
          detected_objects: typeof detected_objects === 'string' ? detected_objects : JSON.stringify(detected_objects),
          visual_features: typeof visual_features === 'string' ? visual_features : JSON.stringify(visual_features),
          notes: notes || null,
          linked_contact_id: linked_contact_id ? parseInt(linked_contact_id) : null
        });

        res.json({
          id: objectRecognition.id,
          photo_path: `/uploads/${req.file.filename}`,
          message: 'Photo uploaded and tagged successfully',
          object_recognition: objectRecognition
        });
      } else {
        // Fallback for basic photo upload
        res.json({
          photo_path: `/uploads/${req.file.filename}`,
          message: 'Photo uploaded successfully'
        });
      }
    } catch (error) {
      console.error('Failed to process photo:', error);
      res.status(400).json({ message: 'Failed to upload photo' });
    }
  });

  // Get user's stored object recognitions
  app.get('/api/identify/objects', ensureAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const objects = await storage.getObjectRecognitions(userId);
      res.json(objects);
    } catch (error) {
      res.status(400).json({ message: 'Failed to get object recognitions' });
    }
  });

  // Find similar objects for recognition
  app.post('/api/identify/match', ensureAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { visual_features } = req.body;

      if (!visual_features) {
        return res.status(400).json({ message: 'Visual features required' });
      }

      const similarObjects = await storage.findSimilarObjects(userId, visual_features);
      res.json(similarObjects);
    } catch (error) {
      res.status(400).json({ message: 'Failed to find similar objects' });
    }
  });

  return httpServer;
}
