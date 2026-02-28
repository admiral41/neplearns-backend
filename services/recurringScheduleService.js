const { RRule } = require('rrule');
const RecurringSchedule = require('../models/recurringSchedule.model');
const TutoringSession = require('../models/tutoringSession.model');
const reminderService = require('./reminderService');

/**
 * Map JavaScript day numbers (0=Sunday) to rrule weekdays
 */
const weekdayMap = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

/**
 * Create a weekly rrule string from schedule parameters
 * @param {number[]} daysOfWeek - Array of day numbers (0=Sunday through 6=Saturday)
 * @param {string} startTime - Time in "HH:MM" format
 * @param {Date} startDate - Start date for the rule
 * @param {Date} [endDate] - Optional end date for the rule
 * @returns {string} rrule string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=16;BYMINUTE=0")
 */
const createWeeklyRule = (daysOfWeek, startTime, startDate, endDate = null) => {
  const [hours, minutes] = startTime.split(':').map(Number);

  // Map day numbers to rrule weekdays
  const byweekday = daysOfWeek.map(d => weekdayMap[d]);

  const ruleOptions = {
    freq: RRule.WEEKLY,
    byweekday,
    byhour: [hours],
    byminute: [minutes],
    dtstart: new Date(startDate),
    tzid: 'Asia/Kathmandu',
  };

  // Add end date if provided
  if (endDate) {
    ruleOptions.until = new Date(endDate);
  }

  const rule = new RRule(ruleOptions);
  return rule.toString();
};

/**
 * Generate tutoring sessions from a recurring schedule
 * @param {Object} schedule - RecurringSchedule document
 * @param {Date} untilDate - Generate sessions up to this date
 * @returns {Promise<Object[]>} Array of created sessions
 */
const generateSessionsFromSchedule = async (schedule, untilDate) => {
  // Parse the rrule string
  const rule = RRule.fromString(schedule.rruleString);

  // Determine start point for generation
  const startFrom = schedule.lastGeneratedUntil
    ? new Date(schedule.lastGeneratedUntil.getTime() + 1) // Avoid duplicates
    : new Date(schedule.startDate);

  // Ensure we don't go before now (for new schedules)
  const effectiveStart = startFrom < new Date() ? new Date() : startFrom;

  // Get all occurrences in the range
  const occurrences = rule.between(effectiveStart, untilDate, true);

  // Respect endDate if set
  const validOccurrences = schedule.endDate
    ? occurrences.filter(o => o <= schedule.endDate)
    : occurrences;

  const sessionsToCreate = [];

  for (const occurrence of validOccurrences) {
    // Idempotency check: verify session doesn't already exist
    const existing = await TutoringSession.findOne({
      enrollment: schedule.enrollment,
      scheduledAt: occurrence,
      status: { $ne: 'cancelled' },
    });

    if (!existing) {
      sessionsToCreate.push({
        enrollment: schedule.enrollment,
        student: schedule.student,
        instructor: schedule.instructor,
        subject: schedule.subject,
        scheduledAt: occurrence,
        duration: schedule.duration,
        recurringSchedule: schedule._id,
        status: 'scheduled',
        attendance: 'pending',
      });
    }
  }

  let createdSessions = [];

  if (sessionsToCreate.length > 0) {
    // Bulk insert for efficiency
    createdSessions = await TutoringSession.insertMany(sessionsToCreate);

    // Schedule reminders for all newly created sessions
    for (const session of createdSessions) {
      try {
        await reminderService.scheduleSessionReminders(session);
      } catch (reminderErr) {
        console.error(`Failed to schedule reminders for session ${session._id}:`, reminderErr);
        // Don't fail session generation if reminder scheduling fails
      }
    }

    // Update lastGeneratedUntil
    await RecurringSchedule.updateOne(
      { _id: schedule._id },
      { lastGeneratedUntil: untilDate }
    );
  }

  return createdSessions;
};

/**
 * Get human-readable description of schedule
 * @param {Object} schedule - RecurringSchedule document
 * @returns {string} Description like "Monday, Wednesday at 16:00"
 */
const getScheduleDescription = (schedule) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days = schedule.daysOfWeek.map(d => dayNames[d]).join(', ');
  return `${days} at ${schedule.startTime}`;
};

module.exports = {
  createWeeklyRule,
  generateSessionsFromSchedule,
  getScheduleDescription,
};
