const { getAgenda } = require('../jobs/agenda');
const TutoringSession = require('../models/tutoringSession.model');

/**
 * Schedule session reminders (24h and 1h before session)
 * @param {Object} session - TutoringSession document (with _id and scheduledAt)
 * @returns {Promise<number>} Count of reminders scheduled
 */
const scheduleSessionReminders = async (session) => {
  const agenda = getAgenda();
  if (!agenda) {
    console.warn('Agenda not initialized, skipping reminder scheduling');
    return 0;
  }

  const sessionTime = new Date(session.scheduledAt);
  const now = new Date();
  let count = 0;

  // 24-hour reminder
  const reminder24h = new Date(sessionTime.getTime() - 24 * 60 * 60 * 1000);
  if (reminder24h > now) {
    const job24h = agenda.create('send-session-reminder', {
      sessionId: session._id.toString(),
      reminderType: '24h'
    });
    await job24h.unique({ 'data.sessionId': session._id.toString(), 'data.reminderType': '24h' });
    job24h.schedule(reminder24h);
    await job24h.save();
    count++;
  }

  // 1-hour reminder
  const reminder1h = new Date(sessionTime.getTime() - 60 * 60 * 1000);
  if (reminder1h > now) {
    const job1h = agenda.create('send-session-reminder', {
      sessionId: session._id.toString(),
      reminderType: '1h'
    });
    await job1h.unique({ 'data.sessionId': session._id.toString(), 'data.reminderType': '1h' });
    job1h.schedule(reminder1h);
    await job1h.save();
    count++;
  }

  if (count > 0) {
    console.log(`Scheduled ${count} reminder(s) for session ${session._id}`);
  }

  return count;
};

/**
 * Cancel all reminder jobs for a session
 * @param {string|ObjectId} sessionId - Session ID
 * @returns {Promise<number>} Number of jobs cancelled
 */
const cancelSessionReminders = async (sessionId) => {
  const agenda = getAgenda();
  if (!agenda) {
    console.warn('Agenda not initialized, skipping reminder cancellation');
    return 0;
  }

  const result = await agenda.cancel({
    name: 'send-session-reminder',
    'data.sessionId': sessionId.toString()
  });

  if (result > 0) {
    console.log(`Cancelled ${result} reminder(s) for session ${sessionId}`);
  }

  return result;
};

module.exports = {
  scheduleSessionReminders,
  cancelSessionReminders
};
