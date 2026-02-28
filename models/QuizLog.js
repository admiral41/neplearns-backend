const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionLogSchema = new Schema(
    {
        questionId: { 
            type: Schema.Types.ObjectId, 
            ref: 'QuizQuestion' 
        },
        answer: [{ 
            type: String 
        }],
        selectedOptions: [{
            type: String
        }],
        selectedOption: {
            type: String
        },
        isCorrect: {
            type: Boolean, 
            default: false
        },
        pointsEarned: {
            type: Number,
            default: 0
        },
        timeSpent: {
            type: Number, 
            default: 0
        },
        needsGrading: {
            type: Boolean,
            default: false
        },
        feedback: {
            type: String
        },
        gradedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        gradedAt: {
            type: Date
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

questionLogSchema.methods.toJSON = function () {
    let questionLog = this.toObject();
    delete questionLog.updatedAt;
    delete questionLog.__v;
    return questionLog;
};

const QuizLog = mongoose.model('QuizLog', questionLogSchema);
module.exports = QuizLog;