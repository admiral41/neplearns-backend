const TutoringSession = require('../../models/tutoringSession.model');

/**
 * Define the session reminder job
 * @param {Agenda} agenda - Agenda instance
 */
module.exports = function(agenda) {
  agenda.define('send-session-reminder', { lockLifetime: 60000 }, async (job) => {
    const { sessionId, reminderType } = job.attrs.data;

    console.log(`Processing ${reminderType} reminder for session ${sessionId}`);

    try {
      const session = await TutoringSession.findById(sessionId)
        .populate('student', 'firstname lastname')
        .populate('instructor', 'firstname lastname')
        .populate('subject', 'name');

      // Skip if session not found or cancelled
      if (!session) {
        console.log(`Session ${sessionId} not found, skipping reminder`);
        return;
      }

      if (session.status === 'cancelled') {
        console.log(`Session ${sessionId} is cancelled, skipping reminder`);
        return;
      }

      // Send notifications
      const notificationService = require('../../services/notificationService');
      await notificationService.notifySessionReminder(session, reminderType);

      console.log(`Sent ${reminderType} reminder for session ${sessionId}`);
    } catch (error) {
      console.error(`Error sending ${reminderType} reminder for session ${sessionId}:`, error);
      throw error; // Let Agenda handle retry
    }
  });
};
