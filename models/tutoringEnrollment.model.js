const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Status history sub-schema for tracking all status changes
const statusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ['trial', 'pending', 'active', 'expired', 'paused', 'cancelled'],
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  note: String,
}, { _id: false });

const tutoringEnrollmentSchema = new Schema(
  {
    // Link to original request
    request: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringRequest',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringSubject',
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Trial period (2 days per CONTEXT.md)
    trialStartedAt: {
      type: Date,
      default: Date.now,
    },
    trialEndsAt: {
      type: Date,
      required: true,
    },

    // Subscription period (1 month per CONTEXT.md)
    currentPeriodStart: Date,
    currentPeriodEnd: Date,

    // Admin-controlled status (for pause/cancel actions)
    adminStatus: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
    },

    // Payment status (links to Phase 4)
    paymentStatus: {
      type: String,
      enum: ['none', 'pending_verification', 'verified', 'failed'],
      default: 'none',
    },
    latestPayment: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringPayment', // Phase 4
    },

    // Status history for timeline display
    statusHistory: [statusHistorySchema],

    // Pricing snapshot at enrollment time
    monthlyPrice: {
      type: Number,
      required: true,
    },
    // Platform fee snapshot at enrollment time
    platformFeePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 15,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Computed status based on dates and admin actions
tutoringEnrollmentSchema.virtual('status').get(function() {
  const now = new Date();

  // Admin overrides first
  if (this.adminStatus === 'cancelled') return 'cancelled';
  if (this.adminStatus === 'paused') return 'paused';

  // Active subscription (payment verified) takes priority over trial
  if (this.paymentStatus === 'verified' && this.currentPeriodEnd && now < this.currentPeriodEnd) {
    return 'active';
  }

  // Trial period check (only if not yet paid)
  if (this.trialEndsAt && now < this.trialEndsAt) {
    return 'trial';
  }

  // Payment pending verification
  if (this.paymentStatus === 'pending_verification') {
    return 'pending';
  }

  // Active subscription (fallback for admin-activated without payment)
  if (this.currentPeriodEnd && now < this.currentPeriodEnd) {
    return 'active';
  }

  // Grace period (3 days after expiry per CONTEXT.md)
  if (this.currentPeriodEnd) {
    const graceEnd = new Date(this.currentPeriodEnd);
    graceEnd.setDate(graceEnd.getDate() + 3);
    if (now < graceEnd) {
      return 'expired_grace';
    }
  }

  return 'expired';
});

// Calculate if trial ends today (for payment nudge per CONTEXT.md)
tutoringEnrollmentSchema.virtual('isLastTrialDay').get(function() {
  if (!this.trialEndsAt) return false;
  const now = new Date();
  const trialEnd = new Date(this.trialEndsAt);
  return now.toDateString() === trialEnd.toDateString();
});

// Calculate days until subscription expires (for 7-day warning per CONTEXT.md)
tutoringEnrollmentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.currentPeriodEnd) return null;
  const now = new Date();
  const end = new Date(this.currentPeriodEnd);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Check if in grace period
tutoringEnrollmentSchema.virtual('isInGracePeriod').get(function() {
  return this.status === 'expired_grace';
});

// Check if fully locked (past grace period or cancelled)
tutoringEnrollmentSchema.virtual('isLocked').get(function() {
  return this.status === 'expired' || this.status === 'cancelled';
});

// Indexes for efficient queries
tutoringEnrollmentSchema.index({ student: 1, status: 1 }); // for "my subscriptions"
tutoringEnrollmentSchema.index({ instructor: 1 });
tutoringEnrollmentSchema.index({ subject: 1 });
tutoringEnrollmentSchema.index({ trialEndsAt: 1 });
tutoringEnrollmentSchema.index({ currentPeriodEnd: 1 });

// Unique constraint: one enrollment per student per subject
tutoringEnrollmentSchema.index({ student: 1, subject: 1 }, { unique: true });

const TutoringEnrollment = mongoose.model('TutoringEnrollment', tutoringEnrollmentSchema);
TutoringEnrollment.createIndexes();

module.exports = TutoringEnrollment;
