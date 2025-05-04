const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructions: String,
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  dueDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{
    path: String,
    originalName: String
  }],
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    files: [{
      path: String,
      originalName: String
    }],
    submittedAt: { type: Date, default: Date.now },
    grade: Number,
    feedback: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);