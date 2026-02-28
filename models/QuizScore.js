const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quizScoreSchema = new Schema(
    {
        user: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        score: { 
            type: Number, 
            default: 0 
        },
        percentage: {
            type: Number,
            default: 0
        },
        quiz: { 
            type: Schema.Types.ObjectId, 
            ref: "Quiz", 
            required: true 
        },
        logs: [{ 
            type: Schema.Types.ObjectId, 
            ref: "QuizLog", 
            default: [] 
        }],
        attemptNumber: {
            type: Number,
            default: 1
        },
        startedAt: {
            type: Date
        },
        completedAt: {
            type: Date
        },
        timeTaken: {
            type: Number 
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'abandoned', 'timeout'],
            default: 'in_progress'
        },
        answers: [{
            questionId: Schema.Types.ObjectId,
            answer: [String],
            selectedOptions: [String],
            selectedOption: String,
            isCorrect: Boolean,
            pointsEarned: Number,
            needsGrading: Boolean,
            feedback: String,
            maxPoints: Number
        }],
        totalQuestions: {
            type: Number,
            default: 0
        },
        maxScore: {
            type: Number,
            default: 0
        },
        isPassed: {
            type: Boolean,
            default: false
        },
        gradedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true,
    }
);

quizScoreSchema.index({ user: 1, quiz: 1, attemptNumber: 1 }, { unique: true });

quizScoreSchema.methods.toJSON = function () {
    let quizScore = this.toObject();
    delete quizScore.updatedAt;
    delete quizScore.__v;
    return quizScore;
};

module.exports = mongoose.model('QuizScore', quizScoreSchema);