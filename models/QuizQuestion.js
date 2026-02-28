const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quizQuestionSchema = new Schema(
    {
        questionText: {
            type: String,
            required: true,
        },
        questionType: {
            type: String,
            required: true,
            default: "single_choice",
            enum: ['single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay']
        },
        options: [{
            text: {
                type: String,
                required: true
            },
            isCorrect: {
                type: Boolean,
                default: false
            }
        }],
        correctAnswers: [{
            type: String
        }],
        explanation: {
            type: String
        },
        points: {
            type: Number,
            default: 1,
            min: 0
        },
        tags: [String],
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        quiz: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz'
        },
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        order: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        maxPoints: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true,
    }   
);

quizQuestionSchema.methods.toJSON = function () {
    let question = this.toObject();
    delete question.updatedAt;
    delete question.__v;
    delete question.addedBy;
    delete question.quiz;
    // Don't expose correct answers by default
    if (question.options) {
        question.options = question.options.map(opt => ({
            text: opt.text,
            _id: opt._id
        }));
    }
    delete question.correctAnswers;
    return question;
};

// Method for admins/teachers to get with answers
quizQuestionSchema.methods.toJSONWithAnswers = function () {
    let question = this.toObject();
    delete question.updatedAt;
    delete question.__v;
    return question;
};

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
module.exports = QuizQuestion;