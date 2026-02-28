const RecurringSchedule = require('../../models/recurringSchedule.model');
const { generateSessionsFromSchedule } = require('../../services/recurringScheduleService');

/**
 * Define the session generation job
 * @param {Agenda} agenda - Agenda instance
 */
module.exports = function(agenda) {
  /**
   * Job: generate-upcoming-sessions
   * Generates tutoring sessions 2 weeks ahead from all active recurring schedules
   * Runs daily at midnight (scheduled in server.js)
   */
  agenda.define('generate-upcoming-sessions', { lockLifetime: 10 * 60 * 1000 }, async (job) => {
    console.log('=== Running session generation job ===');
    const startTime = Date.now();

    try {
      // Find all active, non-paused schedules
      const schedules = await RecurringSchedule.find({
        isActive: true,
        isPaused: false,
      });

      console.log(`Found ${schedules.length} active recurring schedules`);

      // Calculate 2 weeks from now
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + 14);

      let totalSessionsCreated = 0;
      let schedulesProcessed = 0;
      const errors = [];

      for (const schedule of schedules) {
        try {
          const sessions = await generateSessionsFromSchedule(schedule, untilDate);
          totalSessionsCreated += sessions.length;
          schedulesProcessed++;

          if (sessions.length > 0) {
            console.log(`  Schedule ${schedule._id}: Created ${sessions.length} sessions`);
          }
        } catch (err) {
          console.error(`  Error processing schedule ${schedule._id}:`, err.message);
          errors.push({ scheduleId: schedule._id, error: err.message });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`=== Session generation complete ===`);
      console.log(`  Processed: ${schedulesProcessed}/${schedules.length} schedules`);
      console.log(`  Created: ${totalSessionsCreated} sessions`);
      console.log(`  Duration: ${duration}ms`);

      if (errors.length > 0) {
        console.log(`  Errors: ${errors.length}`);
      }

      // Store job result for debugging
      job.attrs.result = {
        schedulesProcessed,
        totalSchedules: schedules.length,
        sessionsCreated: totalSessionsCreated,
        errors: errors.length,
        duration,
      };
      await job.save();

    } catch (err) {
      console.error('Session generation job failed:', err);
      throw err; // Rethrow to mark job as failed
    }
  });
};
