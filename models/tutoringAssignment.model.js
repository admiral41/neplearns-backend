const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attachmentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
}, { _id: false });

const revisionHistorySchema = new Schema({
  type: {
    type: String,
    enum: ['submission', 'revision_request'],
    required: true,
  },
  content: { type: String, trim: true },
  attachments: [attachmentSchema],
  createdAt: { type: Date, default: Date.now },
  by: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const tutoringAssignmentSchema = new Schema(
  {
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    attachments: [attachmentSchema],
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'submitted', 'revision_requested', 'reviewed'],
      default: 'active',
    },
    submission: {
      content: { type: String, trim: true },
      attachments: [attachmentSchema],
      submittedAt: { type: Date },
    },
    feedback: {
      content: { type: String, trim: true },
      givenAt: { type: Date },
    },
    revisionHistory: [revisionHistorySchema],
    revisionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: isOverdue
 * Returns true if assignment has a due date, no submission, and due date has passed
 */
tutoringAssignmentSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  if (this.submission && this.submission.submittedAt) return false;
  return new Date() > this.dueDate;
});

// Indexes for efficient queries
tutoringAssignmentSchema.index({ instructor: 1, createdAt: -1 });
tutoringAssignmentSchema.index({ student: 1, createdAt: -1 });
tutoringAssignmentSchema.index({ enrollment: 1, createdAt: -1 });

const TutoringAssignment = mongoose.model('TutoringAssignment', tutoringAssignmentSchema);
TutoringAssignment.createIndexes();

module.exports = TutoringAssignment;
