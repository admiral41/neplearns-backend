const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lessonStatusSchema = new Schema(
  {
    learner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    timeSpent: {
      type: Number, 
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true,
  }
);

lessonStatusSchema.index({ learner: 1, lesson: 1 }, { unique: true });

lessonStatusSchema.index({ learner: 1, isCompleted: 1 });

lessonStatusSchema.index({ lesson: 1, isCompleted: 1 });

lessonStatusSchema.virtual('calculatedTimeSpent').get(function() {
  if (this.startDate && this.endDate) {
    const duration = (new Date(this.endDate) - new Date(this.startDate)) / 1000 / 60; 
    return Math.round(duration);
  }
  return this.timeSpent || 0;
});

// Method to mark as complete
lessonStatusSchema.methods.markComplete = function() {
  this.isCompleted = true;
  this.completionPercentage = 100;
  this.endDate = new Date();
  if (!this.startDate) {
    this.startDate = new Date();
  }
  if (this.startDate && this.endDate) {
    this.timeSpent = Math.round((this.endDate - this.startDate) / 1000 / 60);
  }
  return this.save();
};

// Method to mark as incomplete
lessonStatusSchema.methods.markIncomplete = function() {
  this.isCompleted = false;
  this.completionPercentage = 0;
  this.endDate = null;
  return this.save();
};

lessonStatusSchema.methods.updateProgress = function(percentage) {
  this.completionPercentage = Math.min(Math.max(percentage, 0), 100);
  this.lastAccessedAt = new Date();
  if (!this.startDate) {
    this.startDate = new Date();
  }
  return this.save();
};

lessonStatusSchema.methods.toJSON = function() {
  let lessonStatus = this.toObject({ virtuals: true });
  delete lessonStatus.createdAt;
  delete lessonStatus.updatedAt;
  delete lessonStatus.__v;
  return lessonStatus;
};

lessonStatusSchema.pre('save', function() {
  if (this.isModified('isCompleted') || this.isModified('completionPercentage')) {
    this.lastAccessedAt = new Date();
  }
});

const LessonStatus = mongoose.model('lesson_status', lessonStatusSchema);
module.exports = LessonStatus;