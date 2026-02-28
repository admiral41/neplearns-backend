const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recurringScheduleSchema = new Schema(
  {
    // Core relationships
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringEnrollment',
      required: true,
      unique: true, // One schedule per enrollment
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

    // rrule string (RFC 5545 format)
    // e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=16;BYMINUTE=0"
    rruleString: {
      type: String,
      required: true,
    },

    // Denormalized fields for display purposes
    daysOfWeek: [{
      type: Number,
      min: 0, // 0=Sunday
      max: 6, // 6=Saturday
    }],
    startTime: {
      type: String, // "HH:MM" format
      required: true,
    },
    duration: {
      type: Number,
      default: 60, // minutes
    },
    timezone: {
      type: String,
      default: 'Asia/Kathmandu',
    },

    // Lifecycle
    isActive: {
      type: Boolean,
      default: true,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date, // null = indefinite
    },

    // Generation tracking
    lastGeneratedUntil: {
      type: Date, // Tracks how far ahead sessions have been generated
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding active schedules by instructor
recurringScheduleSchema.index({ instructor: 1, isActive: 1 });

// Index for student schedules
recurringScheduleSchema.index({ student: 1, isActive: 1 });

// Index for generation job (find all active, non-paused schedules)
recurringScheduleSchema.index({ isActive: 1, isPaused: 1 });

const RecurringSchedule = mongoose.model('RecurringSchedule', recurringScheduleSchema);
RecurringSchedule.createIndexes();

module.exports = RecurringSchedule;
