const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tutoringRequestSchema = new Schema(
  {
    // Core fields
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
    status: {
      type: String,
      enum: ['pending', 'assigned', 'rejected', 'enrolled'],
      default: 'pending',
    },
    preferredTimeSlots: [{
      type: String,
      trim: true,
    }],
    message: {
      type: String,
      trim: true,
    },

    // Assignment fields (set when admin assigns)
    assignedInstructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Rejection fields (set when admin rejects)
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Enrollment fields (set when trial completes - Phase 3)
    enrolledAt: {
      type: Date,
      default: null,
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'TutoringEnrollment',
      default: null,
    },

    // Internal
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tutoringRequestSchema.index({ student: 1, status: 1 }); // for "my requests" queries
tutoringRequestSchema.index({ status: 1, createdAt: -1 }); // for admin listing
tutoringRequestSchema.index({ subject: 1 }); // for subject filtering
tutoringRequestSchema.index({ assignedInstructor: 1 }); // for instructor queries

// Partial unique index: prevent duplicate pending requests for same student+subject
tutoringRequestSchema.index(
  { student: 1, subject: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

// Hide sensitive/internal data from JSON responses
tutoringRequestSchema.methods.toJSON = function () {
  let request = this.toObject();
  delete request.__v;
  delete request.adminNotes; // hide internal notes from non-admin responses
  return request;
};

const TutoringRequest = mongoose.model('TutoringRequest', tutoringRequestSchema);
TutoringRequest.createIndexes();

module.exports = TutoringRequest;
