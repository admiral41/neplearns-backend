const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    // Payment info (for paid courses)
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['free', 'esewa', 'khalti', 'bank_transfer', 'cash', 'other'],
      default: 'free',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    transactionId: {
      type: String,
    },
    // Enrollment status
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped', 'expired'],
      default: 'active',
    },
    completedAt: {
      type: Date,
    },
    // Progress tracking
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Index for querying recent enrollments
enrollmentSchema.index({ course: 1, enrolledAt: -1 });
enrollmentSchema.index({ enrolledAt: -1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
