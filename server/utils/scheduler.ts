import cron from 'node-cron';
import { db } from '../db';
import { reminders } from '@shared/schema';
import { eq, and, lte } from 'drizzle-orm';
import { Server } from 'socket.io';

let io: Server;

export function initializeScheduler(socketServer: Server) {
  io = socketServer;
  
  // Check for due reminders every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const dueReminders = await db
        .select()
        .from(reminders)
        .where(
          and(
            eq(reminders.active, true),
            lte(reminders.next_run_at, now)
          )
        );

      for (const reminder of dueReminders) {
        // Emit reminder via socket.io
        io.to(`user_${reminder.user_id}`).emit('reminder:due', {
          id: reminder.id,
          title: reminder.title,
          type: reminder.type,
        });

        console.log(`Reminder fired: ${reminder.title} for user ${reminder.user_id}`);

        // Calculate next run time based on cron expression
        // For simplicity, we'll add 1 day for now
        const nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + 1);

        await db
          .update(reminders)
          .set({ next_run_at: nextRun })
          .where(eq(reminders.id, reminder.id));
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
}
