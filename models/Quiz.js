const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ 
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false }
    }],
    explanation: { type: String }, 
    points: { type: Number, default: 1 }
  }],
  timeLimit: { type: Number, default: 30 }, 
  passingScore: { type: Number, default: 70 }, 
  attemptsAllowed: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      selectedOption: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true }
    }],
    score: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
    attemptNumber: { type: Number, required: true }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);