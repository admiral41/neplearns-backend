const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    contents: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    maxScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 1000,
    },
    passingScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    week: {
      type: Schema.Types.ObjectId,
      ref: 'Week',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    lateSubmissionPenalty: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
    meta: {
      submissionsCount: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      lastSubmissionAt: {
        type: Date,
      }
    }
  },
  {
    timestamps: true,
  }
);

// Hide sensitive data
assignmentSchema.methods.toJSON = function () {
  let assignment = this.toObject();
  delete assignment.updatedAt;
  delete assignment.__v;
  return assignment;
};

// Update submissions count method
assignmentSchema.methods.updateSubmissionsCount = async function() {
  const Submission = mongoose.model('Submission');
  const submissionsCount = await Submission.countDocuments({ assignment: this._id });
  this.meta.submissionsCount = submissionsCount;
  await this.save();
  return submissionsCount;
};

// Update average score method
assignmentSchema.methods.updateAverageScore = async function() {
  const Submission = mongoose.model('Submission');
  const result = await Submission.aggregate([
    {
      $match: {
        assignment: this._id,
        score: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: "$score" },
        count: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    this.meta.averageScore = Math.round(result[0].averageScore * 10) / 10;
  } else {
    this.meta.averageScore = 0;
  }

  await this.save();
  return this.meta.averageScore;
};

// Check if assignment is open for submission
assignmentSchema.methods.isOpenForSubmission = function() {
  const now = new Date();
  if (!this.isActive) return false;

  if (this.allowLateSubmission) {
    return true;
  }

  return now <= this.dueDate;
};

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
