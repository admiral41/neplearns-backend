const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const weekSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true,
});

// Hide sensitive data
weekSchema.methods.toJSON = function() {
  let week = this.toObject();
  delete week.__v;
  delete week.updatedAt;
  return week;
};

// Ensure unique week number per course
weekSchema.index({ course: 1, weekNumber: 1 }, { unique: true });
weekSchema.index({ course: 1, order: 1 }, { unique: true });

const Week = mongoose.model('Week', weekSchema);
module.exports = Week;