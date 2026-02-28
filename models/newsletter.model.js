const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Newsletter = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        name: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['active', 'unsubscribed'],
            default: 'active'
        },
        subscriptionSource: {
            type: String,
            enum: ['website', 'landing-page', 'manual', 'other'],
            default: 'website'
        },
        unsubscribedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
    }
);

// Index for faster status lookups
Newsletter.index({ status: 1 });

// Hide some attributes while sending json response
Newsletter.methods.toJSON = function () {
    let newsletter = this.toObject();
    delete newsletter.updatedAt;
    delete newsletter.__v;
    return newsletter;
};

module.exports = mongoose.model('Newsletter', Newsletter);
