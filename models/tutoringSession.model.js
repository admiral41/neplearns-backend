const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tutoringSessionSchema = new Schema(
  {
    // Core relationships
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringEnrollment',
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringSubject',
      required: true,
    },

    // Scheduling
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 60, // minutes
    },
    meetingLink: {
      type: String,
      trim: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    startedAt: Date,
    endedAt: Date,
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Attendance tracking
    attendance: {
      type: String,
      enum: ['pending', 'present', 'absent'],
      default: 'pending',
    },
    attendanceMarkedAt: Date,

    // Optional notes
    notes: {
      type: String,
      trim: true,
    },

    // Link to recurring schedule (if session was auto-generated)
    recurringSchedule: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringSchedule',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: canJoin
 * Returns true if user can join the session
 * - Session is live (started early by instructor), OR
 * - Session is scheduled AND current time is between (scheduledAt - 15 min) and (scheduledAt + duration)
 */
tutoringSessionSchema.virtual('canJoin').get(function() {
  if (this.status === 'cancelled' || this.status === 'completed') return false;

  // If instructor started the session early, allow joining immediately
  if (this.status === 'live') return true;

  const now = new Date();
  const sessionStart = new Date(this.scheduledAt);
  const joinWindowStart = new Date(sessionStart.getTime() - 15 * 60 * 1000); // 15 min before
  const sessionEnd = new Date(sessionStart.getTime() + this.duration * 60 * 1000);

  return now >= joinWindowStart && now <= sessionEnd;
});

/**
 * Virtual: canMarkAttendance
 * Returns true if instructor can mark attendance
 * - Session is not cancelled
 * - Current time is between scheduledAt and (scheduledAt + duration + 24 hours)
 */
tutoringSessionSchema.virtual('canMarkAttendance').get(function() {
  if (this.status === 'cancelled') return false;

  // Live sessions can always have attendance marked (instructor started early)
  if (this.status === 'live') return true;

  const now = new Date();
  const sessionStart = new Date(this.scheduledAt);
  const attendanceDeadline = new Date(sessionStart.getTime() + (this.duration + 24 * 60) * 60 * 1000); // duration + 24 hours

  return now >= sessionStart && now <= attendanceDeadline;
});

/**
 * Virtual: endTime
 * Returns the calculated end time of the session
 */
tutoringSessionSchema.virtual('endTime').get(function() {
  if (!this.scheduledAt) return null;
  return new Date(this.scheduledAt.getTime() + this.duration * 60 * 1000);
});

// Indexes for efficient queries
tutoringSessionSchema.index({ instructor: 1, scheduledAt: -1 }); // Instructor sessions sorted by date
tutoringSessionSchema.index({ student: 1, scheduledAt: -1 }); // Student sessions sorted by date
tutoringSessionSchema.index({ status: 1, scheduledAt: 1 }); // Filter by status, sorted by date

const TutoringSession = mongoose.model('TutoringSession', tutoringSessionSchema);
TutoringSession.createIndexes();

module.exports = TutoringSession;
