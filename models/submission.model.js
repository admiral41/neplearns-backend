const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionSchema = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contents: {
      type: String,
      required: true,
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
    score: {
      type: Number,
      min: 0,
      max: 1000,
    },
    feedback: {
      type: String,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    gradedAt: {
      type: Date,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    penaltyApplied: {
      type: Number,
      default: 0,
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 1000,
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'returned', 'accepted', 'rejected'],
      default: 'submitted'
    }
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted score percentage
submissionSchema.virtual('scorePercentage').get(function() {
  if (!this.score || !this.assignment) return 0;
  // This would need population of assignment to calculate
  return Math.round((this.score / this.assignment.maxScore) * 100);
});

// Calculate final score with penalty
submissionSchema.methods.calculateFinalScore = function(assignment) {
  if (!this.score) return 0;

  let finalScore = this.score;

  if (this.isLate && assignment.lateSubmissionPenalty > 0) {
    const penalty = (this.score * assignment.lateSubmissionPenalty) / 100;
    finalScore = Math.max(0, this.score - penalty);
    this.penaltyApplied = assignment.lateSubmissionPenalty;
  }

  this.finalScore = finalScore;
  return finalScore;
};

// Hide sensitive data
submissionSchema.methods.toJSON = function () {
  let submission = this.toObject();
  delete submission.__v;
  return submission;
};

// Pre-save hook to check if submission is late
submissionSchema.pre('save', async function() {
  if (this.isModified('createdAt') || this.isNew) {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignment);

    if (assignment && this.createdAt > assignment.dueDate) {
      this.isLate = true;
    }
  }

});

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
