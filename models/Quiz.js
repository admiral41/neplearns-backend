const mongoose = require('mongoose')
const Schema = mongoose.Schema

const quizSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    instructions: {
      type: String
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        default: [],
      },
    ],
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    week: {
      type: Schema.Types.ObjectId,
      ref: 'Week',
      required: false
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: false
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    duration: {
      type: Number, 
      default: 30
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1
    },
    passingScore: {
      type: Number,
      default: 50 
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    isTimed: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    requiresGrading: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
)

// Calculate total points before saving
quizSchema.pre('save', async function() {
  if (this.questions && this.questions.length > 0) {
    const questions = await mongoose.model('QuizQuestion').find({ _id: { $in: this.questions } });
    this.totalPoints = questions.reduce((total, q) => total + (q.points || 1), 0);
    
    // Check if any questions require manual grading
    this.requiresGrading = questions.some(q => 
      q.questionType === 'essay' || q.questionType === 'short_answer'
    );
  } else {
    this.totalPoints = 0;
    this.requiresGrading = false;
  }
});

quizSchema.methods.toJSON = function () {
  let quiz = this.toObject()
  delete quiz.updatedAt
  delete quiz.__v
  return quiz
}

const Quiz = mongoose.model('Quiz', quizSchema)
module.exports = Quiz