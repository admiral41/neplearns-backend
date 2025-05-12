const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructions: { type: String, required: true }, 
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  dueDate: { type: Date, required: true },
  points: { type: Number, required: true, default: 100 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: String },
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number, min: 0 },
    feedback: { type: String },
    gradedAt: { type: Date }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);